const RoleAccessControl = require('../../../Middleware/RoleAccessControl');
const SearchController = require('./SearchController');

module.exports = (router, passport) => {
  router.post('/help-search', passport.authenticate('bearer', {session: false}), RoleAccessControl(['customer-admin', 'customer-viewer']), SearchController.search);
};
