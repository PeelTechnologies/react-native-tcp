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

var serverPort = randomPort();

var server = net.createServer(function(socket) {
  console.log('server connected');

  socket.on('data', function (data) {
    console.log('Server Received: ' + data);
    socket.write('Echo server\r\n');
  });

  socket.on('error', function(error) {
    console.log('error ' + error);
  });
}).listen({ port: serverPort }, function() {
  console.log('opened server on ' + JSON.stringify(server.address()));
});

var client = net.createConnection({ port: serverPort }, function() {
  console.log('opened client on ' + JSON.stringify(client.address()));
  client.write('Hello, server! Love, Client.');
});

client.on('data', function(data) {
	console.log('Client Received: ' + data);
  client.destroy(); // kill client after server's response
  server.close();
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
