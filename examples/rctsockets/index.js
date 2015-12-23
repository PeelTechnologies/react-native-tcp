/**
 * Copyright (c) 2015-present, Peel Technologies, Inc.
 * All rights reserved.
 */

'use strict';

var React = require('react-native');
var {
  AppRegistry,
  StyleSheet,
  Text,
  View
} = React;

global.Buffer = global.Buffer || require('buffer').Buffer;

var net = require('net');

function randomPort() {
  return Math.random() * 60536 | 0 + 5000; // 60536-65536
}

var aPort = randomPort();

var a = net.createServer({}, function(socket) {
  console.log('server connected');

  socket.on('data', function (data) {
    console.log('Server Received: ' + data);
    socket.write('Echo server\r\n');
  });

  socket.on('error', function(error) {
    console.log('error ' + error);
  });
}).listen({ port: aPort });

var b = net.createConnection({ port: aPort }, function(err) {
  if (err) {
    throw err;
  }

  console.log('client connected');
  b.write('Hello, server! Love, Client.');
});

b.on('data', function(data) {
	console.log('Client Received: ' + data);
  b.end(); // kill client after server's response
  a.close();
});

var rctsockets = React.createClass({
  render: function() {
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>
          Open Dev Tools to see socket chatter
        </Text>
      </View>
    );
  }
});

var styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});

// only works for 8-bit chars
function toByteArray(obj) {
  var uint = new Uint8Array(obj.length);
  for (var i = 0, l = obj.length; i < l; i++){
    uint[i] = obj.charCodeAt(i);
  }

  return new Uint8Array(uint);
}

AppRegistry.registerComponent('rctsockets', () => rctsockets);
