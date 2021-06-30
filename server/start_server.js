"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var tokens_1 = require("./utils/tokens");
var node_fetch = require("node-fetch");
var WebSocket = require("ws");
var http = require("http");
var fetch = node_fetch.default;
var Message = /** @class */ (function () {
    function Message(username, content) {
        this.username = '';
        this.content = '';
        this.username = username;
        this.content = content;
    }
    return Message;
}());
function parseIRCMessage(message) {
    var words = message.split(' ');
    console.log(words);
    if (words.length > 2 && words[1] === 'PRIVMSG') {
        var username = words[2].substr(1);
        var message_1 = words.slice(3).join(' ').substr(1);
        return {
            username: username,
            content: message_1
        };
    }
    return null;
}
var App = /** @class */ (function () {
    function App() {
        var _this = this;
        this.messages = [];
        this.react_link = http.createServer(function (req, res) {
            var _a;
            if ((_a = req.url) === null || _a === void 0 ? void 0 : _a.startsWith('/get_messages')) {
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Access-Control-Request-Method', '*');
                res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
                res.setHeader('Access-Control-Allow-Headers', req.headers.origin || '*');
                res.writeHead(200, 'Success', {
                    'Content-Type': 'application/json'
                });
                res.write(JSON.stringify(_this.messages, null, 2));
                res.end();
            }
        }).listen(5000);
    }
    App.prototype.init = function () {
        return __awaiter(this, void 0, void 0, function () {
            var tokens, options, sock;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tokens = new tokens_1.Tokens('./tokens.json');
                        return [4 /*yield*/, tokens.load()];
                    case 1:
                        _a.sent();
                        options = {
                            username: 'gaia_blade',
                            password: tokens.oauth_token ? tokens.oauth_token : ''
                        };
                        sock = new WebSocket('ws://irc-ws.chat.twitch.tv:80');
                        sock.onopen = function (ev) {
                            sock.send("PASS oauth:" + options.password);
                            sock.send("NICK " + options.username);
                            sock.send('JOIN #gaia_blade');
                        };
                        sock.onerror = function (ev) {
                            console.log('* Error!');
                            console.log(ev);
                        };
                        sock.onmessage = function (event) {
                            console.log('New Message:');
                            console.log(event.data);
                            var message = parseIRCMessage(event.data.toString());
                            if (message !== null) {
                                _this.messages.push(message);
                            }
                            if (event.data.toString().startsWith('PING')) {
                                console.log('Ponging back...');
                                sock.send('PONG :tmi.twitch.tv');
                            }
                        };
                        return [2 /*return*/];
                }
            });
        });
    };
    return App;
}());
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var app;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    app = new App();
                    return [4 /*yield*/, app.init()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
main();
