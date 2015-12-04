//
//  react-native-tcp
//
//  Created by Andy Prock on 12/14/15.
//  Copyright (c) 2015 Peel, Inc. All rights reserved.
//

/**
 * @providesModule TcpSocket
 * @flow
 */

'use strict';

var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;
var {
  DeviceEventEmitter,
  NativeModules
} = require('react-native');
var Sockets = NativeModules.TcpSockets;
var base64 = require('base64-js');
var noop = function () {};
var instances = 0;
var STATE = {
  DISCONNECTED: 0,
  CONNECTING: 1,
  CONNECTED: 2
};

module.exports = TcpSocket;

function TcpSocket(options, onopen) {
  EventEmitter.call(this);

  this._id = instances++;
  this._state = STATE.DISCONNECTED;
  this._connecting = false;
  this._hadError = false;
  this._handle = null;
  this._parent = null;
  this._host = null;

  if (typeof options === 'number') {
    options = { fd: options }; // Legacy interface.
  } else if (options === undefined) {
    options = {};
  }

  // these will be set once there is a connection
  this.readable = this.writable = false;

  this._subscription = DeviceEventEmitter.addListener(
    'tcp-' + this._id + '-data', this._onReceive.bind(this)
  );

  // ensure compatibility with node's EventEmitter
  if (!this.on) {
    this.on = this.addListener.bind(this);
  }

  if (onopen) {
    this.on('open', onopen);
  }

  Sockets.createSocket(this._id, options); // later
}

inherits(TcpSocket, EventEmitter);

TcpSocket.prototype._debug = function() {
  if (__DEV__) {
    var args = [].slice.call(arguments);
    args.unshift('socket-' + this._id);
    console.log.apply(console, args);
  }
};

TcpSocket.prototype.connect = function(options, callback) {
  var self = this;

  var port = options.port;
  var host = options.host;

  if (this._state !== STATE.DISCONNECTED) {
    throw new Error('Socket is already bound');
  }

  if (callback) {
    this.once('connected', callback.bind(this));
  }

  this._state = STATE.CONNECTING;
  this._connecting = true;
  this._debug('connecting, host:', host, 'port:', port);
  Sockets.connect(this._id, port, host, function(err, addr) {
    err = normalizeError(err);
    if (err) {
      // questionable: may want to self-destruct and
      // force user to create a new socket
      self._state = STATE.DISCONNECTED;
      self._debug('failed to bind', err);
      if (callback) {
        callback(err);
      }
      return self.emit('error', err);
    }

    self._debug('connected to address:', host, 'port:', port);
    // self._host = addr.host;
    // self._port = addr.port;
    self.writable = self.readable = true;
    self._state = STATE.CONNECTED;
    self._connecting = false;
    self.emit('connected');
  });
};

TcpSocket.prototype.setTimeout = function(msecs, callback) {
  // nothing yet
};

TcpSocket.prototype.end = function() {
  if (this._destroyed) {
    return;
  }

  this._destroyed = true;
  this._debug('closing');
  this._subscription.remove();

  Sockets.close(this._id, this._debug.bind(this, 'closed'));
  this.emit('close');
};

TcpSocket.prototype.destroy = TcpSocket.prototype.end;

TcpSocket.prototype._onReceive = function(info) {
  this._debug('received', info);

  // from base64 string
  var buf = typeof Buffer === 'undefined'
    ? base64.toByteArray(info.data)
    : new global.Buffer(info.data, 'base64');

  this.emit('data', buf);
};

TcpSocket.prototype.write = function(buffer, encoding, callback) {
  var self = this;
  var encoded = false;

  if (this._state === STATE.DISCONNECTED) {
    throw new Error('Socket is not connected.');
  } else if (this._state === STATE.CONNECTING) {
    // we're ok, GCDAsyncSocket handles queueing internally
  }

  if (typeof encoding  === 'function') {
    callback = encoding;
    encoding = null;
  }
  callback = callback || noop;
  var str;
  if (typeof buffer === 'string') {
    console.warn('socket.WRITE(): interpreting as UTF8');
    str = buffer;
  } else if (typeof Buffer !== 'undefined' && global.Buffer.isBuffer(buffer)) {
    encoded = true;
    str = buffer.toString('base64');
  } else if (buffer instanceof Uint8Array || Array.isArray(buffer)) {
    encoded = true;
    str = base64.fromByteArray(buffer);
  } else {
    throw new Error('invalid message format');
  }

  Sockets.write(this._id, str, encoded, function(err) {
    err = normalizeError(err);
    if (err) {
      self._debug('send failed', err);
      return callback(err);
    }

    callback();
  });
};

function normalizeError (err) {
  if (err) {
    if (typeof err === 'string') {
      err = new Error(err);
    }

    return err;
  }
}
