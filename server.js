var app = require('./app');
var config = require('config');
var util = require('util');

module.exports = app.listen(process.env.PORT || config.app.port || 3000, function() {
	util.log('Server started: http://%s:%s/', this.address().address, this.address().port);
});
