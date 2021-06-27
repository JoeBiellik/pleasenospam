FROM node:11.6.0-alpine

WORKDIR /usr/src/app

COPY package*.json /usr/src/app/
COPY config /usr/src/app/config/
COPY lib /usr/src/app/lib/
COPY controllers /usr/src/app/controllers/
COPY public /usr/src/app/public/
COPY models /usr/src/app/models/
COPY views /usr/src/app/views/
COPY app.js db.js router.js server.js /usr/src/app/

RUN cd /usr/src/app && npm install --only=production

EXPOSE 80

CMD [ "npm", "start" ]
