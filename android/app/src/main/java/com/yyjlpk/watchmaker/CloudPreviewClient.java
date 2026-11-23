package com.yyjlpk.watchmaker;

import android.util.Base64;
import android.webkit.CookieManager;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.regex.Pattern;

final class CloudPreviewClient {
    private static final String ORIGIN = "https://watchmaker.cilaapps.workers.dev";
    private static final String API = "/api/watchface-preview";
    private static final String PERSONAL = API + "/personal";
    private static final Pattern PERSONAL_RESULT = Pattern.compile(PERSONAL + "/[0-9a-f]{32}");
    private static final String SESSION_COOKIE = "__Host-watchmaker-preview=";
    private static final Pattern READ_PATH = Pattern.compile(
            API + "/(?:config|[0-9a-f]{32})|/p/[0-9a-f]{32}\\.png");
    private static final int MAX_PROJECT_BYTES = 3 * 1024 * 1024;
    private static final int MAX_IMAGE_BYTES = 256 * 1024;
    private static final int MAX_INSTALL_BYTES = 8 * 1024 * 1024;
    private static final int MAX_JSON_BYTES = 8 * 1024;

    private CloudPreviewClient() {}

    static boolean accepts(String path, String archive, String accessCode) {
        if (path == null || archive == null || accessCode == null) return false;
        if (PERSONAL.equals(path)) return !archive.isEmpty() && archive.length() <= MAX_PROJECT_BYTES / 3 * 4
                && accessCode.isEmpty();
        if (PERSONAL_RESULT.matcher(path).matches()) return archive.isEmpty() && accessCode.matches("[0-9a-f]{32}");
        if (API.equals(path)) {
            return !archive.isEmpty() && archive.length() <= MAX_PROJECT_BYTES / 3 * 4
                    && accessCode.matches("[\\x21-\\x7e]{0,256}");
        }
        return archive.isEmpty() && accessCode.isEmpty() && READ_PATH.matcher(path).matches();
    }

    static boolean isPersonal(String path) {
        return path.equals(PERSONAL) || PERSONAL_RESULT.matcher(path).matches();
    }

    static JSONObject request(String path, String archive, String accessCode, ZeppAccount account) throws Exception {
        boolean personal = isPersonal(path);
        boolean upload = API.equals(path) || PERSONAL.equals(path);
        boolean image = path.startsWith("/p/");
        byte[] project = upload ? Base64.decode(archive, Base64.DEFAULT) : null;
        HttpURLConnection connection = (HttpURLConnection) new URL(ORIGIN + path).openConnection();
        try {
            connection.setInstanceFollowRedirects(false);
            connection.setConnectTimeout(12000);
            connection.setReadTimeout(20000);
            connection.setUseCaches(false);

            CookieManager cookies = CookieManager.getInstance();
            String session = personal ? null : cookies.getCookie(ORIGIN);
            if (session != null) connection.setRequestProperty("Cookie", session);
            if (upload) {
                connection.setRequestMethod("POST");
                connection.setDoOutput(true);
                connection.setRequestProperty("Content-Type", "application/zip");
                connection.setFixedLengthStreamingMode(project.length);
            }
            if (!accessCode.isEmpty()) connection.setRequestProperty("Authorization", "Bearer " + accessCode);
            if (upload) {
                try (OutputStream output = connection.getOutputStream()) {
                    output.write(project);
                }
            }

            int status = connection.getResponseCode();
            String cookie = connection.getHeaderField("Set-Cookie");
            if (upload && status == 202 && cookie != null && cookie.startsWith(SESSION_COOKIE)) {
                cookies.setCookie(ORIGIN, cookie);
                cookies.flush();
            }

            JSONObject result = new JSONObject().put("status", status);
            if (status < 200 || status >= 300 || status == 204) return result;
            if (personal && !upload) {
                if (!"application/zip".equalsIgnoreCase(connection.getContentType())) {
                    throw new IOException("Unexpected install package type");
                }
                try (InputStream input = connection.getInputStream()) {
                    byte[] bytes = readBounded(input, MAX_INSTALL_BYTES);
                    if (bytes.length < 4 || bytes[0] != 80 || bytes[1] != 75 || bytes[2] != 3 || bytes[3] != 4) {
                        throw new IOException("Invalid install package");
                    }
                    String link = account.publish(bytes);
                    byte[] json = new JSONObject().put("link", link).toString()
                            .getBytes(java.nio.charset.StandardCharsets.UTF_8);
                    return result.put("type", "application/json").put("body", Base64.encodeToString(json, Base64.NO_WRAP));
                }
            }
            String mimeType = image ? "image/png" : "application/json";
            String contentType = connection.getContentType();
            if (contentType == null || !mimeType.equalsIgnoreCase(contentType.split(";", 2)[0].trim())) {
                throw new IOException("Unexpected preview content type");
            }
            try (InputStream input = connection.getInputStream()) {
                byte[] body = readBounded(input, image ? MAX_IMAGE_BYTES : MAX_JSON_BYTES);
                return result.put("type", mimeType).put("body", Base64.encodeToString(body, Base64.NO_WRAP));
            }
        } finally {
            connection.disconnect();
        }
    }

    static byte[] readBounded(InputStream input, int limit) throws IOException {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        byte[] buffer = new byte[8192];
        for (int count; (count = input.read(buffer)) != -1;) {
            if (output.size() + count > limit) throw new IOException("Preview response is too large");
            output.write(buffer, 0, count);
        }
        return output.toByteArray();
    }
}
