package com.peel.react;

import android.support.annotation.Nullable;
import android.util.SparseArray;

import com.koushikdutta.async.AsyncServer;
import com.koushikdutta.async.AsyncServerSocket;
import com.koushikdutta.async.AsyncSocket;
import com.koushikdutta.async.ByteBufferList;
import com.koushikdutta.async.DataEmitter;
import com.koushikdutta.async.callback.CompletedCallback;
import com.koushikdutta.async.callback.ConnectCallback;
import com.koushikdutta.async.callback.DataCallback;
import com.koushikdutta.async.callback.ListenCallback;

import java.io.IOException;
import java.lang.ref.WeakReference;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.UnknownHostException;

/**
 * Created by aprock on 12/29/15.
 */
public class TcpSocketManager {
    private SparseArray<Object> mClients = new SparseArray<Object>();

    private WeakReference<TcpSocketListener> listener;
    private AsyncServer server = AsyncServer.getDefault();

    private int instances = 5000;

    public TcpSocketManager(TcpSocketListener listener) throws IOException {
        this.listener = new WeakReference<TcpSocketListener>(listener);
    }

    private TcpSocketListener getListener() {
        if (listener != null) {
            return listener.get();
        }

        return null;
    }

    private void setSocketCallbacks(final Integer cId, final AsyncSocket socket) {
        socket.setClosedCallback(new CompletedCallback() {
            @Override
            public void onCompleted(Exception ex) {
                TcpSocketListener listener = getListener();
                if (listener != null) {
                    listener.onClose(cId, null);
                }
            }
        });

        socket.setDataCallback(new DataCallback() {
            @Override
            public void onDataAvailable(DataEmitter emitter, ByteBufferList bb) {
                TcpSocketListener listener = getListener();
                if (listener != null) {
                    listener.onData(cId, bb.getAllByteArray());
                }
            }
        });

        socket.setEndCallback(new CompletedCallback() {
            @Override
            public void onCompleted(Exception ex) {
                if (ex != null) {
                    TcpSocketListener listener = getListener();
                    if (listener != null) {
                        listener.onError(cId, ex.getMessage());
                    }
                }
                socket.close();
            }
        });
    }

    public void listen(final Integer cId, final String host, final Integer port) throws UnknownHostException, IOException {
        // resolve the address
        final InetSocketAddress socketAddress;
        if (host != null) {
            socketAddress = new InetSocketAddress(InetAddress.getByName(host), port);
        } else {
            socketAddress = new InetSocketAddress(port);
        }

        server.listen(InetAddress.getByName(host), port, new ListenCallback() {
            @Override
            public void onListening(AsyncServerSocket socket) {
                mClients.put(cId, socket);

                TcpSocketListener listener = getListener();
                if (listener != null) {
                    listener.onConnect(cId, socketAddress);
                }
            }

            @Override
            public void onAccepted(AsyncSocket socket) {
                setSocketCallbacks(instances, socket);
                mClients.put(instances, socket);

                TcpSocketListener listener = getListener();
                if (listener != null) {
                    listener.onConnection(cId, instances, socketAddress);
                }

                instances++;
            }

            @Override
            public void onCompleted(Exception ex) {
                TcpSocketListener listener = getListener();
                if (listener != null) {
                    listener.onClose(cId, ex != null ? ex.getMessage() : null);
                }

                mClients.remove(cId);
            }
        });
    }

    public void connect(final Integer cId, final @Nullable String host, final Integer port) throws UnknownHostException, IOException {
        // resolve the address
        final InetSocketAddress socketAddress;
        if (host != null) {
            socketAddress = new InetSocketAddress(InetAddress.getByName(host), port);
        } else {
            socketAddress = new InetSocketAddress(port);
        }

        server.connectSocket(socketAddress, new ConnectCallback() {
            @Override
            public void onConnectCompleted(Exception ex, AsyncSocket socket) {
                if (ex != null) {
                    TcpSocketListener listener = getListener();
                    if (listener != null) {
                        listener.onError(cId, ex.getMessage());
                    }
                } else {
                    mClients.put(cId, socket);
                    setSocketCallbacks(cId, socket);

                    TcpSocketListener listener = getListener();
                    if (listener != null) {
                        listener.onConnect(cId, socketAddress);
                    }
                }
            }
        });
    }

    public void write(final Integer cId, final byte[] data) {
        Object socket = mClients.get(cId);
        if (socket != null && socket instanceof AsyncSocket) {
            ((AsyncSocket) socket).write(new ByteBufferList(data));
        }
    }

    public void close(final Integer cId) {
        Object socket = mClients.get(cId);
        if (socket == null) {
            return;
        }

        if (socket instanceof AsyncSocket) {
            ((AsyncSocket) socket).close();
        } else if (socket instanceof AsyncServerSocket) {
            ((AsyncServerSocket) socket).stop();
        }
    }

    public void closeAllSockets() {
        for (int i = 0; i < mClients.size(); i++) {
            close(mClients.keyAt(i));
        }
        mClients.clear();
    }}
