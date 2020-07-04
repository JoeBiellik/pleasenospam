# please, no spam
[![License](https://img.shields.io/github/license/JoeBiellik/pleasenospam.svg)](LICENSE.md)
[![Release Version](https://img.shields.io/github/release/JoeBiellik/pleasenospam.svg)](https://github.com/JoeBiellik/pleasenospam/releases)
[![Dependencies](https://img.shields.io/david/JoeBiellik/pleasenospam.svg)](https://david-dm.org/JoeBiellik/pleasenospam)

> Simple [Node.js](https://nodejs.org/) temporary email service built with [Koa](https://koajs.com/), [RethinkDB](https://rethinkdb.com/), [Nodemailer](https://nodemailer.com/), [Pug](https://pugjs.org/), [Bootstrap](https://getbootstrap.com/) and [Handlebars.js](https://handlebarsjs.com/).

The app consists of two parts: a web frontend for viewing stored mail and a SMTP server which accepts messages and saves them in the database.

Use it now at [pleasenospam.email](https://pleasenospam.email/)

## Features
* Real-time email notifications powered by [RethinkDB changefeeds](https://rethinkdb.com/docs/changefeeds/javascript/) and [server-sent events](https://developer.mozilla.org/docs/Web/API/Server-sent_events).
* Live email alerts using [browser web notifications](https://developer.mozilla.org/docs/Web/API/Notifications_API) and [favico.js](http://lab.ejci.net/favico.js/).
* Full HTML email support sanitized with [Google Caja](https://developers.google.com/caja/).
* Multiple domain support.

## Development
1. Clone this repo:
  ```sh
  git clone https://github.com/JoeBiellik/pleasenospam.git && cd pleasenospam
  ```

2. Install dependencies:
  ```sh
  docker-compose run -e NODE_ENV= --rm --no-deps app npm install
  ```

3. Start the mail server:
  ```sh
  docker-compose up -d mail
  ```

4. Start the frontend and watch for changes:
  ```sh
  docker-compose run -e NODE_ENV= --rm --service-ports app npm run watch
  ```

## Deployment
1. Follow the first two development steps.

2. Configure `config/docker.json` with any custom setting overrides

3. Configure `docker-compose.yml` with Docker options and ports to use

4. Start the production frontend, database and mail servers:
  ```sh
  docker-compose up
  ```
