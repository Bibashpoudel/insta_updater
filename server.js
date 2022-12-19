#!/usr/bin/env node
const { mongoDbConnect } = require('./models/mongo-db');
const { mysqlDbConnect } = require('./models/mysql')

/**
 * Module dependencies.
 */

const app = require('./app');
const debug = require('debug')('express-app:server');
const http = require('http');

/**
 * Get port from environment and store in Express.
 */

const port = normalizePort(process.env.APP_PORT || '3001');
app.set('port', port);

/**
 * Create HTTP server.
 */

const server = http.createServer(app);



/**
 * Listen on provided port, on all network interfaces.
 */
const appListen = () => {
  server.listen(port);
  server.on('error', onError);
  server.on('listening', onListening);
};



/*connect to all databases*/
const connectDb = () => {
  return new Promise(async(resolve, reject) => {
    try {
      /*Connecting to mongodb*/
      await mongoDbConnect()
      /*Connection to mysql*/
      await mysqlDbConnect()
      resolve()
    } catch (error) {
      reject()
    }
  })
}
  /**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string' ?
    'Pipe ' + port :
    'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string' ?
    'pipe ' + addr :
    'port ' + addr.port;
  debug('Listening on ' + bind);
  logger.info(`app listening at ${process.env.API_HOST}:${port}`);
}


connectDb().then(async () => {
  appListen();
});


