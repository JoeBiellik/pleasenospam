const config = require('config');

const thinky = require('thinky')({
	host: config.db.host,
	port: config.db.port,
	db: config.db.db
});

module.exports = () => {
	return thinky;
};
