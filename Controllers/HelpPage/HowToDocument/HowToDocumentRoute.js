const RoleAccessControl = require('../../../Middleware/RoleAccessControl');
const validation = require('../../../Middleware/validation');
const howToDocumentController = require('./HowToDocumentController');

module.exports = (router, passport) => {
  router.get('/how-to-docs', passport.authenticate('bearer', {session: false}), RoleAccessControl(['super-admin', 'customer-admin', 'customer-viewer']), howToDocumentController.all);

  router.get('/how-to-docs/:id', passport.authenticate('bearer', {session: false}), RoleAccessControl(['super-admin', 'customer-admin', 'customer-viewer']), howToDocumentController.show);

  router.post('/how-to-docs', passport.authenticate('bearer', {session: false}), RoleAccessControl(['super-admin']), validation('howToDocs'), howToDocumentController.store);

  router.put('/how-to-docs/:id', passport.authenticate('bearer', {session: false}), RoleAccessControl(['super-admin']), validation('howToDocs'), howToDocumentController.update);
};
