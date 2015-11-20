var config = require('config');

var thinky = require('thinky')({
	host: config.db.host,
	port: config.db.port,
	db: config.db.db
});

module.exports = () => {
	return thinky;
};
