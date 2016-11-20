'use strict';

const config = require('config');
const SMTPServer = require('smtp-server').SMTPServer;
const MailParser = require('mailparser').MailParser;
const PassThrough = require('stream').PassThrough;
const sanitize = require('./lib/email-sanitize');
const Email = require('./models/email');

const server = new SMTPServer({
	name: config.mail.hostname,
	banner: config.mail.banner,
	secure: false,
	streamAttachments: true,
	disabledCommands: ['AUTH'],
	onRcptTo: function(address, session, callback) {
		// Only accept whitelisted recipient address domains
		for (let domain of config.mail.domains) {
			if (address.address.endsWith('@' + domain)) {
				return callback();
			}
		}

		return callback(new Error('Invalid email address'));
	},
	onData: function(stream, session, callback) {
		let original = new PassThrough();
		let mailparser = new MailParser();

		mailparser.on('end', function(email) {
			streamToString(original, (originalData) => {
				email.original = originalData;

				sanitize(email.text, email.html, email.subject, (text, html) => {
					email.text = text;
					email.html = html;

					console.log(email.text);
					console.log(email.html);

					// Save email
					(new Email(email)).save();

					callback();
				});
			});
		});

		mailparser.on('error', callback);

		stream.pipe(mailparser);
		stream.pipe(original);

		function streamToString(stream, callback) {
			const chunks = [];

			stream.on('data', (chunk) => {
				chunks.push(chunk);
			});

			stream.on('end', () => {
				callback(chunks.join(''));
			});
		}
	}
});

server.listen(process.env.PORT || config.mail.port, process.env.HOST || config.mail.host);
