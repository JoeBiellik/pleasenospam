const router = require('koa-router')();
const config = require('config');
const name = require('sillyname');
const email = require('./controllers/email');
const sse = require('./controllers/sse');

router.get('/', async(ctx) => {
	await ctx.render('index', {
		pretty: config.app.prettyHtml,
		title: config.app.title,
		defaultAddress: name.randomAdjective().toLowerCase() + '-' + name.randomNoun() + '@' + config.mail.domains[Math.floor(Math.random() * config.mail.domains.length)],
		domains: config.mail.domains
	});
});

router.get('/:email.json', email.get);
router.get('/:email.feed', sse.subscribe);
router.post('/:email', email.test);
router.get('/:id.html', email.html);
router.get('/:id.txt', email.text);
router.get('/:id.raw', email.raw);
router.delete('/:id', email.delete);

module.exports = router;
