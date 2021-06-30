import node_fetch = require('node-fetch');
import { Tokens } from './tokens';
import http = require('http');
import fs = require('fs');

const fetch = node_fetch.default;

export async function validateToken(token: string): Promise<boolean> {
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

export async function refreshToken(tokens: Tokens): Promise<boolean> {
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

export async function authenticate(tokens: Tokens): Promise<boolean> {
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