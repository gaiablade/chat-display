import fs = require('fs');
import node_fetch = require('node-fetch');
import { exit } from 'process';

const fetch = node_fetch.default;

async function main() {
    //curl http://localhost:4040/api/tunnels > tunnels.json
    const json = await fetch('http://localhost:4040/api/tunnels', {
        method: 'GET'
    })
        .then((value: node_fetch.Response) => value.json())
        .catch((err) => console.log(err));
    
    if (json.tunnels && json.tunnels[0] && json.tunnels[0].public_url) {
        fs.writeFileSync('ngrok_url.json', JSON.stringify({
            url: json.tunnels[0].public_url
        }, null, 2));
        exit(0);
    } else {
        exit(1);
    }
}

main();