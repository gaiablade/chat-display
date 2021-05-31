import fs = require('fs');

interface EventSub {
    oauth_token: string;
}

class Tokens {
    client_id?: string;
    client_secret?: string;
    oauth_token?: string;
    refresh_token?: string;
    eventsub?: EventSub;
    filename: string;

    constructor(filename:string) {
        this.filename = filename;
    }

    done() {
        return new Promise<void>((resolve, reject) => {
            fs.readFile(this.filename, {encoding: 'utf8'}, (err: NodeJS.ErrnoException | null, data: string) => {
                if (err) {
                    reject(`* Error when reading file ${this.filename}!`);
                } else {
                    try {
                        const json = JSON.parse(data);
                        this.client_id = json.client_id;
                        this.client_secret = json.client_secret;
                        this.oauth_token = json.oauth_token;
                        this.refresh_token = json.refresh_token;
                        this.eventsub = {oauth_token: json.eventsub?.oauth_token || undefined};
                        resolve();
                    } catch (err:any) {
                        console.error(err);
                        reject();
                    }
                }
            });
        });
    }

    load() {
        return new Promise<void>((resolve, reject) => {
            fs.readFile(this.filename, {encoding: 'utf8'}, (err: NodeJS.ErrnoException | null, data: string) => {
                if (err) {
                    reject(`* Error when reading file ${this.filename}!`);
                } else {
                    try {
                        const json = JSON.parse(data);
                        this.client_id = json.client_id;
                        this.client_secret = json.client_secret;
                        this.oauth_token = json.oauth_token;
                        this.refresh_token = json.refresh_token;
                        this.eventsub = {oauth_token: json.eventsub?.oauth_token || undefined};
                        resolve();
                    } catch (err:any) {
                        console.error(err);
                        reject();
                    }
                }
            });
        });
    }

    export() {
        return new Promise<void>((resolve, reject) => {
            fs.writeFile(this.filename, JSON.stringify(this, null, 2), {
                encoding: 'utf8'
            }, (err: any) => {
                if (err) {
                    console.error(err);
                    reject();
                } else {
                    resolve();
                }
            });
        });
    }
}

export {
    Tokens
}