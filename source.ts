import fs = require('fs');
import node_fetch = require('node-fetch');
import tok = require('./tokens');
import http = require('http');
import colors = require('colors');
import tmi = require('tmi.js')
import es = require('./event_sub');

const fetch = node_fetch.default;

async function validateToken(token: string): Promise<boolean> {
    const validate_url = 'https://id.twitch.tv/oauth2/validate';
    const response = await fetch(validate_url, {
        headers: {
            Authorization: `OAuth ${token}`
        }
    }).then((res: any) => res.json());

    console.log(response);

    if ('status' in response) {
        // Unsuccessful:
        return false;
    } else if ('client_id' in response) {
        // Successful:
        return true;
    } else {
        // Unsuccessful:
        return false;
    }
}

async function refreshToken(tokens: tok.Tokens): Promise<boolean> {
    const refresh_url = 'https://id.twitch.tv/oauth2/token' +
                        '?grant_type=refresh_token' +
                        `&refresh_token=${tokens.refresh_token}` +
                        `&client_id=${tokens.client_id}` +
                        `&client_secret=${tokens.client_secret}`
    
    const response = await fetch(refresh_url, {
        method: 'POST'
    }).then((res: node_fetch.Response) => res.json());

    if ('error' in response) {
        return false;
    } else if ('access_token' in response) {
        tokens.oauth_token = response.access_token;
        tokens.refresh_token = response.refresh_token;
        await tokens.export();
        return true;
    } else {
        return false;
    }
}

async function parseUrlParam(url: string, param_name: string): Promise<string | null> {
    //const pattern = `[?&]${param_name}=(.*)[&$]`;
    const match = new RegExp(`[?&]${param_name}=(.*)[&$]`).exec(url);
    if (match) {
        return match[1];
    } else {
        return null;
    }
}

async function authenticate(tokens: tok.Tokens): Promise<boolean> {
    const authenticate_url = 'https://id.twitch.tv/oauth2/authorize' +
                             `?client_id=${tokens.client_id}` +
                             '&redirect_uri=http://localhost' +
                             '&response_type=code' +
                             '&scope=chat:read+chat:edit' +
                             '&force_verify=true'
    
    console.log(`Please login to authenticate the app: ${authenticate_url}`);

    const access_token = await (() => {
        return new Promise<string | null>((resolve, reject) => {
            const server = http.createServer(async function (this: any, req: http.IncomingMessage, res: http.ServerResponse) {
                if ('url' in req && typeof req.url === 'string') {
                    const code: string | null = await parseUrlParam(req.url, 'code');
                    res.writeHead(200, 'Success', {
                        'Content-Type': 'text/html'
                    })
                    res.write(fs.readFileSync('response.html', {encoding: 'utf8'}));
                    res.end();
                    this.close();
                    resolve(code);
                }
            }).listen(80);
        });
    })();
    
    if (access_token === null) {
        return false;
    } else {
        const token_url = 'https://id.twitch.tv/oauth2/token' +
                          `?client_id=${tokens.client_id}` +
                          `&client_secret=${tokens.client_secret}` +
                          `&code=${access_token}` +
                          '&grant_type=authorization_code' +
                          '&redirect_uri=http://localhost'
        const response = await fetch(token_url, {
            method: 'POST'
        }).then((res: node_fetch.Response) => res.json()).catch((err: any) => console.error(err));

        if (response) {
            tokens.oauth_token = response.access_token;
            tokens.refresh_token = response.refresh_token;
            await tokens.export();
            return true;
        } else {
            return false;
        }
    }
}

function bot (oauth_token: string | undefined): void  {
    if (oauth_token === undefined) return;
    const columns: number = process.stdout.columns;


    const opts: Object = {
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

    const client: tmi.Client = new tmi.client(opts);

    client.on('message', (target: string, context: tmi.ChatUserstate, msg: string, self: boolean) => {
        // Format for multi-line messages
        const num_spaces: number = context.username ? context.username.length + 2 : 0;
        const spaces: string = ' '.repeat(num_spaces);

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
        console.log(`${user_type(context.username || '')}: ${colors.white(console_msg)}`);

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
        console.clear();
        console.log(colors.gray(`* Connected to ${addr}:${port}`));
    });

    client.connect();
};

async function main(): Promise<void> {
    // Open tokens.json file:
    const tokens: tok.Tokens = new tok.Tokens('tokens.json');
    await tokens.load();

    // Check if OAuth token is valid:
    let is_valid: boolean = false;
    if (tokens.oauth_token !== undefined) {
        is_valid = await validateToken(tokens.oauth_token);
    }

    // If not valid, try refreshing or authenticating:
    if (!is_valid) {
        let is_refreshed: boolean = false;
        if (tokens.refresh_token !== undefined) {
            // try refreshing
            is_refreshed = await refreshToken(tokens);
        }
        let authenticated: boolean = true;
        if (!is_refreshed) {
            authenticated = await authenticate(tokens);
        }
    }

    await es.eventSub(tokens);

    console.log(tokens);
    bot(tokens.oauth_token);
}

main();