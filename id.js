/**
 * Use this script to get your broadcaster id!
 */

const fs = require('fs');
const fetch = require('node-fetch')

const tokens = JSON.parse(fs.readFileSync('tokens.json'));

const username = 'gaia_blade'

fetch(`https://api.twitch.tv/helix/users?login=${username}`, {
    headers: {
        'Client-ID': tokens['client-id'],
        'Authorization': `Bearer ${tokens['oauth-token']}`
    }
}).then(res => res.json()).then((json) => {
    console.log(json['data'][0]['id']);
});