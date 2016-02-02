# TCP in React Native

node's [net](https://nodejs.org/api/net.html) API in React Native

This module is used by [Peel](http://www.peel.com/)

## Install

* Create a new react-native project. [Check react-native getting started](http://facebook.github.io/react-native/docs/getting-started.html#content)

* In your project dir:
```
npm install --save react-native-tcp
```

### `iOS`

* Drag TcpSockets.xcodeproj from node_modules/react-native-tcp/ios into your XCode project.

* Click on the project in XCode, go to Build Phases, then Link Binary With Libraries and add `libTcpSockets.a`

### `Android`

* `android/settings.gradle`

```gradle
...
include ':react-native-tcp'
project(':react-native-tcp').projectDir = new File(settingsDir, '../node_modules/react-native-tcp/android/core')
```
* `android/app/build.gradle`

```gradle
dependencies {
	...
	compile project(':react-native-tcp')
}
```

* register module (in MainActivity.java)

```java
...

import com.peel.react.*; // <--- import

public class MainActivity extends Activity implements DefaultHardwareBackBtnHandler {
	...

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
        new MainReactPackage(),
        new TcpSocketsModule()); // <- add here
    }
}
```

Buckle up, Dorothy

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

_see/run [index.js](examples/rctsockets) for a complete example, but basically it's just like net_

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
