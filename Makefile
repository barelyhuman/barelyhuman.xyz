SHELL=/bin/bash
APP_NAME='~'

prepare:
	. ~/.bashrc;nvm use;yarn 

start: prepare
	yarn build
	pm2 start --name "$APP_NAME" 'PORT=3002 node ./.output/server/index.mjs'

restart: prepare
	yarn build
	pm2 restart "$APP_NAME"

stop: 
	pm2 stop "$APP_NAME"

kill:
	pm2 delete "$APP_NAME"
