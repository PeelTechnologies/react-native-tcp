# TCP in React Native

node's [net](https://nodejs.org/api/net.html) API in React Native

This module is used by [Peel](http://www.peel.com/)

## Install

* Create a new react-native project. [Check react-native getting started](http://facebook.github.io/react-native/docs/getting-started.html#content)

* In your project dir:
```
npm install --save react-native-tcp
```

## Link in the native dependency

```
react-native link react-native-tcp
```

***Step 3 Profit***

## Usage

### package.json

_only if you want to write require('net') in your javascript_

```json
{
  "browser": {
    "net": "react-native-tcp"
  }
}
```

### JS

_see/run [index.ios.js/index.android.js](examples/rctsockets) for a complete example, but basically it's just like net_

```js
var net = require('net');
// OR, if not shimming via package.json "browser" field:
// var net = require('react-native-tcp')

var server = net.createServer(function(socket) {
  socket.write('excellent!');
}).listen(12345);

var client = net.createConnection(12345);

client.on('error', function(error) {
  console.log(error)
});

client.on('data', function(data) {
  console.log('message was received', data)
});
```

### Note

If you want to send and receive node Buffer objects, you'll have to "npm install buffer" and set it as a global for TcpSockets to pick it up:

```js
global.Buffer = global.Buffer || require('buffer').Buffer
```

### TODO

add select tests from node's tests for net

## Contributors

[Andy Prock](https://github.com/aprock)  

PR's welcome!



_originally forked from [react-native-udp](https://github.com/tradle/react-native-udp)_
