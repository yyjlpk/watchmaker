package com.yyjlpk.watchmaker;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ContentValues;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.Insets;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.WindowInsets;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.webkit.WebViewAssetLoader;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.Collections;
import java.util.EnumMap;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public final class WatchmakerActivity extends Activity {
    private static final String APP_HOST = "appassets.androidplatform.net";
    private static final String ZEPP_PACKAGE = "com.huami.watch.hmwatchmanager";
    private static final int FILE_REQUEST = 100;
    private static final int MAX_FILE_BYTES = 8 * 1024 * 1024;
    private static final int QR_SIZE = 480;

    private final ExecutorService fileWriter = Executors.newSingleThreadExecutor();
    private ValueCallback<Uri[]> fileCallback;
    private WebView editor;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        if (Build.VERSION.SDK_INT >= 30) getWindow().setDecorFitsSystemWindows(false);
        editor = new WebView(this);
        editor.setBackgroundColor(Color.rgb(15, 23, 42));
        editor.getSettings().setJavaScriptEnabled(true);
        editor.getSettings().setDomStorageEnabled(true);
        editor.getSettings().setAllowFileAccess(false);
        editor.getSettings().setAllowContentAccess(true);
        editor.addJavascriptInterface(new EditorBridge(), "WatchmakerAndroid");
        editor.setWebViewClient(new LocalEditorClient());
        editor.setWebChromeClient(new EditorChromeClient());
        editor.setOnApplyWindowInsetsListener((view, insets) -> {
            if (Build.VERSION.SDK_INT >= 30) {
                Insets safe = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                view.setPadding(safe.left, safe.top, safe.right, safe.bottom);
            }
            return insets;
        });
        setContentView(editor);
        editor.loadUrl("https://" + APP_HOST + "/assets/index.html");
    }

    private static boolean isLocalPage(Uri uri) {
        return "https".equals(uri.getScheme()) && APP_HOST.equals(uri.getHost())
                && uri.getPort() == -1 && uri.getPath() != null && uri.getPath().startsWith("/assets/");
    }

    private final class LocalEditorClient extends WebViewClient {
        private final WebViewAssetLoader files = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(WatchmakerActivity.this))
                .build();

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            if (isLocalPage(uri)) return false;
            if (request.isForMainFrame() && request.hasGesture() && "https".equals(uri.getScheme())) {
                openExternal(uri);
            }
            return true;
        }

        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            if (isLocalPage(uri)) {
                WebResourceResponse response = files.shouldInterceptRequest(uri);
                if (response != null) return response;
            }
            return new WebResourceResponse("text/plain", "UTF-8", 404, "Not Found",
                    Collections.emptyMap(), new ByteArrayInputStream(new byte[0]));
        }
    }

    private final class EditorChromeClient extends WebChromeClient {
        @Override
        public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
            if (fileCallback != null) fileCallback.onReceiveValue(null);
            fileCallback = callback;
            boolean isZip = false;
            for (String type : params.getAcceptTypes()) {
                if (type.toLowerCase(Locale.ROOT).contains("zip")) isZip = true;
            }

            Intent chooser;
            if (!isZip && Build.VERSION.SDK_INT >= 33) {
                chooser = new Intent(MediaStore.ACTION_PICK_IMAGES).setType("image/*");
            } else {
                chooser = new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE);
                chooser.setType(isZip ? "*/*" : "image/*");
                if (isZip) {
                    chooser.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{
                            "application/zip", "application/x-zip", "application/x-zip-compressed", "application/octet-stream"
                    });
                }
            }
            try {
                startActivityForResult(chooser, FILE_REQUEST);
            } catch (ActivityNotFoundException error) {
                fileCallback = null;
                callback.onReceiveValue(null);
            }
            return true;
        }
    }

    @Override
    protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if (request != FILE_REQUEST || fileCallback == null) return;
        ValueCallback<Uri[]> callback = fileCallback;
        fileCallback = null;
        Uri selected = result == RESULT_OK && data != null ? data.getData() : null;
        callback.onReceiveValue(selected == null ? null : new Uri[]{selected});
    }

    private void openExternal(Uri uri) {
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, uri).addCategory(Intent.CATEGORY_BROWSABLE));
        } catch (ActivityNotFoundException error) {
            notifyUser(R.string.no_external_app);
        }
    }

    private void notifyUser(int message) {
        runOnUiThread(() -> Toast.makeText(getApplicationContext(), message, Toast.LENGTH_SHORT).show());
    }

    private void saveMedia(String fileName, byte[] bytes, boolean isPng) throws IOException {
        ContentValues metadata = new ContentValues();
        metadata.put(MediaStore.MediaColumns.DISPLAY_NAME, fileName);
        metadata.put(MediaStore.MediaColumns.MIME_TYPE, isPng ? "image/png" : "application/zip");
        metadata.put(MediaStore.MediaColumns.RELATIVE_PATH,
                (isPng ? Environment.DIRECTORY_PICTURES : Environment.DIRECTORY_DOWNLOADS) + "/Watchmaker");
        metadata.put(MediaStore.MediaColumns.IS_PENDING, 1);
        Uri collection = isPng
                ? MediaStore.Images.Media.EXTERNAL_CONTENT_URI : MediaStore.Downloads.EXTERNAL_CONTENT_URI;
        Uri entry = getContentResolver().insert(collection, metadata);
        if (entry == null) throw new IOException("MediaStore insert failed");
        boolean complete = false;
        try {
            try (OutputStream destination = getContentResolver().openOutputStream(entry)) {
                if (destination == null) throw new IOException("MediaStore stream missing");
                destination.write(bytes);
            }
            ContentValues ready = new ContentValues();
            ready.put(MediaStore.MediaColumns.IS_PENDING, 0);
            complete = getContentResolver().update(entry, ready, null, null) == 1;
            if (!complete) throw new IOException("MediaStore publish failed");
        } finally {
            if (!complete) getContentResolver().delete(entry, null, null);
        }
    }

    private static boolean hasOfficialInstallLink(String link) {
        if (link == null || link.length() > 1800 || link.matches("(?s).*\\s.*")) return false;
        Uri uri = Uri.parse(link);
        String host = uri.getHost();
        String scheme = uri.getScheme();
        String path = uri.getPath();
        if (host == null || path == null || path.length() < 2 || uri.getUserInfo() != null || uri.getPort() != -1) {
            return false;
        }
        if (!"zpkd1".equalsIgnoreCase(scheme) && !"watchface".equalsIgnoreCase(scheme)) return false;
        host = host.toLowerCase(Locale.ROOT);
        return host.endsWith(".zepp.com") || host.endsWith(".huami.com") || host.endsWith(".amazfit.com");
    }

    private final class EditorBridge {
        @JavascriptInterface
        public void openZepp() {
            runOnUiThread(() -> {
                Intent zepp = getPackageManager().getLaunchIntentForPackage(ZEPP_PACKAGE);
                if (zepp == null) {
                    openExternal(Uri.parse("https://play.google.com/store/apps/details?id=" + ZEPP_PACKAGE));
                    return;
                }
                try {
                    startActivity(zepp);
                } catch (ActivityNotFoundException error) {
                    notifyUser(R.string.no_external_app);
                }
            });
        }

        @JavascriptInterface
        public boolean saveFile(String encoded, String suppliedName) {
            if (encoded == null || encoded.length() > (MAX_FILE_BYTES * 4 / 3 + 4)
                    || suppliedName == null || suppliedName.length() > 180 || fileWriter.isShutdown()) {
                return false;
            }
            String fileName = suppliedName.replaceAll("[/\\\\:*?\"<>|\\p{Cntrl}]", "_");
            String lower = fileName.toLowerCase(Locale.ROOT);
            boolean isPng = lower.endsWith(".png");
            if (!isPng && !lower.endsWith(".zip")) return false;
            fileWriter.execute(() -> {
                try {
                    byte[] data = Base64.decode(encoded, Base64.DEFAULT);
                    if (data.length > MAX_FILE_BYTES || data.length < 4
                            || (isPng && ((data[0] & 255) != 137 || data[1] != 80 || data[2] != 78 || data[3] != 71))
                            || (!isPng && (data[0] != 80 || data[1] != 75 || data[2] != 3 || data[3] != 4))) {
                        throw new IOException("Invalid file");
                    }
                    saveMedia(fileName, data, isPng);
                    notifyUser(isPng ? R.string.saved_to_gallery : R.string.saved_to_downloads);
                } catch (IOException | RuntimeException error) {
                    notifyUser(R.string.save_error);
                }
            });
            return true;
        }

        @JavascriptInterface
        public String makeInstallQr(String payload) {
            if (!hasOfficialInstallLink(payload)) return "";
            try {
                Map<EncodeHintType, Object> hints = new EnumMap<>(EncodeHintType.class);
                hints.put(EncodeHintType.MARGIN, 4);
                hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M);
                BitMatrix matrix = new QRCodeWriter().encode(payload, BarcodeFormat.QR_CODE, QR_SIZE, QR_SIZE, hints);
                int[] pixels = new int[QR_SIZE * QR_SIZE];
                for (int y = 0; y < QR_SIZE; y++) {
                    for (int x = 0; x < QR_SIZE; x++) {
                        pixels[y * QR_SIZE + x] = matrix.get(x, y) ? Color.BLACK : Color.WHITE;
                    }
                }
                Bitmap bitmap = Bitmap.createBitmap(pixels, QR_SIZE, QR_SIZE, Bitmap.Config.ARGB_8888);
                ByteArrayOutputStream stream = new ByteArrayOutputStream();
                bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream);
                bitmap.recycle();
                return "data:image/png;base64," + Base64.encodeToString(stream.toByteArray(), Base64.NO_WRAP);
            } catch (WriterException | RuntimeException error) {
                return "";
            }
        }
    }

    @Override
    protected void onDestroy() {
        if (fileCallback != null) fileCallback.onReceiveValue(null);
        fileWriter.shutdown();
        editor.removeJavascriptInterface("WatchmakerAndroid");
        editor.destroy();
        super.onDestroy();
    }
}
