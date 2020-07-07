const config = require('config');
const SMTPConnection = require('smtp-connection');
const mailcomposer = require('mailcomposer');
const Emails = require('../models/email');

const emailAddresses = require('email-addresses');
const reservedEmailAddressesList = require('reserved-email-addresses-list');
const reservedAdminList = require('reserved-email-addresses-list/admin-list.json');

module.exports = {
	validateEmail(email, ctx, next) {
		const parsed = emailAddresses.parseOneAddress(email);

		if (parsed === null) {
			ctx.throw(400, 'Invalid email address', {
				headers: {
					'Cache-Control': 'no-cache'
				}
			});
		}

		const local = parsed.local.toLowerCase();
		const domain = parsed.domain.toLowerCase();

		let reserved = reservedEmailAddressesList.find(addr => addr === local);
		if (!reserved) reserved = reservedAdminList.find(addr => addr === local || local.startsWith(addr) || local.endsWith(addr));

		if (reserved) {
			ctx.throw(400, 'Reserved email address', {
				headers: {
					'Cache-Control': 'no-cache'
				}
			});
		}

		if (!config.mail.domains.includes(domain)) {
			ctx.throw(400, 'Invalid email domain', {
				headers: {
					'Cache-Control': 'no-cache'
				}
			});
		}

		ctx.email = email;

		return next();
	},

	async validateId(id, ctx, next) {
		try {
			const email = await Emails.get(id).run();

			ctx.id = id;
			ctx.email = email;
		} catch (ex) {
			ctx.throw(404, 'Email not found', {
				headers: {
					'Cache-Control': 'no-cache'
				}
			});
		}

		return next();
	},

	async get(ctx) {
		try {
			const emails = await Emails.filter((email) => {
				return email('to').contains((to) => {
					return to('address').eq(ctx.email);
				});
			}).orderBy('date');

			ctx.set('Cache-Control', 'no-cache');
			ctx.body = emails;
		} catch (ex) {
			ctx.throw(404, 'Email not found', {
				headers: {
					'Cache-Control': 'no-cache'
				}
			});
		}
	},

	async raw(ctx) {
		ctx.set('Cache-Control', 'public');
		ctx.set('X-Frame-Options', 'SAMEORIGIN');
		if ('download' in ctx.query) ctx.attachment('email-' + ctx.id + '-raw.txt');
		ctx.body = ctx.email.original || '';
	},

	async html(ctx) {
		ctx.set('Cache-Control', 'public');
		ctx.set('X-Frame-Options', 'SAMEORIGIN');
		if ('download' in ctx.query) ctx.attachment('email-' + ctx.id + '.html');
		ctx.body = ctx.email.html || '';
	},

	async text(ctx) {
		ctx.set('Cache-Control', 'public');
		ctx.set('X-Frame-Options', 'SAMEORIGIN');
		if ('download' in ctx.query) ctx.attachment('email-' + ctx.id + '.txt');
		ctx.body = ctx.email.text || '';
	},

	async delete(ctx) {
		await Emails.get(ctx.id).delete();

		ctx.set('Cache-Control', 'no-cache');
		ctx.status = 204;
	},

	test(ctx) {
		const connection = new SMTPConnection({
			host: config.app.smtp.host,
			port: config.app.smtp.port,
			name: config.mail.hostname,
			secure: false,
			ignoreTLS: true,
			authMethod: 'NONE'
		});

		connection.connect(() => {
			const envelope = {
				from: config.app.test.fromAddress + '@' + config.mail.domains[0],
				to: ctx.email
			};

			const mail = mailcomposer({
				from: '"' + config.app.test.fromName + '" <' + envelope.from + '>',
				to: envelope.to,
				subject: config.app.test.subject,
				text: config.app.test.message
			});

			connection.send(envelope, mail.createReadStream(), (error) => {
				if (error) {
					console.error(error);
					connection.close();
				}

				connection.quit();
			});
		});

		ctx.set('Cache-Control', 'no-cache');
		ctx.status = 204;
	}
};
