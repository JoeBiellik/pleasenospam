require('babel-polyfill');
require('babel-core/register')({
	presets: ['es2015']
});

var config = require('config');
var app = require('koa')();
var router = require('./router');
var db = require('./db')();

app.keys = config.keys;
app.proxy = true;

app.use(require('koa-logger')());
app.use(require('koa-compress')());
app.use(require('koa-static-cache')('./public', {
	maxAge: config.cacheAge
}));
app.use(require('koa-views')('./views', {
	default: 'jade'
}));

app.use(router.routes(), router.allowedMethods());

module.exports = app;
