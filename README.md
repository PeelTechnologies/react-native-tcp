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
rnpm link react-native-tcp
```

### Android

* Register and load the Native Module in your Main application
([import](examples/rctsockets/android/app/src/main/java/com/rctsockets/MainApplication.java#L11), [getPackages](examples/rctsockets/android/app/src/main/java/com/rctsockets/MainApplication.java#L28))
  * __Note:__ prior to react-native 0.29.2, this should happen in your Main Activity

```java
...

import com.peel.react.TcpSocketsModule;			// <--- import //

public class MainApplication extends Application implements ReactApplication {
	...
	@Override
	protected List<ReactPackage> getPackages() {
		return Arrays.<ReactPackage>asList(
			new MainReactPackage(),
			new TcpSocketsModule()				// <- add here //
		);
	}
}
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
