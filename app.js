const koa = require('koa');
const app = new koa();
const config = require('config');
const router = require('./router');
require('./db')();

app.keys = config.app.keys;
app.proxy = true;

app.use(require('koa-logger')());
app.use(require('koa-compress')());
app.use(require('koa-static-cache')('./public', {
	maxAge: config.app.cacheAge
}));
app.use(require('koa-views')(__dirname + '/views', {
	extension: 'pug'
}));

app.use(router.routes(), router.allowedMethods());

module.exports = app;
