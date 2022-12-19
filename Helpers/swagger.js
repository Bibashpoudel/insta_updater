// swagger implementation
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');
const appDir = path.dirname(require.main.filename);

const options = {
  swaggerDefinition: {
    // Like the one described here: https://swagger.io/specification/#infoObject
    openapi: '3.0.0',
    info: {
      title: 'MSV api swagger documentation',
      version: '1.0.0',
    },
  },
  // List of files to be processes. You can also set globs './routes/*.js'
  apis: [`${appDir}/../Controllers/*/*Route.js`],
};

const specs = swaggerJsdoc(options);

// const swaggerDocument = require('./swagger.json');
module.exports = (app) => {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));
};
