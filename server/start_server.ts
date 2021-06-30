import fs = require('fs');
import { Tokens } from './utils/tokens';
import node_fetch = require('node-fetch');
import WebSocket = require('ws');
import http = require('http');

const fetch = node_fetch.default;

class Message {
    username: string = '';
    content: string = '';

    constructor(username: string, content: string) {
        this.username = username;
        this.content = content;
    }
}

function parseIRCMessage(message: string) : Message | null {
    const words = message.split(' ');
    console.log(words);
    if (words.length > 2 && words[1] === 'PRIVMSG') {
        const username: string = words[2].substr(1);
        const message: string = words.slice(3).join(' ').substr(1);
        return {
            username: username,
            content: message
        };
    }
    return null;
}

class App {
    react_link: http.Server | undefined;
    messages: Array<Message> = [];

    constructor() {
        this.react_link = http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
            if (req.url?.startsWith('/get_messages')) {
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Access-Control-Request-Method', '*');
                res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
                res.setHeader('Access-Control-Allow-Headers', req.headers.origin || '*');

                res.writeHead(200, 'Success', {
                    'Content-Type': 'application/json'
                });
                res.write(JSON.stringify(this.messages, null, 2));
                res.end();
            }
        }).listen(5000);
    }

    async init() {
        const tokens: Tokens = new Tokens('./tokens.json');
        await tokens.load();

        interface Options {
            username: string,
            password: string
        }

        const options: Options = {
            username: 'gaia_blade',
            password: tokens.oauth_token ? tokens.oauth_token : ''
        };

        const sock: WebSocket = new WebSocket('ws://irc-ws.chat.twitch.tv:80');
        sock.onopen = (ev: WebSocket.OpenEvent) => {
            sock.send(`PASS oauth:${options.password}`);
            sock.send(`NICK ${options.username}`);
            sock.send('JOIN #gaia_blade');
        }

        sock.onerror = (ev: WebSocket.ErrorEvent) => {
            console.log('* Error!');
            console.log(ev);
        }

        sock.onmessage = (event: WebSocket.MessageEvent) => {
            console.log('New Message:');
            console.log(event.data);

            const message: Message | null = parseIRCMessage(event.data.toString());

            if (message !== null) {
                this.messages.push(message);
            }

            if (event.data.toString().startsWith('PING')) {
                console.log('Ponging back...');
                sock.send('PONG :tmi.twitch.tv');
            }
        }
    }
}

async function main() {
    const app: App = new App();
    await app.init();
}

main();