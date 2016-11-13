'use strict';

var config = require('config');
var SMTPServer = require('smtp-server').SMTPServer;
var MailParser = require('mailparser').MailParser;
var PassThrough = require('stream').PassThrough;
var Email = require('./models/email');

var server = new SMTPServer({
	name: config.mail.hostname,
	banner: config.mail.banner,
	secure: false,
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

				// Save email
				(new Email(email)).save();

				callback();
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
