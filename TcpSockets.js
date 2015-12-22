/**
 * @providesModule TcpSockets
 * @flow
 */
'use strict';

var ipRegex = require('ip-regex');

var Socket = require('./TcpSocket').Socket;
var Server = require('./TcpSocket').Server;

exports.createServer = function(options, connectionListener) {
  return new Server(options, connectionListener);
};


// Target API:
//
// var s = net.connect({port: 80, host: 'google.com'}, function() {
//   ...
// });
//
// There are various forms:
//
// connect(options, [cb])
// connect(port, [host], [cb])
// connect(path, [cb]);
//
// exports.connect = exports.createConnection = function() {
//   var args = normalizeConnectArgs(arguments);
//   Socket._debug('createConnection', args);
//   var s = new Socket(args[0]);
//   return Socket.prototype.connect.apply(s, args);
// };
//
// // Returns an array [options] or [options, cb]
// // It is the same as the argument of Socket.prototype.connect().
// function normalizeConnectArgs(args) {
//   var options = {};
//
//   if (args[0] !== null && typeof args[0] === 'object') {
//     // connect(options, [cb])
//     options = args[0];
//   }/* else if (isPipeName(args[0])) {
//     // connect(path, [cb]);
//     options.path = args[0];
//   }*/ else {
//     // connect(port, [host], [cb])
//     options.port = args[0];
//     if (typeof args[1] === 'string') {
//       options.host = args[1];
//     }
//   }
//
//   var cb = args[args.length - 1];
//   return typeof cb === 'function' ? [options, cb] : [options];
// }

exports.connect = exports.createConnection = function(options: { port: number, host: ?string, localAddress: ?string, localPort: ?number, family: ?number }, callback : ?any) : Socket {
  var tcpSocket = new Socket();
  tcpSocket.connect(options, callback);
  return tcpSocket;
};

exports.isIP = function(input: string) : number {
  var result = 0;
  if (ipRegex.v4({exact: true}).test(input)) {
    result = 4;
  } else if (ipRegex.v6({exact: true}).test(input)) {
    result = 6;
  }
  return result;
};

exports.isIPv4 = function(input: string) : boolean {
  return exports.isIP(input) === 4;
};

exports.isIPv6 = function(input: string) : boolean {
  return exports.isIP(input) === 6;
};

exports.Socket = Socket;
exports.Server = Server;
