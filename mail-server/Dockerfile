FROM node:11.6.0-alpine

WORKDIR /usr/src/app

COPY package*.json /usr/src/app/
COPY config /usr/src/app/config/
COPY lib /usr/src/app/lib/
COPY models /usr/src/app/models/
COPY mail-server.js db.js /usr/src/app/

RUN cd /usr/src/app && npm install --only=production

EXPOSE 25

CMD [ "npm", "run", "mail-server" ]
