const util = require('util');
const stream = require('stream');
const Emails = require('../models/email');

util.inherits(emailStream, stream.Readable);

function emailStream(options) {
	if (!(this instanceof emailStream)) return new emailStream(options);

	stream.Readable.call(this, options || {});

	// Subscribe to model changes
	Emails.filter(email => {
		return email('to').contains((to) => {
			return to('address').eq(options.email);
		});
	}).changes().then(feed => {
		feed.each((error, entity) => {
			if (entity.isSaved() === false) return;

			this.push(JSON.stringify(entity));
		});
	});
}

// Moans otherwise
emailStream.prototype._read = () => {};

module.exports = emailStream;
