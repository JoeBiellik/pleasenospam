var thinky = require('../db')();

module.exports = thinky.createModel('emails', {
	id: thinky.type.string(),
	subject: thinky.type.string(),
	from: [{
		address: thinky.type.string(),
		name: thinky.type.string()
	}],
	to: [{
		address: thinky.type.string(),
		name: thinky.type.string()
	}],
	priority: thinky.type.string(),
	messageId: thinky.type.string(),
	references: [thinky.type.string()],
	inReplyTo: [thinky.type.string()],
	html: thinky.type.string(),
	text: thinky.type.string(),
	headers: thinky.type.object(),
	sentDate: thinky.type.date(),
	receivedDate: thinky.type.date(),
	original: thinky.type.string(),
	createdAt: thinky.type.date().default(Date.now())
}, {
	//enforce_missing: true,
	//enforce_extra: 'strict',
	//enforce_type: 'strict'
});
