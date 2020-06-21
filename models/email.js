const thinky = require('../db');

module.exports = thinky.createModel('emails', {
	id: thinky.type.string().options({ enforce_missing: false }),
	subject: thinky.type.string(),
	from: [{
		address: thinky.type.string(),
		name: thinky.type.string()
	}],
	to: [{
		address: thinky.type.string(),
		name: thinky.type.string()
	}],
	messageId: thinky.type.string(),
	references: [thinky.type.string()],
	inReplyTo: thinky.type.string().options({ enforce_type: 'loose' }),
	html: thinky.type.string(),
	text: thinky.type.string(),
	original: thinky.type.string(),
	sentDate: thinky.type.date(),
	receivedDate: thinky.type.date().default(thinky.r.now())
}, {
	// enforce_missing: true,
	// enforce_extra: 'strict',
	// enforce_type: 'strict'
});
