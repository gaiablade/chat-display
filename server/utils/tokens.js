"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tokens = void 0;
var fs = require("fs");
var Tokens = /** @class */ (function () {
    function Tokens(filename) {
        this.filename = filename;
    }
    Tokens.prototype.done = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            fs.readFile(_this.filename, { encoding: 'utf8' }, function (err, data) {
                var _a;
                if (err) {
                    reject("* Error when reading file " + _this.filename + "!");
                }
                else {
                    try {
                        var json = JSON.parse(data);
                        _this.client_id = json.client_id;
                        _this.client_secret = json.client_secret;
                        _this.oauth_token = json.oauth_token;
                        _this.refresh_token = json.refresh_token;
                        _this.eventsub = { oauth_token: ((_a = json.eventsub) === null || _a === void 0 ? void 0 : _a.oauth_token) || undefined };
                        resolve();
                    }
                    catch (err) {
                        console.error(err);
                        reject();
                    }
                }
            });
        });
    };
    Tokens.prototype.load = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            fs.readFile(_this.filename, { encoding: 'utf8' }, function (err, data) {
                var _a;
                if (err) {
                    reject("* Error when reading file " + _this.filename + "!");
                }
                else {
                    try {
                        var json = JSON.parse(data);
                        _this.client_id = json.client_id;
                        _this.client_secret = json.client_secret;
                        _this.oauth_token = json.oauth_token;
                        _this.refresh_token = json.refresh_token;
                        _this.eventsub = { oauth_token: ((_a = json.eventsub) === null || _a === void 0 ? void 0 : _a.oauth_token) || undefined };
                        resolve();
                    }
                    catch (err) {
                        console.error(err);
                        reject();
                    }
                }
            });
        });
    };
    Tokens.prototype.export = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            fs.writeFile(_this.filename, JSON.stringify(_this, null, 2), {
                encoding: 'utf8'
            }, function (err) {
                if (err) {
                    console.error(err);
                    reject();
                }
                else {
                    resolve();
                }
            });
        });
    };
    return Tokens;
}());
exports.Tokens = Tokens;
