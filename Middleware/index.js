const cors = require('./cors');
const loggers = require('./logger');
const passport = require('./passport');
const validation = require('./validation')
const RoleAccessControl = require('./RoleAccessControl')

module.exports = {
  cors,
  passport,
  loggers,
  validation,
  RoleAccessControl,
};
