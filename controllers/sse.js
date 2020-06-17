const emailStream = require('../lib/email-stream');
const sseTransform = require('../lib/sse-transform');

module.exports = {
	subscribe(ctx) {
		ctx.compress = false;
		ctx.req.setTimeout(0);
		ctx.type = 'text/event-stream; charset=utf-8';
		ctx.set('Cache-Control', 'no-cache');
		ctx.set('Connection', 'keep-alive');
		ctx.set('Transfer-Encoding', 'chunked');

		const socket = ctx.socket;
		socket.on('error', close);
		socket.on('close', close);

		const body = ctx.body = sseTransform();
		const stream = emailStream({
			email: ctx.params.email
		});
		stream.pipe(body);

		function close() {
			stream.unpipe(ctx.body);
			socket.removeListener('error', close);
			socket.removeListener('close', close);
		}
	}
};
