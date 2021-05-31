import crypto = require('crypto');
import colors = require('colors');
import tok = require('./tokens');
import http = require('http');
import node_fetch = require('node-fetch');
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

const fetch = node_fetch.default;

const verification_password = 'nimbus_is_well_behaved';
function verifySignature(messageSignature:string, messageID:string, messageTimestamp:string, body:string) {
    let message = messageID + messageTimestamp + body
    let signature = crypto.createHmac('sha256', verification_password).update(message) // Remember to use the same secret set at creation
    let expectedSignatureHeader = "sha256=" + signature.digest("hex")

    return expectedSignatureHeader === messageSignature
}
async function eventSub(tokens: tok.Tokens): Promise<void> {
    const ngrok_url = await (async () => {
        return new Promise((resolve, reject) => {
            readline.question('Please enter the ngrok url: ', (url:string) => {
                resolve(url);
            })
        });
    })();
    
    // first get app token:
    const token_url = `https://id.twitch.tv/oauth2/token` +
                       `?client_id=${tokens.client_id}` +
                       `&client_secret=${tokens.client_secret}`+
                       `&grant_type=client_credentials` +
                       `&scope=chat:read`

    fetch(token_url, {
        method: 'POST'
    }).then((res:node_fetch.Response) => res.json()).then((json:any) => {
        const app_token = json['access_token'];
        const url = 'https://api.twitch.tv/helix/eventsub/subscriptions';
        if (tokens.client_id === undefined) {
            return;
        }
        fetch(url, {
            method: 'POST',
            headers: {
                'Client-ID': tokens.client_id,
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
        }).then((res:node_fetch.Response) => res.json()).then((json:any) => {
            if ('data' in json) {
                //fs.writeFileSync('webhook.json', JSON.stringify({'app-token': app_token, id: json['data'][0]['id']}, null, 2));
            } else {
                console.log(json);
                console.log('try again in a minute');
            }
            const server = http.createServer((req:http.IncomingMessage, res:http.ServerResponse) => {
                const headers = req['headers'];
                let body:string = '';
                req.on('data', (chunk:string):void => {
                    body += chunk;
                });
                req.on('end', ():void => {
                    const json = JSON.parse(body);
                    const get_string = (obj:any):string|null => {
                        if (typeof(obj) === 'string') {
                            return obj;
                        } else {
                            return null;
                        }
                    }
                    const signature:string|null = get_string(headers['twitch-eventsub-message-signature']);
                    const id:string|null = get_string(headers['twitch-eventsub-message-id']);
                    const timestamp:string|null = get_string(headers['twitch-eventsub-message-timestamp']);

                    if (signature === null || id === null || timestamp === null) {
                        res.statusCode = 403;
                        res.write('Forbidden');
                        res.end();
                    } else if (!verifySignature(signature, id, timestamp, body)) {
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
        }).catch((err:any):void => {
            console.error(err);
        });
    }).catch((err:any):void => {
        console.log(err);
    });
}

export {
    eventSub
}