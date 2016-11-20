var router = require('koa-router')();
var config = require('config');
var generateName = require('sillyname');
var email = require('./controllers/email');
var sse = require('./controllers/sse');

router.get('/', function *() {
	yield this.render('index', {
		pretty: config.app.prettyHtml,
		title: 'please, no spam',
		defaultAddress: generateName().replace(' ', '-').toLowerCase() + '@' + config.mail.domains[Math.floor(Math.random() * config.mail.domains.length)],
		domains: config.mail.domains
	});
});

router.get('/:email.json', email.get);
router.get('/:email/test', email.test);
router.get('/:email/updates', sse.subscribe);
router.get('/:id.html', email.html);
router.get('/:id.txt', email.text);
router.get('/:id.raw', email.raw);
router.delete ('/:id', email.delete);

module.exports = router;
