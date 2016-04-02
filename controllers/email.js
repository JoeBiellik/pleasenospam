var config = require('config');
var SMTPConnection = require('smtp-connection');
var mailcomposer = require('mailcomposer');
var db = require('../db')();
var Emails = require('../models/email');

module.exports = {
	*get() {
		let [address, domain] = this.params.email.split('@');
		let validator = new RegExp(/^([-!#-'*+/-9=?A-Z^-~]+(\.[-!#-'*+/-9=?A-Z^-~]+)*|"([]!#-[^-~ \t]|(\\[\t -~]))+")$/);

		if (!address.match(validator)) {
			this.throw('Invalid email address', 400);
		}

		if (!config.mail.domains.includes(domain)) {
			this.throw('Invalid email domain', 400);
		}

		try {
			let emails = yield Emails.filter((email) => {
				return email('to').contains((to) => {
					return to('address').eq(this.params.email);
				});
			}).orderBy(db.r.desc('date'));

			this.body = emails;
		} catch (ex) {
			console.log(ex);
			this.throw('Email not found', 404);
		}
	},

	*original() {
		try {
			let email = yield Emails.get(this.params.id).run();

			this.type = 'text/plain; charset=utf-8';
			this.body = email.original || '';
		} catch (ex) {
			this.throw('Email not found', 404);
		}
	},

	*test() {
		let connection = new SMTPConnection({
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
				to: this.params.email
			};

			let mail = mailcomposer({
				from: '"Mr Mailbot" <' + envelope.from + '>',
				to: envelope.to,
				subject: 'Your test email is here!',
				text: 'Hello World!\n\nNow go try with a real email!'
			});

			connection.send(envelope, mail.createReadStream(), (error, info) => {
				if (error) {
					console.error(error);
					connection.close();
				}

				connection.quit();
			});
		});

		this.status = 204;
	}
};
