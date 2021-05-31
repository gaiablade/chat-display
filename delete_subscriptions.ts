import node_fetch = require('node-fetch');
import tok        = require('./tokens')

const fetch = node_fetch.default;

async function getToken(tokens: tok.Tokens): Promise<string> {
    const token_url:string = `https://id.twitch.tv/oauth2/token` +
                            `?client_id=${tokens.client_id}` +
                            `&client_secret=${tokens.client_secret}` +
                            `&grant_type=client_credentials` +
                            `&scope=chat:read`;

    const oauth_token = await fetch(token_url, {
        method: 'POST'
    }).then((res: node_fetch.Response) => res.json());
    return oauth_token.access_token;
}

async function getSubscriptions(tokens: tok.Tokens, oauth_token:string): Promise<any> {
    if (tokens.client_id === null) throw new Error('Client-ID is null!');
    return await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
        headers: {
            'Client-ID': tokens.client_id?tokens.client_id:'',
            Authorization: `Bearer ${oauth_token}`
        }
    }).then((res:node_fetch.Response) => res.json());
}

async function deleteStuff(tokens:tok.Tokens, subscriptions: Array<any>, oauth_token:string): Promise<void> {
    if (tokens.client_secret === null) throw new Error('Client-ID is null!');
    const client_id:string = tokens.client_id || ' ';
    subscriptions.map(async (subscription: any, index: number): Promise<void> => {
        const res = await fetch(`https://api.twitch.tv/helix/eventsub/subscriptions?id=${subscription.id}`, {
            method: 'DELETE',
            headers: {
                'Client-ID': client_id,
                Authorization: `Bearer ${oauth_token}`
            }
        }).catch((err: any) => console.error(err));
        console.log(res);
    });
}

async function main(): Promise<void> {
    const tokens: tok.Tokens = new tok.Tokens('tokens.json');
    await tokens.done();

    const oauth_token: string = await getToken(tokens);
    const {total, data, pagination}: {total: number, data: Array<any>, pagination: Object}
        = await getSubscriptions(tokens, oauth_token);
    console.log(`Num Subscriptions: ${total}`)
    deleteStuff(tokens, data, oauth_token).catch((err: any) => console.error(err));
}

main().catch((err: any) => console.error(err));