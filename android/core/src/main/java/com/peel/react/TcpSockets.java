/**
 * Copyright (c) 2015-present, Peel Technologies, Inc.
 * All rights reserved.
 */

package com.peel.react;

import android.support.annotation.Nullable;
import android.util.Base64;

import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.GuardedAsyncTask;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.io.IOException;
import java.net.Inet6Address;
import java.net.InetSocketAddress;
import java.net.UnknownHostException;
import java.util.concurrent.ExecutionException;

/**
 * The NativeModule acting as an api layer for {@link TcpSocketManager}
 */
public final class TcpSockets extends ReactContextBaseJavaModule implements TcpSocketListener {
    private static final String TAG = "TcpSockets";

    private boolean mShuttingDown = false;
    private TcpSocketManager socketManager;

    public TcpSockets(ReactApplicationContext reactContext) {
        super(reactContext);

        try {
            socketManager = new TcpSocketManager(this);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @Override
    public String getName() {
        return TAG;
    }

    @Override
    public void initialize() {
        mShuttingDown = false;
    }

    @Override
    public void onCatalystInstanceDestroy() {
        mShuttingDown = true;

        try {
            new GuardedAsyncTask<Void, Void>(getReactApplicationContext()) {
                @Override
                protected void doInBackgroundGuarded(Void... params) {
                    socketManager.closeAllSockets();
                }
            }.execute().get();
        } catch (InterruptedException ioe) {
            FLog.e(TAG, "onCatalystInstanceDestroy", ioe);
        } catch (ExecutionException ee) {
            FLog.e(TAG, "onCatalystInstanceDestroy", ee);
        }
    }

    @ReactMethod
    public void listen(final Integer cId, final String host, final Integer port) {
        new GuardedAsyncTask<Void, Void>(getReactApplicationContext()) {
            @Override
            protected void doInBackgroundGuarded(Void... params) {
                try {
                    socketManager.listen(cId, host, port);
                } catch (UnknownHostException uhe) {
                    FLog.e(TAG, "listen", uhe);
                    onError(cId, uhe.getMessage());
                } catch (IOException ioe) {
                    FLog.e(TAG, "listen", ioe);
                    onError(cId, ioe.getMessage());
                }
            }
        }.execute();
    }

    @ReactMethod
    public void connect(final Integer cId, final @Nullable String host, final Integer port, final ReadableMap options) {
        new GuardedAsyncTask<Void, Void>(getReactApplicationContext()) {
            @Override
            protected void doInBackgroundGuarded(Void... params) {
                // NOTE : ignoring options for now, just use the available interface.
                try {
                    socketManager.connect(cId, host, port);
                } catch (UnknownHostException uhe) {
                    FLog.e(TAG, "connect", uhe);
                    onError(cId, uhe.getMessage());
                } catch (IOException ioe) {
                    FLog.e(TAG, "connect", ioe);
                    onError(cId, ioe.getMessage());
                }
            }
        }.execute();
    }

    @ReactMethod
    public void write(final Integer cId, final String base64String, final Callback callback) {
        new GuardedAsyncTask<Void, Void>(getReactApplicationContext()) {
            @Override
            protected void doInBackgroundGuarded(Void... params) {
                socketManager.write(cId, Base64.decode(base64String, Base64.NO_WRAP));
                if (callback != null) {
                    callback.invoke();
                }
            }
        }.execute();
    }

    @ReactMethod
    public void end(final Integer cId) {
        new GuardedAsyncTask<Void, Void>(getReactApplicationContext()) {
            @Override
            protected void doInBackgroundGuarded(Void... params) {
                socketManager.close(cId);
            }
        }.execute();
    }

    @ReactMethod
    public void destroy(final Integer cId) {
        end(cId);
    }

    /** TcpSocketListener */

    @Override
    public void onConnection(Integer serverId, Integer clientId, InetSocketAddress socketAddress) {
        WritableMap eventParams = Arguments.createMap();
        eventParams.putInt("id", clientId);

        WritableMap addressParams = Arguments.createMap();
        addressParams.putString("address", socketAddress.getHostName());
        addressParams.putInt("port", socketAddress.getPort());
        addressParams.putString("family", socketAddress.getAddress() instanceof Inet6Address ? "IPv6" : "IPv4");

        eventParams.putMap("address", addressParams);

        ReactContext reactContext = TcpSockets.this.getReactApplicationContext();
        reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("tcp-" + serverId + "-connection", eventParams);
    }

    @Override
    public void onConnect(Integer id, InetSocketAddress address) {
        WritableMap eventParams = Arguments.createMap();
        eventParams.putString("address", address.getHostName());
        eventParams.putInt("port", address.getPort());
        eventParams.putString("family", address.getAddress() instanceof Inet6Address ? "IPv6" : "IPv4");

        ReactContext reactContext = TcpSockets.this.getReactApplicationContext();
        reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("tcp-" + id + "-connect", eventParams);
    }

    @Override
    public void onData(Integer id, byte[] data) {
        ReactContext reactContext = TcpSockets.this.getReactApplicationContext();
        reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("tcp-" + id + "-data", Base64.encodeToString(data, Base64.NO_WRAP));
    }

    @Override
    public void onClose(Integer id, String error) {
        if (error != null) {
            onError(id, error);
        }

        ReactContext reactContext = TcpSockets.this.getReactApplicationContext();
        reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("tcp-" + id + "-close", error != null);
    }

    @Override
    public void onError(Integer id, String error) {
        ReactContext reactContext = TcpSockets.this.getReactApplicationContext();
        reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("tcp-" + id + "-error", error);
    }
}
