package com.yyjlpk.watchmaker;

import android.content.Context;
import android.net.Uri;
import android.os.SystemClock;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.SocketTimeoutException;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.util.Arrays;
import java.util.UUID;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

final class ZeppAccount {
    private static final String STORAGE = "zepp-preview-account";
    private final String token;
    private final String userId;
    private final String host;

    private ZeppAccount(String token, String userId, String host) {
        this.token = token;
        this.userId = userId;
        this.host = host;
    }

    static ZeppAccount restore(Context context) {
        String encoded = context.getSharedPreferences(STORAGE, Context.MODE_PRIVATE).getString("session", "");
        if (encoded.isEmpty()) return null;
        try {
            byte[] encrypted = Base64.decode(encoded, Base64.NO_WRAP);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, storageKey(), new GCMParameterSpec(128, Arrays.copyOf(encrypted, 12)));
            JSONObject fields = new JSONObject(new String(cipher.doFinal(encrypted, 12, encrypted.length - 12),
                    StandardCharsets.UTF_8));
            return new ZeppAccount(fields.getString("token"), fields.getString("user"), fields.getString("host"));
        } catch (Exception failure) {
            forget(context);
            return null;
        }
    }

    void remember(Context context) {
        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, storageKey());
            byte[] content = new JSONObject().put("token", token).put("user", userId).put("host", host)
                    .toString().getBytes(StandardCharsets.UTF_8);
            byte[] encrypted = cipher.doFinal(content);
            ByteArrayOutputStream stored = new ByteArrayOutputStream();
            stored.write(cipher.getIV());
            stored.write(encrypted);
            context.getSharedPreferences(STORAGE, Context.MODE_PRIVATE).edit()
                    .putString("session", Base64.encodeToString(stored.toByteArray(), Base64.NO_WRAP)).apply();
        } catch (Exception failure) {
            forget(context);
        }
    }

    static void forget(Context context) {
        context.getSharedPreferences(STORAGE, Context.MODE_PRIVATE).edit().remove("session").apply();
    }

    private static SecretKey storageKey() throws Exception {
        KeyStore store = KeyStore.getInstance("AndroidKeyStore");
        store.load(null);
        SecretKey key = (SecretKey) store.getKey(STORAGE, null);
        if (key != null) return key;
        KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
        generator.init(new KeyGenParameterSpec.Builder(STORAGE, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256).build());
        return generator.generateKey();
    }

    static final class Login implements AutoCloseable {
        private final ServerSocket server = new ServerSocket(0, 4, InetAddress.getByName("127.0.0.1"));
        private final String callback = "/login/callback/" + UUID.randomUUID();

        Login() throws IOException {}

        Uri url() {
            return Uri.parse("https://user.zepp.com/universalLogin/index.html#/login"
                    + "?project_name=zeppos_zeus_cli&platform_app=com.huami.webapp&project_redirect_uri="
                    + Uri.encode("http://localhost:" + server.getLocalPort() + callback));
        }

        ZeppAccount waitForAccount() throws IOException {
            server.setSoTimeout(500);
            long deadline = SystemClock.elapsedRealtime() + 5 * 60 * 1000;
            while (SystemClock.elapsedRealtime() < deadline) {
                try (Socket connection = server.accept()) {
                    connection.setSoTimeout(1500);
                    InputStream input = connection.getInputStream();
                    String[] start = readLine(input).split(" ");
                    for (int headers = 0; headers < 64 && !readLine(input).isEmpty(); headers++) {
                        if (headers == 63) throw new IOException("Too many login headers");
                    }
                    Uri request = start.length == 3 && "GET".equals(start[0]) && start[1].startsWith("/")
                            ? Uri.parse(start[1]) : Uri.EMPTY;
                    ZeppAccount account = callback.equals(request.getPath()) ? fromCallback(request) : null;
                    OutputStream output = connection.getOutputStream();
                    if (account == null) {
                        output.write(("HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\nConnection: close\r\n\r\n")
                                .getBytes(StandardCharsets.US_ASCII));
                        continue;
                    }
                    byte[] page = ("<!doctype html><meta charset=utf-8><meta name=viewport content='width=device-width'>"
                            + "<script>history.replaceState(null,'','/login-complete')</script>"
                            + "<title>워치메이커</title><h1>Zepp 로그인 완료</h1>"
                            + "<p><a href='intent://login-complete#Intent;scheme=watchmaker;"
                            + "package=com.yyjlpk.watchmaker;launchFlags=0x24000000;end'>워치메이커로 돌아가기</a></p>")
                            .getBytes(StandardCharsets.UTF_8);
                    output.write(("HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\n"
                            + "Cache-Control: no-store\r\nReferrer-Policy: no-referrer\r\nConnection: close\r\n"
                            + "Content-Length: " + page.length + "\r\n\r\n").getBytes(StandardCharsets.US_ASCII));
                    output.write(page);
                    output.flush();
                    return account;
                } catch (SocketTimeoutException ignored) {
                    // A browser may open more than one local connection.
                }
            }
            return null;
        }

        @Override public void close() throws IOException {
            server.close();
        }
    }

    private static String readLine(InputStream input) throws IOException {
        ByteArrayOutputStream line = new ByteArrayOutputStream();
        for (int next; (next = input.read()) != -1 && next != '\n';) {
            if (line.size() >= 8192) throw new IOException("Login request is too large");
            if (next != '\r') line.write(next);
        }
        return line.toString(StandardCharsets.US_ASCII.name());
    }

    private static ZeppAccount fromCallback(Uri uri) {
        String token = uri.getQueryParameter("apptoken");
        String userId = uri.getQueryParameter("userid");
        String regions = uri.getQueryParameter("cname");
        if (token == null || !token.matches("[\\x21-\\x7e]{8,4096}")
                || userId == null || !userId.matches("[0-9]{1,30}") || regions == null) return null;
        for (String host : regions.split(",")) {
            if (host.matches("api-mifit[a-z0-9-]*\\.(?:zepp|huami)\\.com")) {
                return new ZeppAccount(token, userId, host);
            }
        }
        return null;
    }

    String publish(byte[] archive) throws Exception {
        HttpURLConnection connection = (HttpURLConnection) new URL(
                "https://" + host + "/custom/tools/app-dial/upload?userid=" + userId).openConnection();
        try {
            String boundary = "watchmaker-" + UUID.randomUUID();
            byte[] before = ("--" + boundary + "\r\nContent-Disposition: form-data; name=\"file\"; "
                    + "filename=\"watchface.zab\"\r\nContent-Type: application/octet-stream\r\n\r\n")
                    .getBytes(StandardCharsets.US_ASCII);
            byte[] after = ("\r\n--" + boundary + "\r\nContent-Disposition: form-data; name=\"app_type\"\r\n\r\n1"
                    + "\r\n--" + boundary + "--\r\n").getBytes(StandardCharsets.US_ASCII);
            connection.setInstanceFollowRedirects(false);
            connection.setConnectTimeout(12000);
            connection.setReadTimeout(25000);
            connection.setRequestMethod("POST");
            connection.setDoOutput(true);
            connection.setRequestProperty("Content-Type", "multipart/form-data; boundary=" + boundary);
            connection.setRequestProperty("apptoken", token);
            connection.setFixedLengthStreamingMode(before.length + archive.length + after.length);
            try (OutputStream output = connection.getOutputStream()) {
                output.write(before);
                output.write(archive);
                output.write(after);
            }
            int status = connection.getResponseCode();
            if (status == 401 || status == 403) throw new Expired();
            if (status != 200) throw new IOException("Zepp package upload failed");
            try (InputStream input = connection.getInputStream()) {
                JSONObject response = new JSONObject(new String(CloudPreviewClient.readBounded(input, 8192),
                        StandardCharsets.UTF_8));
                String protocol = response.optString("protocol");
                String code = response.optString("code");
                if (!("zpkd1".equals(protocol) || "watchface".equals(protocol))
                        || !code.matches("[A-Za-z0-9_.~%-]{1,512}")) throw new IOException("Invalid Zepp response");
                return protocol + "://" + host + "/custom/tools/app-dial/download/" + code;
            }
        } finally {
            connection.disconnect();
        }
    }

    static final class Expired extends IOException {}
}
