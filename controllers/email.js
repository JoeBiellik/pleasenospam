const config = require('config');
const SMTPConnection = require('smtp-connection');
const mailcomposer = require('mailcomposer');
const db = require('../db')();
const Emails = require('../models/email');

module.exports = {
	async get(ctx) {
		const [address, domain] = ctx.params.email.split('@');
		const validator = new RegExp(/^([-!#-'*+/-9=?A-Z^-~]+(\.[-!#-'*+/-9=?A-Z^-~]+)*|"(\[\]!#-[^-~ \t]|(\\[\t -~]))+")$/);

		if (!address.match(validator)) {
			ctx.throw('Invalid email address', 400);
		}

		if (!config.mail.domains.includes(domain)) {
			ctx.throw('Invalid email domain', 400);
		}

		try {
			const emails = await Emails.filter((email) => {
				return email('to').contains((to) => {
					return to('address').eq(ctx.params.email);
				});
			}).orderBy(db.r.asc('date'));

			ctx.body = emails;
		} catch (ex) {
			ctx.throw('Email not found', 404);
		}
	},

	async raw(ctx) {
		try {
			const email = await Emails.get(ctx.params.id).run();

			ctx.type = 'text/plain; charset=utf-8';
			ctx.body = email.original || '';
		} catch (ex) {
			ctx.throw('Email not found', 404);
		}
	},

	async html(ctx) {
		try {
			const email = await Emails.get(ctx.params.id).run();

			ctx.type = 'text/html; charset=utf-8';
			ctx.body = email.html || '';
			ctx.set('X-Frame-Options', 'SAMEORIGIN');
		} catch (ex) {
			ctx.throw('Email not found', 404);
		}
	},

	async text(ctx) {
		try {
			const email = await Emails.get(ctx.params.id).run();

			ctx.type = 'text/plain; charset=utf-8';
			ctx.body = email.text || '';
			ctx.set('X-Frame-Options', 'SAMEORIGIN');
		} catch (ex) {
			ctx.throw('Email not found', 404);
		}
	},

	async delete(ctx) {
		try {
			await Emails.get(ctx.params.id).delete();

			ctx.status = 204;
		} catch (ex) {
			ctx.throw('Email not found', 404);
		}
	},

	test(ctx) {
		const connection = new SMTPConnection({
			host: config.app.mail.host,
			port: config.app.mail.port,
			name: config.mail.hostname,
			secure: false,
			ignoreTLS: true,
			authMethod: 'NONE'
		});

		connection.connect(() => {
			let envelope = {
				from: 'mailbot@' + config.mail.domains[0],
				to: ctx.params.email
			};

			let mail = mailcomposer({
				from: '"Mr Mailbot" <' + envelope.from + '>',
				to: envelope.to,
				subject: 'Your test email is here!',
				text: 'Hello World!\n\nNow go try with a real email!'
			});

			connection.send(envelope, mail.createReadStream(), (error) => {
				if (error) {
					console.error(error);
					connection.close();
				}

				connection.quit();
			});
		});

		ctx.status = 204;
	}
};
