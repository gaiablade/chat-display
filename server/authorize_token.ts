import { exit, stdin, stdout } from 'process';
import { validateToken, refreshToken, authenticate } from './utils/authorize';
import { Tokens } from './utils/tokens';
import readline = require('readline');

const input = readline.createInterface({
    input: stdin, output: stdout
});

function question(prompt: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        input.question(prompt, (answer: string) => resolve(answer));
    })
}

async function main(): Promise<void> {
    const tokens: Tokens = new Tokens('./tokens.json');
    try {
        await tokens.load();
    } catch (e) {
        console.log('* Error: tokens.json does not exist!');
        const client_id = await question('Please enter your client-id: ');
        const client_secret = await question('Please enter your client-secret: ');
        tokens.client_id = client_id;
        tokens.client_secret = client_secret;
        await tokens.export();
    }

    const valid: boolean = tokens.oauth_token ? await validateToken(tokens.oauth_token) : false;
    if (!valid) {
        const refreshed: boolean = tokens.refresh_token ? await refreshToken(tokens) : false;
        if (!refreshed) {
            const authenticated: boolean = await authenticate(tokens);
            if (!authenticated) {
                console.log('*Error: Could not authenticate OAuth token.');
                exit(1);
            }
        }
    }
    console.log('Your OAuth token is valid!');
    exit(0);
}

main();