const config = require('config');
const thinky = require('thinky');

module.exports = thinky({
	host: config.db.host,
	port: config.db.port,
	db: config.db.database
});
