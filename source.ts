const colors = require('colors')
const http = require('http')
const nf = require('node-fetch')
const fs = require('fs');
const tmi = require('tmi.js');

interface Tokens {
    'client-id': string,
    'client-secret': string,
    'oauth-token': string,
    'refresh-token': string
}
function read_tokens(filename: string): Tokens {
    const tokens = JSON.parse(fs.readFileSync('tokens.json', {encoding: 'utf-8'}));
    return tokens;
}
const tokens = read_tokens('tokens.json');

const code_pattern = /\?code=(.+)&scope=.+/

const columns = process.stdout.columns;

interface RefreshJSON {
    message: string;
    status: number,
    'access_token': string,
    'refresh_token': string
}
/**
 * Use refresh token to get new valid OAuth token.
 * @returns {Promise}
 */
function refresh() {
    return new Promise((resolve, reject) => {
        const refresh_url = `https://id.twitch.tv/oauth2/token` +
                            `?grant_type=refresh_token` +
                            `&client_id=${tokens['client-id']}` +
                            `&client_secret=${tokens['client-secret']}`
        nf(
            refresh_url, {method: 'POST'}
        ).then((res: any) => res.json()).then((json: RefreshJSON) => {
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
            console.log(err);
            reject();
        })
    });
}

interface AuthorizeJSON {
    'access_token': string,
    'refresh_token': string
}
function authorize() {
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

        http.createServer((req: any, res: any) => {
            console.log(req.url);
            const m = code_pattern.exec(req.url);
            if (m) {
                // code recieved, now request oauth token
                const token_url = `https://id.twitch.tv/oauth2/token` +
                                `?client_id=${tokens['client-id']}` +
                                `&client_secret=${tokens['client-secret']}` +
                                `&code=${m[1]}` +
                                `&grant_type=authorization_code` +
                                `&redirect_uri=http://localhost`
                nf(
                    token_url, {method: 'POST'}
                ).then((res: any) => res.json()).then((json: AuthorizeJSON) => {
                    const oauth_token = json['access_token'];
                    const refresh_token = json['refresh_token']
                    tokens['oauth-token'] = oauth_token;
                    tokens['refresh-token'] = refresh_token;
                    fs.writeFileSync('tokens.json', JSON.stringify(tokens, null, 2), {encoding:'utf-8'});
                }).catch((err: Error) => {
                    console.log(err);
                    reject();
                });
            } else {
                resolve({
                    status: false,
                    message: `* Error: req.url = ${req.url}`
                });
            }
            res.write('Authenticated');
            res.end();
            resolve({
                status: true,
                message: 'Successfully authorized application, OAuth token recieved.'
            });
        }).listen(80);
    });
}

function event_sub() {
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
        console.log(app_token);
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
        }).then((res:any) => res.json()).then((json:any) => {
            // TODO: CONTINUE HERE
            console.log(json);
            console.log(json['transport']);
            http.createServer((req:any, res:any) => {
                console.log('here')
                console.log(req);
            }).listen(443);
        }).catch((err:Error) => {
            console.error(err);
        });
    }).catch((err:Error) => {
        console.log(err);
    })
}

function main() {
    // Check if stored oauth token is valid:
    nf('https://api.twitch.tv/helix/search/channels?query=gaia_blade', {
        headers: {
            'client-id': `${tokens['client-id']}`,
            'Authorization': `Bearer ${tokens['oauth-token']}`
        }
    })
    .then((res:any) => res.json())
    .then(async (json: any) => {
        console.log(json);
        if ('error' in json) {
            try {
                const refreshed: any = await refresh();
                if (!refreshed.status) {
                    console.log(refreshed.message);
                    const authorized: any = await authorize();
                    console.log(authorized.message);
                }
            } catch (err) {
                console.log(err);
            }
        }
        bot(tokens['oauth-token']);
    }).catch((err: Error) => {
        console.log(err);
    });
}

const bot = (oauth_token: string) => {
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
                })
            }
        }
    });

    client.on('connected', (addr:any, port:any) => {
        console.log(colors.yellow(`* Connected to ${addr}:${port}`));
    });

    client.connect();
};

main();
//event_sub();