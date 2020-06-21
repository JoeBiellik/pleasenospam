const app = require('./app');
const config = require('config');

module.exports = app.listen(process.env.PORT || config.app.port, process.env.HOST || config.app.host);
