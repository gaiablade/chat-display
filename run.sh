#!/usr/bin/bash

cd server
tsc
sudo `which node` authorize_token.js
./ngrok http 3004 > /dev/null &
node get_ngrok_url.js
node start_server.js &

trap "killall ngrok" SIGINT

cd ..

cd client
npm start

killall ngrok