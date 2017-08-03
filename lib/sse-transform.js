const util = require('util');
const stream = require('stream');

util.inherits(sseTransform, stream.Transform);

function sseTransform(options) {
	if (!(this instanceof sseTransform)) return new sseTransform(options);

	stream.Transform.call(this, options || {});
}

sseTransform.prototype._transform = function(data, enc, callback) {
	// Format into SSE string
	this.push('data: ' + data.toString('utf-8') + '\n\n');

	callback();
};

module.exports = sseTransform;
