'use strict';

var React = require('react-native');
var {
  AppRegistry,
  StyleSheet,
  Text,
  View
} = React;

global.Buffer = global.Buffer || require('buffer').Buffer;

var telnet = require('./telnet-client');
var connection = new telnet();

// require('./test/simple/test-dgram-address')
// require('./test/simple/test-dgram-bind-default-address')
// require('./test/simple/test-dgram-bind-shared-ports')

// function randomPort() {
//   return Math.random() * 60536 | 0 + 5000 // 60536-65536
// }

// var params = {
//   host: 'towel.blinkenlights.nl',
//   port: 23,
//   shellPrompt: '/ # ',
//   timeout: 1500,
//   // removeEcho: 4
// };

var params = {
  // host: '10.0.1.207',
  port: 23,
  timeout: 15000,
  passwordPrompt: /Password[: ]*$/i
  // removeEcho: 4
};

connection.on('ready', function(prompt) {
  connection.exec('ls', function(err, response) {
    console.log(response);
  });
});

connection.on('writedone', function() {
  console.log('writedone');
});

connection.on('loginfailed', function() {
  console.log('loginfailed');
});

connection.on('error', function(error) {
  console.log(error);
});

connection.on('timeout', function() {
  console.log('socket timeout!');
  connection.end();
});

connection.on('close', function() {
  console.log('connection closed');
});

connection.connect(params);

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

// // only works for 8-bit chars
// function toByteArray(obj) {
//   var uint = new Uint8Array(obj.length);
//   for (var i = 0, l = obj.length; i < l; i++){
//     uint[i] = obj.charCodeAt(i);
//   }
//
//   return new Uint8Array(uint);
// }

AppRegistry.registerComponent('rctsockets', () => rctsockets);
