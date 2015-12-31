/**
 * Copyright (c) 2015-present, Peel Technologies, Inc.
 * All rights reserved.
 *
 * @providesModule TcpSocket
 * @flow
 */

'use strict';

var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;
var ipRegex = require('ip-regex');
var {
  DeviceEventEmitter,
  NativeModules
} = require('react-native');
var Sockets = NativeModules.TcpSockets;
var base64 = require('base64-js');
var Base64Str = require('./base64-str');
var noop = function () {};
var instances = 0;
var STATE = {
  DISCONNECTED: 0,
  CONNECTING: 1,
  CONNECTED: 2
};

function TcpSocket(options: ?{ id: ?number }) {
  if (!(this instanceof TcpSocket)) {
    return new TcpSocket(options);
  }

  if (EventEmitter instanceof Function) {
    EventEmitter.call(this);
  }

  if (options && options.id) {
    // e.g. incoming server connections
    this._id = Number(options.id);

    if (this._id <= instances) {
      throw new Error('Socket id ' + this._id + 'already in use');
    }
  } else {
    // javascript generated sockets range from 1-1000
    this._id = instances++;
  }

  // ensure compatibility with node's EventEmitter
  if (!this.on) {
    this.on = this.addListener.bind(this);
  }

  // these will be set once there is a connection
  this.writable = this.readable = false;

  this._state = STATE.DISCONNECTED;
}

inherits(TcpSocket, EventEmitter);

TcpSocket.prototype._debug = function() {
  if (__DEV__) {
    var args = [].slice.call(arguments);
    args.unshift('socket-' + this._id);
    console.log.apply(console, args);
  }
};

// TODO : determine how to properly overload this with flow
TcpSocket.prototype.connect = function(options, callback) : TcpSocket {
  this._registerEvents();

  if (options === null || typeof options !== 'object') {
    // Old API:
    // connect(port, [host], [cb])
    var args = this._normalizeConnectArgs(arguments);
    return TcpSocket.prototype.connect.apply(this, args);
  }

  if (typeof callback === 'function') {
    this.once('connect', callback);
  }

  var host = options.host || 'localhost';
  var port = options.port || 0;
  var localAddress = options.localAddress;
  var localPort = options.localPort;

  if (localAddress && !ipRegex({exact: true}).test(localAddress)) {
    throw new TypeError('"localAddress" option must be a valid IP: ' + localAddress);
  }

  if (localPort && typeof localPort !== 'number') {
    throw new TypeError('"localPort" option should be a number: ' + localPort);
  }

  if (typeof port !== 'undefined') {
    if (typeof port !== 'number' && typeof port !== 'string') {
      throw new TypeError('"port" option should be a number or string: ' + port);
    }

    port = +port;

    if (!isLegalPort(port)) {
      throw new RangeError('"port" option should be >= 0 and < 65536: ' + port);
    }
  }

  this._state = STATE.CONNECTING;
  this._debug('connecting, host:', host, 'port:', port);

  this._destroyed = false;
  Sockets.connect(this._id, host, Number(port), options);

  return this;
};

// Check that the port number is not NaN when coerced to a number,
// is an integer and that it falls within the legal range of port numbers.
function isLegalPort(port: number) : boolean {
  if (typeof port === 'string' && port.trim() === '') {
    return false;
  }
  return +port === (port >>> 0) && port >= 0 && port <= 0xFFFF;
}

TcpSocket.prototype.setTimeout = function(msecs: number, callback: () => void) {
  var self = this;

  if (this._timeout) {
    clearTimeout(this._timeout);
    this._timeout = null;
  }

  if (msecs > 0) {
    if (callback) {
      this.once('timeout', callback);
    }

    var self = this;
    this._timeout = setTimeout(function() {
      self.emit('timeout');
      self._timeout = null;
      self.destroy();
    }, msecs);
  }
};

TcpSocket.prototype.address = function() : { port: number, address: string, family: string } {
  return this._address;
};

TcpSocket.prototype.end = function(data, encoding) {
  if (this._destroyed) {
    return;
  }

  if (data) {
    this.write(data, encoding);
  }

  this._destroyed = true;
  this._debug('ending');

  Sockets.end(this._id);
};

TcpSocket.prototype.destroy = function() {
  if (!this._destroyed) {
    this._destroyed = true;
    this._debug('destroying');

    Sockets.destroy(this._id);
  }
};

TcpSocket.prototype._registerEvents = function(): void {
  if (this._subs && this._subs.length > 0) {
    return;
  }

  this._subs = [
    DeviceEventEmitter.addListener(
      'tcp-' + this._id + '-connect', this._onConnect.bind(this)
    ),
    DeviceEventEmitter.addListener(
      'tcp-' + this._id + '-connection', this._onConnection.bind(this)
    ),
    DeviceEventEmitter.addListener(
      'tcp-' + this._id + '-data', this._onData.bind(this)
    ),
    DeviceEventEmitter.addListener(
      'tcp-' + this._id + '-close', this._onClose.bind(this)
    ),
    DeviceEventEmitter.addListener(
      'tcp-' + this._id + '-error', this._onError.bind(this)
    )
  ];
};

TcpSocket.prototype._unregisterEvents = function(): void {
  this._subs.forEach(function(listener) {
    listener.remove();
  });
  this._subs = [];
};

TcpSocket.prototype._onConnect = function(address: { port: number, address: string, family: string }): void {
  this._debug('received', 'connect');

  setConnected(this, address);
  this.emit('connect');
};

TcpSocket.prototype._onConnection = function(info: { id: number, address: { port: number, address: string, family: string } }): void {
  this._debug('received', 'connection');

  var socket = new TcpSocket({ id: info.id });

  socket._registerEvents();
  setConnected(socket, info.address);
  this.emit('connection', socket);
};

TcpSocket.prototype._onData = function(data: string): void {
  this._debug('received', 'data');

  if (this._timeout) {
    clearTimeout(this._timeout);
    this._timeout = null;
  }

  // from base64 string
  var buffer = typeof Buffer === 'undefined'
    ? base64.toByteArray(data)
    : new global.Buffer(data, 'base64');

  this.emit('data', buffer);
};

TcpSocket.prototype._onClose = function(hadError: boolean): void {
  this._debug('received', 'close');

  setDisconnected(this, hadError);
};

TcpSocket.prototype._onError = function(error: string): void {
  this._debug('received', 'error');

  this.emit('error', normalizeError(error));
  this.destroy();
};

TcpSocket.prototype.write = function(buffer: any, callback: ?(err: ?Error) => void) : boolean {
  var self = this;

  if (this._state === STATE.DISCONNECTED) {
    throw new Error('Socket is not connected.');
  } else if (this._state === STATE.CONNECTING) {
    // we're ok, GCDAsyncSocket handles queueing internally
  }

  var cb = callback || noop;
  var str;
  if (typeof buffer === 'string') {
    self._debug('socket.WRITE(): encoding as base64');
    str = Base64Str.encode(buffer);
  } else if (typeof Buffer !== 'undefined' && global.Buffer.isBuffer(buffer)) {
    str = buffer.toString('base64');
  } else if (buffer instanceof Uint8Array || Array.isArray(buffer)) {
    str = base64.fromByteArray(buffer);
  } else {
    throw new Error('invalid message format');
  }

  Sockets.write(this._id, str, function(err) {
    if (self._timeout) {
      clearTimeout(self._timeout);
      self._timeout = null;
    }

    err = normalizeError(err);
    if (err) {
      self._debug('write failed', err);
      return cb(err);
    }

    cb();
  });

  return true;
};

function setConnected(socket: TcpSocket, address: { port: number, address: string, family: string } ) {
  socket.writable = socket.readable = true;
  socket._state = STATE.CONNECTED;
  socket._address = address;
}

function setDisconnected(socket: TcpSocket, hadError: boolean): void {
  if (socket._state === STATE.DISCONNECTED) {
    return;
  }

  socket._unregisterEvents();
  socket._state = STATE.DISCONNECTED;
  socket.emit('close', hadError);
}

function normalizeError(err) {
  if (err) {
    if (typeof err === 'string') {
      err = new Error(err);
    }

    return err;
  }
}

// Returns an array [options] or [options, cb]
// It is the same as the argument of Socket.prototype.connect().
TcpSocket.prototype._normalizeConnectArgs = function(args) {
  var options = {};

  if (args[0] !== null && typeof args[0] === 'object') {
    // connect(options, [cb])
    options = args[0];
  } else {
    // connect(port, [host], [cb])
    options.port = args[0];
    if (typeof args[1] === 'string') {
      options.host = args[1];
    }
  }

  var cb = args[args.length - 1];
  return typeof cb === 'function' ? [options, cb] : [options];
};

// unimplemented net.Socket apis
TcpSocket.prototype.pause =
TcpSocket.prototype.resume =
TcpSocket.prototype.ref =
TcpSocket.prototype.unref =
TcpSocket.prototype.setNoDelay =
TcpSocket.prototype.setKeepAlive =
TcpSocket.prototype.setEncoding = function() { /* nop */ };

module.exports = TcpSocket;
