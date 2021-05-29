"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const colors = require('colors');
const http = __importStar(require("http"));
const nf = require('node-fetch');
const fs = require('fs');
const tmi = require('tmi.js');
/**
 * Read tokens from confidential JSON file.
 * @param filename JSON file containing the token information
 * @returns Tokens
 */
function read_tokens(filename) {
    const tokens = JSON.parse(fs.readFileSync('tokens.json', { encoding: 'utf-8' }));
    return {
        'client-id': tokens['client-id'],
        'client-secret': tokens['client-secret'],
        'oauth-token': tokens['oauth-token'],
        'refresh-token': tokens['refresh-token']
    };
}
const code_pattern = /\?code=(.+)&scope=.+/;
const columns = process.stdout.columns;
/**
 * Use refresh token to get new valid OAuth token.
 * @param tokens Tokens object containing client information and refresh token.
 * @returns {Promise<RetStatus>}
 */
function refresh(tokens) {
    return new Promise((resolve, reject) => {
        const refresh_url = `https://id.twitch.tv/oauth2/token` +
            `?grant_type=refresh_token` +
            `&client_id=${tokens['client-id']}` +
            `&client_secret=${tokens['client-secret']}`;
        // Post refresh request to API
        nf(refresh_url, {
            method: 'POST'
        }).then((res) => res.json()).then((json) => {
            if ('error' in json) {
                console.error(`* Error: ${json['message']}`);
                resolve({
                    status: false,
                    message: `* Error: ${json['message']}`
                });
            }
            else if (json['status'] === 400) {
                resolve({
                    status: false,
                    message: `* Error: ${json['message']}`
                });
            }
            else {
                tokens['oauth-token'] = json['access_token'];
                tokens['refresh-token'] = json['refresh_token'];
                fs.writeFile('tokens.json', JSON.stringify(tokens, null, 2), { encoding: 'utf-8' }, (err) => {
                    if (err)
                        console.log(err);
                    else {
                        resolve({
                            status: true,
                            message: 'OAuth Token refreshed!'
                        });
                    }
                });
            }
        }).catch((err) => {
            reject({
                status: false,
                message: `* Error: ${err}`
            });
        });
    });
}
/**
 * Prompt user to log-in to Twitch to authenticate the app. Gets valid OAuth token.
 * @param tokens Tokens object containing client information.
 * @returns {Promise<RetStatus>}
 */
function authorize(tokens) {
    return new Promise((resolve, reject) => {
        console.log('OAuth token is invalid, must get a new one.');
        // Send user to authorization URL
        const url = `https://id.twitch.tv/oauth2/authorize` +
            `?client_id=${tokens['client-id']}` +
            `&redirect_uri=http://localhost` +
            `&response_type=code` +
            `&scope=chat:read+chat:edit` +
            `&force_verify=true`;
        console.log(`Navigate to this URL and authorize the app: ${url}`);
        http.createServer(function (req, res) {
            this.close();
            if (!req.url) {
                reject();
            }
            else {
                const m = code_pattern.exec(req.url);
                if (m) {
                    // code recieved, now request oauth token
                    const token_url = `https://id.twitch.tv/oauth2/token` +
                        `?client_id=${tokens['client-id']}` +
                        `&client_secret=${tokens['client-secret']}` +
                        `&code=${m[1]}` +
                        `&grant_type=authorization_code` +
                        `&redirect_uri=http://localhost`;
                    nf(token_url, { method: 'POST' }).then((res) => res.json()).then((json) => {
                        const oauth_token = json['access_token'];
                        const refresh_token = json['refresh_token'];
                        tokens['oauth-token'] = oauth_token;
                        tokens['refresh-token'] = refresh_token;
                        fs.writeFileSync('tokens.json', JSON.stringify(tokens, null, 2), { encoding: 'utf-8' });
                        res.writeHead(200, {
                            'Content-Type': 'text/html'
                        });
                        res.write(fs.readFileSync('response.html', { encoding: 'utf-8' }));
                        res.end();
                        resolve({
                            status: true,
                            message: 'Successfully authorized application, OAuth token recieved.'
                        });
                    }).catch((err) => {
                        reject({
                            status: false,
                            message: `* Error: ${err}`
                        });
                    });
                }
                else {
                    reject({
                        status: false,
                        message: `* Error: req.url = ${req.url}`
                    });
                }
            }
        }).listen(80);
    });
}
// WORK IN PROGRESS
function event_sub(tokens) {
    // first get app token:
    const token_url = `https://id.twitch.tv/oauth2/token` +
        `?client_id=${tokens['client-id']}` +
        `&client_secret=${tokens['client-secret']}` +
        `&grant_type=client_credentials` +
        `&scope=chat:read`;
    nf(token_url, {
        method: 'POST'
    }).then((res) => res.json()).then((json) => {
        const app_token = json['access_token'];
        const url = 'https://api.twitch.tv/helix/eventsub/subscriptions';
        nf(url, {
            method: 'POST',
            headers: {
                'Client-ID': tokens['client-id'],
                'Authorization': `Bearer ${app_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'type': 'channel.follow',
                'version': '1',
                'condition': {
                    'broadcaster_user_id': '165125839'
                },
                'transport': {
                    'method': 'webhook',
                    'callback': 'https://bf738ae08135.ngrok.io',
                    'secret': 'nimbus_is_well_behaved'
                }
            })
        }).then((res) => res.json()).then((json) => {
            // TODO: CONTINUE HERE
            http.createServer((req, res) => {
                console.log(req);
            }).listen(443);
        }).catch((err) => {
            console.error(err);
        });
    }).catch((err) => {
        console.log(err);
    });
}
function main() {
    const tokens = read_tokens('tokens.json');
    // Check if stored oauth token is valid:
    nf('https://api.twitch.tv/helix/search/channels?query=gaia_blade', {
        headers: {
            'client-id': `${tokens['client-id']}`,
            'Authorization': `Bearer ${tokens['oauth-token']}`
        }
    }).then((res) => res.json()).then(async (json) => {
        if ('error' in json) {
            try {
                const refreshed = await refresh(tokens);
                if (!refreshed.status) {
                    console.log(refreshed.message);
                    const authorized = await authorize(tokens);
                    console.log(authorized.message);
                    bot(tokens['oauth-token']);
                }
                else {
                    bot(tokens['oauth-token']);
                }
            }
            catch (err) {
                console.log(err);
            }
        }
        else {
            bot(tokens['oauth-token']);
        }
    }).catch((err) => {
        console.log(err);
    });
}
const bot = (oauth_token) => {
    console.clear();
    const opts = {
        identity: {
            username: 'sanctum_bot',
            password: oauth_token
        },
        channels: [
            'gaia_blade'
        ]
    };
    const msg_colors = {
        streamer: colors.blue,
        bot: colors.green,
        chat: colors.red
    };
    const streamer_username = 'gaia_blade';
    const bot_username = 'sanctum_bot';
    const client = new tmi.client(opts);
    client.on('message', (target, context, msg, self) => {
        // Format for multi-line messages
        const num_spaces = context.username.length + 2;
        const spaces = ' '.repeat(num_spaces);
        msg = msg.trim();
        // Format the string with leading spaces
        let console_msg = '';
        console_msg += msg.substr(0, columns - num_spaces);
        for (let i = columns - num_spaces; i < msg.length; i += columns - num_spaces) {
            console_msg += `\n${spaces}${msg.substr(i, columns - num_spaces)}`;
        }
        const user_type = ((username) => {
            if (username === streamer_username)
                return msg_colors['streamer'];
            if (username === bot_username)
                return msg_colors['bot'];
            return msg_colors['chat'];
        })(context.username);
        console.log(`${user_type(context.username)}: ${colors.white(console_msg)}`);
        // Program in commands:
        if (!self) {
            if (msg == '!roll') {
                const roll = Math.floor(Math.random() * 6);
                client.say(target, `@${context.username} ${roll.toString()}`).catch((err) => {
                    console.error(err);
                });
            }
        }
    });
    client.on('connected', (addr, port) => {
        console.log(colors.yellow(`* Connected to ${addr}:${port}`));
    });
    client.connect();
};
//event_sub();
main();
