/**
 * Copyright (c) 2015-present, Peel Technologies, Inc.
 * All rights reserved.
 */

package com.peel.react;

import android.support.annotation.Nullable;
import android.util.SparseArray;

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

/**
 * The NativeModule in charge of storing active {@link TcpSocketClient}s, and acting as an api layer.
 */
public final class TcpSockets extends ReactContextBaseJavaModule {
    private static final String TAG = "TcpSockets";

    private SparseArray<TcpSocketClient> mClients = new SparseArray<TcpSocketClient>();
    private boolean mShuttingDown = false;

    public TcpSockets(ReactApplicationContext reactContext) {
        super(reactContext);
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
    }

    /**
     * Creates a {@link TcpSocketClient} with the given ID
     */
    @ReactMethod
    public void createSocket(final Integer cId) {
        new GuardedAsyncTask<Void, Void>(getReactApplicationContext()) {
            @Override
            protected void doInBackgroundGuarded(Void... params) {
                FLog.e(TAG, "TcpSockets.createSocket unimplemented.");

                WritableMap eventParams = Arguments.createMap();
                eventParams.putString("event", "error");
                eventParams.putString("data", "TcpSockets.createSocket unimplemented");

                ReactContext reactContext = TcpSockets.this.getReactApplicationContext();
                reactContext
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                        .emit("tcp-" + cId + "-event", eventParams);
            }
        }.execute();
    }

    @ReactMethod
    public void connect(final Integer cId, final @Nullable String host, final Integer port, final ReadableMap options) {
        new GuardedAsyncTask<Void, Void>(getReactApplicationContext()) {
            @Override
            protected void doInBackgroundGuarded(Void... params) {
                FLog.e(TAG, "TcpSockets.connect unimplemented.");

                WritableMap eventParams = Arguments.createMap();
                eventParams.putString("event", "error");
                eventParams.putString("data", "TcpSockets.connect unimplemented");

                ReactContext reactContext = TcpSockets.this.getReactApplicationContext();
                reactContext
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                        .emit("tcp-" + cId + "-event", eventParams);
            }
        }.execute();
    }

    @ReactMethod
    public void write(final Integer cId, final String base64String, final boolean encoded, final Callback callback) {
        new GuardedAsyncTask<Void, Void>(getReactApplicationContext()) {
            @Override
            protected void doInBackgroundGuarded(Void... params) {
                FLog.e(TAG, "TcpSockets.write unimplemented.");
                callback.invoke("unimplemented." + cId);
            }
        }.execute();
    }

    @ReactMethod
    public void end(final Integer cId, final Callback callback) {
        new GuardedAsyncTask<Void, Void>(getReactApplicationContext()) {
            @Override
            protected void doInBackgroundGuarded(Void... params) {
                FLog.e(TAG, "TcpSockets.end unimplemented.");
                callback.invoke("unimplemented." + cId);
            }
        }.execute();
    }

    @ReactMethod
    public void destroy(final Integer cId, final Callback callback) {
        new GuardedAsyncTask<Void, Void>(getReactApplicationContext()) {
            @Override
            protected void doInBackgroundGuarded(Void... params) {
                FLog.e(TAG, "TcpSockets.destroy unimplemented.");
                callback.invoke("unimplemented." + cId);
            }
        }.execute();
    }

    @ReactMethod
    public void listen(final Integer cId, final String host, final Integer port) {
        new GuardedAsyncTask<Void, Void>(getReactApplicationContext()) {
            @Override
            protected void doInBackgroundGuarded(Void... params) {
                FLog.e(TAG, "TcpSockets.listen unimplemented.");

                WritableMap eventParams = Arguments.createMap();
                eventParams.putString("event", "error");
                eventParams.putString("data", "TcpSockets.connect unimplemented");

                ReactContext reactContext = TcpSockets.this.getReactApplicationContext();
                reactContext
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                        .emit("tcp-" + cId + "-event", eventParams);
            }
        }.execute();
    }
}
