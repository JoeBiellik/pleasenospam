var defer = require('config/defer').deferConfig;

module.exports = {
  "app": {
    "port": process.env.PLEASE_NO_SPAM_APP_PORT || 80,
    "smtp": {
      "host": process.env.DOCKER_MAIL_HOST_NAME || "pleasenospam-mail-server",
      "port": process.env.DOCKER_MAIL_HOST_PORT || 25
    }
  },
  "db": {
    "host": process.env.PLEASE_NO_SPAM_DOCKER_DB_NAME || "pleasenospam-db",
    "port": process.env.PLEASE_NO_SPAM_DOCKER_DB_PORT || 28015
  },
  "mail": {
    "hostname": process.env.PLEASE_NO_SPAM_MAIL_HOST_NAME || "pleasenospam-mail-server",
    "banner": process.env.PLEASE_NO_SPAM_MAIL_BANNER || "Hi can I have some mail please?",
    "domains": defer(function () {
      var domains = process.env.NO_SPAM_MAIL_DOMAINS.replace(/^"(.+(?="$))"$/, '$1').split(' ');
      console.log(domains);
      return domains;
    })
  }
}
