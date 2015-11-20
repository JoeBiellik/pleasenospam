var util = require('util');
var stream = require('stream');
var Emails = require('../models/email');

util.inherits(emailStream, stream.Readable);

function emailStream(options) {
	if (!(this instanceof emailStream)) return new emailStream(options);

	stream.Readable.call(this, options || {});

	// Subscribe to model changes
	Emails.changes().then((feed) => {
		feed.each((error, entity) => {
			this.push(JSON.stringify(entity));
		});
	});
}

// Moans otherwise
emailStream.prototype._read = () => {};

module.exports = emailStream;
