const config = require('config');
const SMTPServer = require('smtp-server').SMTPServer;
const MailParser = require('mailparser').simpleParser;
const PassThrough = require('stream').PassThrough;
const sanitize = require('./lib/email-sanitize');
const Email = require('./models/email');

const server = new SMTPServer({
	name: config.mail.hostname,
	banner: config.mail.banner,
	secure: false,
	disabledCommands: ['AUTH', 'STARTTLS'],
	onRcptTo: (address, session, callback) => {
		// Only accept whitelisted recipient address domains
		for (const domain of config.mail.domains) {
			if (address.address.endsWith('@' + domain)) {
				return callback();
			}
		}

		return callback(new Error('Invalid email address'));
	},
	onData: (stream, session, callback) => {
		const original = new PassThrough();

		MailParser(stream).then(email => {
			streamToString(original, originalMsg => {
				email.original = originalMsg;
				email.from = email.from.value;
				email.to = email.to.value;
				email.sentDate = email.date;
				email.inReplyTo = email.inReplyTo || null;
				email.references = email.references || [];

				delete email.headers;
				delete email.attachments;
				delete email.textAsHtml;
				delete email.date;

				sanitize(email.text, email.html, email.subject, (text, html) => {
					email.text = text;
					email.html = html;

					(new Email(email)).save();

					callback();
				});
			});
		}).catch(callback);

		stream.pipe(original);

		function streamToString(stream, callback) {
			const chunks = [];

			stream.on('data', chunk => {
				chunks.push(chunk);
			});

			stream.on('end', () => {
				callback(chunks.join(''));
			});
		}
	}
});

server.listen(process.env.PORT || config.mail.port, process.env.HOST || config.mail.host);
