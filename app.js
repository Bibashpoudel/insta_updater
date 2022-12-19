require('dotenv').config();
const express = require('express');
const app = express();
const {cors, loggers, passport} = require('./Middleware');
const apiRoutes = require('./routes')
const path = require('path');
const {logRequest, logError} = loggers;
const swagger = require('./Helpers/swagger.js');
const axiosClients = require('./axios-clients')

// passport js
app.use(passport.initialize());


app.use(express.urlencoded({limit: '50mb', extended: false}));
app.use(express.json());
app.use(express.static('public'));
app.set('views', path.join(__dirname, 'public'));
app.set('view engine', 'ejs');

// for accessing files in req.files
const fileUpload = require('express-fileupload');
app.use(fileUpload());

// swagger use
swagger(app);

// cors imlementation
app.use(cors);

// logging request
app.use(logRequest);
app.use(logError);

// Routes setup
if (process.env.APP_ENV === 'development') {
  app.use('/api/v1', apiRoutes());
} else {
  app.use('/v1', apiRoutes());
}


// no route 404 response
app.use((req, res, next) => {
  if (!req.route) {
    logger.warn(`requested resource is not avaiable yet :: ${req.url}`);
    return res.json('requested resource is not avaiable yet');
  }
});

module.exports = app;
