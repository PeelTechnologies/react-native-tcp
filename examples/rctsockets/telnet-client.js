// https://www.npmjs.com/package/another-telnet-client
(function () {
    "use strict";

    var util = require('util');
    var events = require('events');
    var net = require('net');


    // define a constructor (object) and inherit EventEmitter functions
    function Telnet() {
        events.EventEmitter.call(this);
        if (false === (this instanceof Telnet)) {
            return new Telnet();
        }
    }

    util.inherits(Telnet, events.EventEmitter);

    Telnet.prototype.connect = function (opts) {
        var self = this;
        var host = (typeof opts.host !== 'undefined' ? opts.host : '127.0.0.1');
        var port = (typeof opts.port !== 'undefined' ? opts.port : 23);
        this.timeout = (typeof opts.timeout !== 'undefined' ? opts.timeout : 500);
        this.shellPrompt = (typeof opts.shellPrompt !== 'undefined' ? opts.shellPrompt : /(?:\/ )?#\s/);
        this.loginPrompt = (typeof opts.loginPrompt !== 'undefined' ? opts.loginPrompt : /login[: ]*$/i);
        this.passwordPrompt = (typeof opts.passwordPrompt !== 'undefined' ? opts.passwordPrompt : /Password: /i);
        this.username = (typeof opts.username !== 'undefined' ? opts.username : 'root');
        this.password = (typeof opts.password !== 'undefined' ? opts.password : 'guest');
        this.enable = (typeof opts.enable !== 'undefined' ? opts.enable : false);
        this.enablePrompt = (typeof opts.enablePrompt !== 'undefined' ? opts.enablePrompt : /Password: /i);
        this.enablePassword = (typeof opts.enablePassword !== 'undefined' ? opts.enablePassword : 'enablepass');
        this.irs = (typeof opts.irs !== 'undefined' ? opts.irs : '\r\n');
        this.ors = (typeof opts.ors !== 'undefined' ? opts.ors : '\n');
        this.echoLines = (typeof opts.echoLines !== 'undefined' ? opts.echoLines : 1);
        this.pageSeparator = (typeof opts.pageSeparator !== 'undefined' ? opts.pageSeparator : '---- More');
        this.ignoreOutput = (typeof opts.ignoreOutput !== 'undefined' ? opts.ignoreOutput : false);
        this.ignoreOutputTimeout = (typeof opts.ignoreOutputTimeout !== 'undefined' ? opts.ignoreOutputTimeout : 1000);
        this.response = '';
        this.telnetState = null;

        this.telnetSocket = net.createConnection({
            port: port,
            host: host
        }, function () {
            self.telnetState = 'start';
            self.stringData = '';
            self.emit('connect');
        });

        this.telnetSocket.setTimeout(this.timeout, function () {
            if (self.telnetSocket._connecting === true) {
                // info: cannot connect; emit error and destroy
                self.emit('error', 'Cannot connect');

                self.telnetSocket.destroy();
            }
            else {
                self.emit('timeout');
            }
        });

        this.telnetSocket.on('data', function (data) {
            parseData(data, self);
        });

        this.telnetSocket.on('error', function (error) {
            self.emit('error', error);
        });

        this.telnetSocket.on('end', function () {
            self.emit('end');
        });

        this.telnetSocket.on('close', function () {
            self.emit('close');
        });
    };

    Telnet.prototype.exec = function (cmd, opts, callback) {
        var self = this;
        cmd += this.ors;

        if (opts && opts instanceof Function) {
            callback = opts;
        }
        else if (opts && opts instanceof Object) {
            self.shellPrompt = opts.shellPrompt || self.shellPrompt;
            self.loginPrompt = opts.loginPrompt || self.loginPrompt;
            self.timeout = opts.timeout || self.timeout;
            self.irs = opts.irs || self.irs;
            self.ors = opts.ors || self.ors;
            self.echoLines = opts.echoLines || self.echoLines;
            self.ignoreOutput = opts.ignoreOutput || self.ignoreOutput;
            self.ignoreOutputTimeout = opts.ignoreOutputTimeout || self.ignoreOutputTimeout;
        }

        if (this.telnetSocket.writable) {
            this.telnetSocket.write(cmd, function () {
                self.telnetState = 'response';
                self.emit('writedone');

                if (self.ignoreOutput === true) {
                    setTimeout(function () {
                        self.ignoreOutput = false;
                        callback(null);
                    }, self.ignoreOutputTimeout);
                } else {
                    self.once('responseready', function () {
                        if (callback && self.cmdOutput !== undefined) {
                            callback(self.cmdOutput.join('\n'));
                        }
                        else if (callback && self.cmdOutput === undefined) {
                            callback(null);
                        }

                        // reset stored response
                        self.stringData = '';
                    });
                }

            });
        } else {
            callback(new Error("Socket not writable"));
        }
    };

    Telnet.prototype.end = function () {
        this.telnetSocket.end();
    };

    Telnet.prototype.destroy = function () {
        this.telnetSocket.destroy();
    };

    function parseData(chunk, telnetObj) {
        var promptIndex = '';
        var tempStringData = '';

        if (chunk[0] === 255 && chunk[1] !== 255) {
            telnetObj.stringData = '';
            var negReturn = negotiate(telnetObj, chunk);

            if (negReturn === undefined) {
                return;
            }
            else {
                chunk = negReturn;
            }
        }

        if (telnetObj.ignoreOutput === true) {
            telnetObj.stringData = '';
            return;
        }

        if (telnetObj.telnetState === 'start') {
            telnetObj.telnetState = 'getprompt';
        }

        if (telnetObj.telnetState === 'getprompt') {
            tempStringData = chunk.toString();
            promptIndex = tempStringData.search(telnetObj.shellPrompt);

            if (promptIndex !== -1) {
                telnetObj.shellPrompt = tempStringData.substring(promptIndex);
                telnetObj.telnetState = 'sendcmd';
                telnetObj.stringData = '';
                telnetObj.emit('ready', telnetObj.shellPrompt);
            }
            else if (tempStringData.search(telnetObj.loginPrompt) !== -1) {
                telnetObj.telnetState = 'login';
                login(telnetObj, 'username');
            }
            else if (tempStringData.search(telnetObj.passwordPrompt) !== -1) {
                telnetObj.telnetState = 'login';
                login(telnetObj, 'password');
            }
        }
        else if (telnetObj.telnetState === 'enable') {
            tempStringData = chunk.toString();

            if (tempStringData.search(telnetObj.enablePrompt) !== -1) {
                telnetObj.telnetState = 'login';
                login(telnetObj, 'enablePassword');
            }
        }
        else if (telnetObj.telnetState === 'getenprompt') {
            tempStringData = chunk.toString();

            if (tempStringData.search(telnetObj.shellPrompt) !== -1) {
                telnetObj.telnetState = 'login';
                login(telnetObj, 'enable');
            }
        }
        else if (telnetObj.telnetState === 'response') {
            tempStringData = chunk.toString();
            telnetObj.stringData += tempStringData;
            promptIndex = tempStringData.search(telnetObj.shellPrompt);

            if (promptIndex === -1 && tempStringData.length !== 0) {
                if (tempStringData.search(telnetObj.pageSeparator) !== -1) {
                    telnetObj.telnetSocket.write(Buffer('20', 'hex'));
                }

                return;
            }

            telnetObj.cmdOutput = telnetObj.stringData.split(telnetObj.irs);

            for (var i = 0; i < telnetObj.cmdOutput.length; i++) {
                if (telnetObj.cmdOutput[i].search(telnetObj.pageSeparator) !== -1) {
                    telnetObj.cmdOutput.splice(i, 1);
                }
            }

            if (telnetObj.echoLines === 1) {
                telnetObj.cmdOutput.shift();
            }
            else if (telnetObj.echoLines > 1) {
                telnetObj.cmdOutput.splice(0, telnetObj.echoLines);
            }

            // remove prompt
            telnetObj.cmdOutput.pop();

            telnetObj.emit('responseready');
        }
    }

    function login(telnetObj, handle) {
        if (handle === 'username') {
            if (telnetObj.telnetSocket.writable) {
                telnetObj.telnetSocket.write(telnetObj.username + telnetObj.ors, function () {
                    telnetObj.telnetState = 'getprompt';
                });
            }
        }
        else if (handle === 'password') {
            if (telnetObj.telnetSocket.writable) {
                telnetObj.telnetSocket.write(telnetObj.password + telnetObj.ors, function () {
                    if (telnetObj.enable) {
                        telnetObj.telnetState = 'getenprompt';
                    } else {
                        telnetObj.telnetState = 'getprompt';
                    }
                });
            }
        }
        else if (handle === 'enable') {
            if (telnetObj.telnetSocket.writable) {
                telnetObj.telnetSocket.write("en" + telnetObj.ors, function () {
                    telnetObj.telnetState = 'enable';
                });
            }
        }
        else if (handle === 'enablePassword') {
            if (telnetObj.telnetSocket.writable) {
                telnetObj.telnetSocket.write(telnetObj.enablePassword + telnetObj.ors, function () {
                    telnetObj.telnetState = 'getprompt';
                });
            }
        }
    }

    function negotiate(telnetObj, chunk) {
        // info: http://tools.ietf.org/html/rfc1143#section-7
        // refuse to start performing and ack the start of performance
        // DO -> WONT; WILL -> DO
        var packetLength = chunk.length, negData = chunk, cmdData, negResp;

        for (var i = 0; i < packetLength; i += 3) {
            if (chunk[i] !== 255) {
                negData = chunk.slice(0, i);
                cmdData = chunk.slice(i);
                break;
            }
        }

        negResp = negData.toString('hex').replace(/fd/g, 'fc').replace(/fb/g, 'fd');

        if (telnetObj.telnetSocket.writable) {
            telnetObj.telnetSocket.write(Buffer(negResp, 'hex'));
        }

        if (cmdData !== undefined) {
            return cmdData;
        }
    }

    module.exports = Telnet;
}());
