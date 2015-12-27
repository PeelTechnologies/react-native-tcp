/**
 * Copyright (c) 2015-present, Peel Technologies, Inc.
 * All rights reserved.
 *
 * @providesModule TcpServer
 * @flow
 */

'use strict';

var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;
var {
  NativeModules
} = require('react-native');
var Sockets = NativeModules.TcpSockets;

var Socket = require('./TcpSocket');

function TcpServer(connectionListener: (socket: Socket) => void) {
  if (!(this instanceof TcpServer)) {
    return new TcpServer(connectionListener);
  }

  // $FlowFixMe: suppressing this error flow doesn't like EventEmitter
  EventEmitter.call(this);

  var self = this;

  this._socket = new Socket();
  // $FlowFixMe: suppressing this error flow doesn't like EventEmitter
  this._socket.on('connect', function() {
    self.emit('listening');
  });
  // $FlowFixMe: suppressing this error flow doesn't like EventEmitter
  this._socket.on('connection', function(socket) {
    self._connections++;

    self.emit('connection', socket);
  });
  // $FlowFixMe: suppressing this error flow doesn't like EventEmitter
  this._socket.on('close', function() {
    self.emit('close');
  });
  // $FlowFixMe: suppressing this error flow doesn't like EventEmitter
  this._socket.on('error', function(error) {
    self.emit('error', error);
    self._socket.destroy();
  });

  if (typeof connectionListener === 'function') {
    self.on('connection', connectionListener);
  }

  this._connections = 0;
}

inherits(TcpServer, EventEmitter);

TcpServer.prototype._debug = function() {
  if (__DEV__) {
    var args = [].slice.call(arguments);
    console.log.apply(console, args);
  }
};

TcpServer.prototype.listen = function(options: { port: number, hostname: ?string }, callback: ?() => void) : TcpServer {
  var port = options.port;
  var hostname = options.hostname || 'localhost';

  if (callback) {
    this.on('listening', callback);
  }

  Sockets.createSocket(this._socket._id);
  Sockets.listen(this._socket._id, hostname, port);

  return this;
};

TcpServer.prototype.getConnections = function(callback: (err: ?any, count: number) => void) {
  if (typeof callback === 'function') {
    callback.invoke(null, this._connections);
  }
};

TcpServer.prototype.address = function() : { port: number, address: string, family: string } {
  return this._socket.address();
};

TcpServer.prototype.close = function(callback: ?() => void) {
  if (callback) {
    this.on('close', callback);
  }

  this._socket.end();
};

module.exports = TcpServer;
