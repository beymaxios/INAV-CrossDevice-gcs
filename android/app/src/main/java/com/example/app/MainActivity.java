package com.example.app;

import android.os.Bundle;
import android.view.View;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.app.PendingIntent;
import android.hardware.usb.UsbManager;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbDeviceConnection;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

import com.hoho.android.usbserial.driver.UsbSerialDriver;
import com.hoho.android.usbserial.driver.UsbSerialPort;
import com.hoho.android.usbserial.driver.UsbSerialProber;

import java.util.HashMap;

public class MainActivity extends BridgeActivity {

    private static final String ACTION_USB_PERMISSION = "com.example.app.USB_PERMISSION";

    private UsbSerialPort serialPort = null;
    private boolean isReading = false;

    /* =========================================================
       ACTIVITY START
    ========================================================= */

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        hideSystemUI();

        // register USB permission listener
        IntentFilter filter = new IntentFilter(ACTION_USB_PERMISSION);
        registerReceiver(usbReceiver, filter, Context.RECEIVER_NOT_EXPORTED);

        WebView webView = this.bridge.getWebView();
        webView.addJavascriptInterface(new AndroidUSBBridge(), "AndroidUSB");
    }

    /* =========================================================
       ANDROID USB BRIDGE (exposed to JS)
    ========================================================= */

    public class AndroidUSBBridge {

        @JavascriptInterface
        public boolean connect() {

            try {

                UsbManager manager =
                        (UsbManager) getSystemService(Context.USB_SERVICE);

                HashMap<String, UsbDevice> devices = manager.getDeviceList();

                for (UsbDevice device : devices.values()) {

                    UsbSerialDriver driver =
                            UsbSerialProber.getDefaultProber().probeDevice(device);

                    if (driver != null) {

                        // Request permission if not granted
                        if (!manager.hasPermission(device)) {

                            PendingIntent permissionIntent =
                                    PendingIntent.getBroadcast(
                                            MainActivity.this,
                                            0,
                                            new Intent(ACTION_USB_PERMISSION),
                                            PendingIntent.FLAG_IMMUTABLE
                                    );

                            manager.requestPermission(device, permissionIntent);

                            System.out.println("USB permission requested");
                            return false;
                        }

                        openSerial(device);
                        return true;
                    }
                }

                System.out.println("No compatible USB serial device found");

            } catch (Exception e) {
                e.printStackTrace();
            }

            return false;
        }

        @JavascriptInterface
        public void disconnect() {

            try {

                isReading = false;

                if (serialPort != null) {
                    serialPort.close();
                    serialPort = null;
                }

                System.out.println("USB disconnected");

            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        @JavascriptInterface
        public void write(int[] data) {

            try {

                if (serialPort == null) {
                    System.out.println("SerialPort NULL");
                    return;
                }

                byte[] buffer = new byte[data.length];

                for (int i = 0; i < data.length; i++) {
                    buffer[i] = (byte) data[i];
                }

                System.out.println("Writing MSP packet length: " + buffer.length);

                serialPort.write(buffer, 200);

            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    /* =========================================================
       OPEN SERIAL PORT
    ========================================================= */

    private void openSerial(UsbDevice device) {

        try {

            UsbManager manager =
                    (UsbManager) getSystemService(Context.USB_SERVICE);

            UsbSerialDriver driver =
                    UsbSerialProber.getDefaultProber().probeDevice(device);

            if (driver == null) {
                System.out.println("Driver not found");
                return;
            }

            UsbDeviceConnection connection = manager.openDevice(device);

            if (connection == null) {
                System.out.println("USB connection failed");
                return;
            }

            serialPort = driver.getPorts().get(0);

            serialPort.open(connection);

            serialPort.setParameters(
                    115200,
                    8,
                    UsbSerialPort.STOPBITS_1,
                    UsbSerialPort.PARITY_NONE
            );

            System.out.println("USB serial opened");

            startReading();

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /* =========================================================
       USB PERMISSION RECEIVER
    ========================================================= */

    private final android.content.BroadcastReceiver usbReceiver =
            new android.content.BroadcastReceiver() {

                public void onReceive(Context context, Intent intent) {

                    String action = intent.getAction();

                    if (ACTION_USB_PERMISSION.equals(action)) {

                        UsbDevice device =
                                intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);

                        if (intent.getBooleanExtra(
                                UsbManager.EXTRA_PERMISSION_GRANTED, false)) {

                            if (device != null) {

                                System.out.println("USB permission granted");

                                openSerial(device);
                            }

                        } else {

                            System.out.println("USB permission denied");
                        }
                    }
                }
            };

    /* =========================================================
       SERIAL READER THREAD
    ========================================================= */

    private void startReading() {

        if (serialPort == null) return;

        isReading = true;

        new Thread(() -> {

            byte[] buffer = new byte[1024];

            while (isReading) {

                try {

                    int len = serialPort.read(buffer, 500);

                    if (len > 0) {

                        byte[] data = new byte[len];
                        System.arraycopy(buffer, 0, data, 0, len);

                        System.out.println("RX bytes: " + len);

                        sendToJS(data);
                    }

                } catch (Exception e) {
                    e.printStackTrace();
                    break;
                }
            }

        }).start();
    }

    /* =========================================================
       SEND DATA TO JAVASCRIPT
    ========================================================= */

    private void sendToJS(byte[] data) {

        runOnUiThread(() -> {

            String js =
                    "window.dispatchEvent(new CustomEvent('android-usb-data',{detail:["
                            + bytesToString(data)
                            + "]}));";

            this.bridge.getWebView().evaluateJavascript(js, null);
        });
    }

    private String bytesToString(byte[] bytes) {

        StringBuilder sb = new StringBuilder();

        for (int i = 0; i < bytes.length; i++) {

            sb.append(bytes[i] & 0xff);

            if (i < bytes.length - 1) sb.append(",");
        }

        return sb.toString();
    }

    /* =========================================================
       FULLSCREEN UI
    ========================================================= */

    private void hideSystemUI() {

        View decorView = getWindow().getDecorView();

        decorView.setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                        | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_FULLSCREEN
        );
    }
}