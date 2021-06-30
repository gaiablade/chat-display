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
exports.authenticate = exports.refreshToken = exports.validateToken = void 0;
var node_fetch = require("node-fetch");
var http = require("http");
var fs = require("fs");
var fetch = node_fetch.default;
function validateToken(token) {
    return __awaiter(this, void 0, void 0, function () {
        var validate_url, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    validate_url = 'https://id.twitch.tv/oauth2/validate';
                    return [4 /*yield*/, fetch(validate_url, {
                            headers: {
                                Authorization: "OAuth " + token
                            }
                        }).then(function (res) { return res.json(); })];
                case 1:
                    response = _a.sent();
                    console.log(response);
                    if ('status' in response) {
                        // Unsuccessful:
                        return [2 /*return*/, false];
                    }
                    else if ('client_id' in response) {
                        // Successful:
                        return [2 /*return*/, true];
                    }
                    else {
                        // Unsuccessful:
                        return [2 /*return*/, false];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
exports.validateToken = validateToken;
function refreshToken(tokens) {
    return __awaiter(this, void 0, void 0, function () {
        var refresh_url, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    refresh_url = 'https://id.twitch.tv/oauth2/token' +
                        '?grant_type=refresh_token' +
                        ("&refresh_token=" + tokens.refresh_token) +
                        ("&client_id=" + tokens.client_id) +
                        ("&client_secret=" + tokens.client_secret);
                    return [4 /*yield*/, fetch(refresh_url, {
                            method: 'POST'
                        }).then(function (res) { return res.json(); })];
                case 1:
                    response = _a.sent();
                    if (!('error' in response)) return [3 /*break*/, 2];
                    return [2 /*return*/, false];
                case 2:
                    if (!('access_token' in response)) return [3 /*break*/, 4];
                    tokens.oauth_token = response.access_token;
                    tokens.refresh_token = response.refresh_token;
                    return [4 /*yield*/, tokens.export()];
                case 3:
                    _a.sent();
                    return [2 /*return*/, true];
                case 4: return [2 /*return*/, false];
            }
        });
    });
}
exports.refreshToken = refreshToken;
function parseUrlParam(url, param_name) {
    return __awaiter(this, void 0, void 0, function () {
        var match;
        return __generator(this, function (_a) {
            match = new RegExp("[?&]" + param_name + "=(.*)[&$]").exec(url);
            if (match) {
                return [2 /*return*/, match[1]];
            }
            else {
                return [2 /*return*/, null];
            }
            return [2 /*return*/];
        });
    });
}
function authenticate(tokens) {
    return __awaiter(this, void 0, void 0, function () {
        var authenticate_url, access_token, token_url, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    authenticate_url = 'https://id.twitch.tv/oauth2/authorize' +
                        ("?client_id=" + tokens.client_id) +
                        '&redirect_uri=http://localhost' +
                        '&response_type=code' +
                        '&scope=chat:read+chat:edit' +
                        '&force_verify=true';
                    console.log("Please login to authenticate the app: " + authenticate_url);
                    return [4 /*yield*/, (function () {
                            return new Promise(function (resolve, reject) {
                                var server = http.createServer(function (req, res) {
                                    return __awaiter(this, void 0, void 0, function () {
                                        var code;
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0:
                                                    if (!('url' in req && typeof req.url === 'string')) return [3 /*break*/, 2];
                                                    return [4 /*yield*/, parseUrlParam(req.url, 'code')];
                                                case 1:
                                                    code = _a.sent();
                                                    res.writeHead(200, 'Success', {
                                                        'Content-Type': 'text/html'
                                                    });
                                                    res.write(fs.readFileSync('response.html', { encoding: 'utf8' }));
                                                    res.end();
                                                    this.close();
                                                    resolve(code);
                                                    _a.label = 2;
                                                case 2: return [2 /*return*/];
                                            }
                                        });
                                    });
                                }).listen(80);
                            });
                        })()];
                case 1:
                    access_token = _a.sent();
                    if (!(access_token === null)) return [3 /*break*/, 2];
                    return [2 /*return*/, false];
                case 2:
                    token_url = 'https://id.twitch.tv/oauth2/token' +
                        ("?client_id=" + tokens.client_id) +
                        ("&client_secret=" + tokens.client_secret) +
                        ("&code=" + access_token) +
                        '&grant_type=authorization_code' +
                        '&redirect_uri=http://localhost';
                    return [4 /*yield*/, fetch(token_url, {
                            method: 'POST'
                        }).then(function (res) { return res.json(); }).catch(function (err) { return console.error(err); })];
                case 3:
                    response = _a.sent();
                    if (!response) return [3 /*break*/, 5];
                    tokens.oauth_token = response.access_token;
                    tokens.refresh_token = response.refresh_token;
                    return [4 /*yield*/, tokens.export()];
                case 4:
                    _a.sent();
                    return [2 /*return*/, true];
                case 5: return [2 /*return*/, false];
            }
        });
    });
}
exports.authenticate = authenticate;
