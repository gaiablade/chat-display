const colors = require('colors');
import * as http from 'http';
import * as https from 'https';
const nf = require('node-fetch');
const fs = require('fs');
const tmi = require('tmi.js');
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});
const crypto = require('crypto');

interface RetStatus {
    status: boolean,
    message: string
}

interface Tokens {
    'client-id': string,
    'client-secret': string,
    'oauth-token': string,
    'refresh-token': string
}

/**
 * Read tokens from confidential JSON file.
 * @param filename JSON file containing the token information
 * @returns Tokens
 */
function read_tokens(filename: string): Tokens {
    const tokens = JSON.parse(fs.readFileSync('tokens.json', {encoding: 'utf-8'}));
    return {
        'client-id': tokens['client-id'],
        'client-secret': tokens['client-secret'],
        'oauth-token': tokens['oauth-token'],
        'refresh-token': tokens['refresh-token']
    };
}

const code_pattern = /\?code=(.+)&scope=.+/

const columns = process.stdout.columns;

/**
 * Use refresh token to get new valid OAuth token.
 * @param tokens Tokens object containing client information and refresh token.
 * @returns {Promise<RetStatus>}
 */
function refresh(tokens: Tokens): Promise<RetStatus> {
    interface RefreshJSON {
        message: string;
        status: number,
        'access_token': string,
        'refresh_token': string
    }

    return new Promise((resolve, reject) => {
        const refresh_url = `https://id.twitch.tv/oauth2/token` +
                            `?grant_type=refresh_token` +
                            `&client_id=${tokens['client-id']}` +
                            `&client_secret=${tokens['client-secret']}`

        // Post refresh request to API
        nf(refresh_url, {
            method: 'POST'
        }).then((res: Response) => res.json()).then((json: RefreshJSON) => {
            if ('error' in json) {
                console.error(`* Error: ${json['message']}`);
                resolve({
                    status: false,
                    message: `* Error: ${json['message']}`
                });
            } else if (json['status'] === 400) {
                resolve({
                    status: false,
                    message: `* Error: ${json['message']}`
                });
            } else {
                tokens['oauth-token'] = json['access_token'];
                tokens['refresh-token'] = json['refresh_token'];
                fs.writeFile('tokens.json', JSON.stringify(tokens, null, 2), {encoding:'utf-8'}, (err: Error) => {
                    if (err) console.log(err);
                    else {
                        resolve({
                            status: true,
                            message: 'OAuth Token refreshed!'
                        });
                    }
                });
            }
        }).catch((err: Error) => {
            reject({
                status: false,
                message: `* Error: ${err}`
            });
        })
    });
}

/**
 * Prompt user to log-in to Twitch to authenticate the app. Gets valid OAuth token. 
 * @param tokens Tokens object containing client information.
 * @returns {Promise<RetStatus>}
 */
function authorize(tokens: Tokens): Promise<RetStatus> {
    interface AuthorizeJSON {
        'access_token': string,
        'refresh_token': string
    }

    return new Promise((resolve, reject) => {
        console.log('OAuth token is invalid, must get a new one.');
        // Send user to authorization URL
        const url = `https://id.twitch.tv/oauth2/authorize` +
                    `?client_id=${tokens['client-id']}` +
                    `&redirect_uri=http://localhost` +
                    `&response_type=code` +
                    `&scope=chat:read+chat:edit` +
                    `&force_verify=true`
        console.log(`Navigate to this URL and authorize the app: ${url}`)

        http.createServer(function (this:any, req:http.IncomingMessage, res:http.ServerResponse) {
            this.close();
            if (!req.url) {
                reject();
            } else {
                const m = code_pattern.exec(req.url);
                if (m) {
                    // code recieved, now request oauth token
                    const token_url = `https://id.twitch.tv/oauth2/token` +
                                    `?client_id=${tokens['client-id']}` +
                                    `&client_secret=${tokens['client-secret']}` +
                                    `&code=${m[1]}` +
                                    `&grant_type=authorization_code` +
                                    `&redirect_uri=http://localhost`;
                    nf(
                        token_url, {method: 'POST'}
                    ).then((res: any) => res.json()).then((json: AuthorizeJSON) => {
                        const oauth_token = json['access_token'];
                        const refresh_token = json['refresh_token']
                        tokens['oauth-token'] = oauth_token;
                        tokens['refresh-token'] = refresh_token;
                        fs.writeFileSync('tokens.json', JSON.stringify(tokens, null, 2), {encoding:'utf-8'});

                        res.writeHead(200, {
                            'Content-Type': 'text/html'
                        })
                        res.write(fs.readFileSync('response.html', {encoding:'utf-8'}));
                        res.end();

                        resolve({
                            status: true,
                            message: 'Successfully authorized application, OAuth token recieved.'
                        });
                    }).catch((err: Error) => {
                        reject({
                            status: false,
                            message: `* Error: ${err}`
                        });
                    });
                } else {
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
const verification_password = 'nimbus_is_well_behaved';
function verifySignature(messageSignature:any, messageID:any, messageTimestamp:any, body:any) {
    let message = messageID + messageTimestamp + body
    let signature = crypto.createHmac('sha256', verification_password).update(message) // Remember to use the same secret set at creation
    let expectedSignatureHeader = "sha256=" + signature.digest("hex")

    return expectedSignatureHeader === messageSignature
}
async function event_sub(tokens: Tokens): Promise<void> {
    const ngrok_url = await (async () => {
        return new Promise((resolve, reject) => {
            readline.question('Please enter the ngrok url: ', (url:string) => {
                resolve(url);
            })
        });
    })();
    
    // first get app token:
    const token_url = `https://id.twitch.tv/oauth2/token` +
                       `?client_id=${tokens['client-id']}` +
                       `&client_secret=${tokens['client-secret']}`+
                       `&grant_type=client_credentials` +
                       `&scope=chat:read`
    
    nf(token_url, {
        method: 'POST'
    }).then((res:any) => res.json()).then((json:any) => {
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
                    'callback': `${ngrok_url}/notifications`,
                    'secret': verification_password
                }
            })
        }).then((res:any) => res.json()).then((json:any) => {
            if ('data' in json) {
                fs.writeFileSync('webhook.json', JSON.stringify({'app-token': app_token, id: json['data'][0]['id']}, null, 2));
            } else {
                console.log('try again in a minute');
            }
            const server = http.createServer((req:any, res:http.ServerResponse) => {
                const headers = req['headers'];
                let body = '';
                req.on('data', (chunk:string) => {
                    body += chunk;
                });
                req.on('end', () => {
                    const json = JSON.parse(body);

                    if (!verifySignature(headers['twitch-eventsub-message-signature'], headers['twitch-eventsub-message-id'],
                        headers['twitch-eventsub-message-timestamp'], body)) {
                        res.statusCode = 403;
                        res.write('Forbidden');
                        res.end();
                    } else {
                        if (headers['twitch-eventsub-message-type'] === 'webhook_callback_verification') {
                            res.statusCode = 200;
                            res.write(json['challenge']);
                            res.end();
                        } else if (headers['twitch-eventsub-message-type'] === 'notification') {
                            console.log(`New Follower: ${colors.red(json['event']['user_name'])}`);
                            res.write('');
                            res.end();
                        }
                    }
                });
            }).listen(3000);
        }).catch((err:Error) => {
            console.error(err);
        });
    }).catch((err:Error) => {
        console.log(err);
    });
}

async function main(): Promise<void> {
    const tokens = read_tokens('tokens.json');
    await event_sub(tokens);
    // Check if stored oauth token is valid:
    nf('https://api.twitch.tv/helix/search/channels?query=gaia_blade', {
        headers: {
            'client-id': `${tokens['client-id']}`,
            'Authorization': `Bearer ${tokens['oauth-token']}`
        }
    }).then((res:any) => res.json()).then(async (json: any) => {
        if ('error' in json) {
            try {
                const refreshed: any = await refresh(tokens);
                if (!refreshed.status) {
                    console.log(refreshed.message);
                    const authorized: any = await authorize(tokens);
                    console.log(authorized.message);
                    bot(tokens['oauth-token']);
                } else {
                    bot(tokens['oauth-token']);
                }
            } catch (err) {
                console.log(err);
            }
        } else {
            bot(tokens['oauth-token']);
        }
    }).catch((err: Error) => {
        console.log(err);
    });
}

const bot = (oauth_token: string): void => {
    console.clear();

    const opts = {
        identity: {
            username: 'sanctum_bot', // Enter the chatbot's username
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

    client.on('message', (target:any, context:any, msg:any, self:any) => {
        // Format for multi-line messages
        const num_spaces = context.username.length + 2;
        const spaces = ' '.repeat(num_spaces);

        msg = msg.trim();

        // Format the string with leading spaces
        let console_msg = '';
        console_msg += msg.substr(0, columns - num_spaces);
        for (let i = columns - num_spaces; i < msg.length; i += columns-num_spaces) {
            console_msg += `\n${spaces}${msg.substr(i,columns-num_spaces)}`;
        }

        const user_type = ((username) => {
            if (username === streamer_username) return msg_colors['streamer'];
            if (username === bot_username) return msg_colors['bot'];
            return msg_colors['chat'];
        })(context.username);
        console.log(`${user_type(context.username)}: ${colors.white(console_msg)}`);

        // Program in commands:
        if (!self) {
            if (msg == '!roll') {
                const roll = Math.floor(Math.random() * 6);
                client.say(
                    target,
                    `@${context.username} ${roll.toString()}`
                ).catch((err: Error) => {
                    console.error(err);
                });
            }
        }
    });

    client.on('connected', (addr:any, port:any) => {
        console.log(colors.yellow(`* Connected to ${addr}:${port}`));
    });

    client.connect();
};

main();