/**
 * @providesModule TcpSockets
 * @flow
 */
'use strict';

exports.Socket = require('./TcpSocket');

exports.createConnection = function(options, callback) {
  var tcpSocket = new exports.Socket();
  tcpSocket.connect(options, callback);
  return tcpSocket;
};
