const pino = require('pino');
const logger = pino({
  prettyPrint: {
    colorize: true,
    translateTime: true,
    ignore: 'pid,hostname',
  },
});

global.logger = logger;
module.exports = {
  logRequest: (req, res, next) => {
    logger.info(`TYPE:${req.method.toLowerCase()} && URL:${req.url}`);
    next();
  },
  logError: (err, req, res, next) => {
    logger.error(err);
    next();
  },
};
