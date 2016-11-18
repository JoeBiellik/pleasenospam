var emailStream = require('../lib/email-stream');
var sseTransform = require('../lib/sse-transform');

module.exports = {
	*subscribe() {
		this.compress = false;
		this.req.setTimeout(Number.MAX_VALUE);
		this.type = 'text/event-stream; charset=utf-8';
		this.set('Cache-Control', 'no-cache');
		this.set('Connection', 'keep-alive');
		this.set('Transfer-Encoding', 'chunked');

		var socket = this.socket;
		socket.on('error', close);
		socket.on('close', close);

		var body = this.body = sseTransform();
		var stream = emailStream({
			email: this.params.email
		});
		stream.pipe(body);

		function close() {
			stream.unpipe(this.body);
			socket.removeListener('error', close);
			socket.removeListener('close', close);
		}
	}
};
