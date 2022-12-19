const RoleAccessControl = require('../../../Middleware/RoleAccessControl');
const validation = require('../../../Middleware/validation');
const ContactSupportController = require('./ContactSupportController');

module.exports = (router, passport) => {
  router.get('/contact-support', passport.authenticate('bearer', {session: false}), RoleAccessControl(['super-admin']), ContactSupportController.index);

  router.get('/contact-support/:id', passport.authenticate('bearer', {session: false}), RoleAccessControl(['super-admin']), ContactSupportController.show);

  router.post('/contact-support', passport.authenticate('bearer', {session: false}), RoleAccessControl(['customer-admin', 'customer-viewer']), validation('contactSupport'), ContactSupportController.store);

  router.put('/contact-support/:id', passport.authenticate('bearer', {session: false}), RoleAccessControl(['super-admin']), validation('contactSupportResponse'), ContactSupportController.sendResponse);
};
