package com.peel.react;

import java.net.InetSocketAddress;
import android.net.LocalSocketAddress;

/**
 * Created by aprock on 12/28/15.
 */
public interface TcpSocketListener {
    // server
    void onConnection(Integer serverId, Integer clientId, InetSocketAddress socketAddress);

    // client and server
    void onConnect(Integer id, InetSocketAddress socketAddress);
    void onConnect(Integer id, LocalSocketAddress socketAddress);
    void onData(Integer id, byte[] data);
    void onClose(Integer id, String error);
    void onError(Integer id, String error);
}
