import fs = require('fs');

class Tokens {
    client_id: string | null = null;
    client_secret: string | null = null;
    oauth_token: string | null = null;
    refresh_token: string | null = null;

    constructor(filename:string) {
        fs.readFile(filename, (err: NodeJS.ErrnoException | null, data: Buffer) => {
            if (err) {
                console.log(err);
            } else {
                const json = JSON.parse(data.toString());
                this.client_id = json['client-id'];
                this.client_secret = json['client-secret'];
                this.oauth_token = json['oauth-token'];
                this.refresh_token = json['refresh-token'];
            }
        });
    }
}

export {
    Tokens
}