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
var process_1 = require("process");
var authorize_1 = require("./utils/authorize");
var tokens_1 = require("./utils/tokens");
var readline = require("readline");
var input = readline.createInterface({
    input: process_1.stdin, output: process_1.stdout
});
function question(prompt) {
    return new Promise(function (resolve, reject) {
        input.question(prompt, function (answer) { return resolve(answer); });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var tokens, e_1, client_id, client_secret, valid, _a, refreshed, _b, authenticated;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    tokens = new tokens_1.Tokens('./tokens.json');
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 7]);
                    return [4 /*yield*/, tokens.load()];
                case 2:
                    _c.sent();
                    return [3 /*break*/, 7];
                case 3:
                    e_1 = _c.sent();
                    console.log('* Error: tokens.json does not exist!');
                    return [4 /*yield*/, question('Please enter your client-id: ')];
                case 4:
                    client_id = _c.sent();
                    return [4 /*yield*/, question('Please enter your client-secret: ')];
                case 5:
                    client_secret = _c.sent();
                    tokens.client_id = client_id;
                    tokens.client_secret = client_secret;
                    return [4 /*yield*/, tokens.export()];
                case 6:
                    _c.sent();
                    return [3 /*break*/, 7];
                case 7:
                    if (!tokens.oauth_token) return [3 /*break*/, 9];
                    return [4 /*yield*/, authorize_1.validateToken(tokens.oauth_token)];
                case 8:
                    _a = _c.sent();
                    return [3 /*break*/, 10];
                case 9:
                    _a = false;
                    _c.label = 10;
                case 10:
                    valid = _a;
                    if (!!valid) return [3 /*break*/, 15];
                    if (!tokens.refresh_token) return [3 /*break*/, 12];
                    return [4 /*yield*/, authorize_1.refreshToken(tokens)];
                case 11:
                    _b = _c.sent();
                    return [3 /*break*/, 13];
                case 12:
                    _b = false;
                    _c.label = 13;
                case 13:
                    refreshed = _b;
                    if (!!refreshed) return [3 /*break*/, 15];
                    return [4 /*yield*/, authorize_1.authenticate(tokens)];
                case 14:
                    authenticated = _c.sent();
                    if (!authenticated) {
                        console.log('*Error: Could not authenticate OAuth token.');
                        process_1.exit(1);
                    }
                    _c.label = 15;
                case 15:
                    console.log('Your OAuth token is valid!');
                    process_1.exit(0);
                    return [2 /*return*/];
            }
        });
    });
}
main();
