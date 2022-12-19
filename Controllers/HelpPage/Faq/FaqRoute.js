const faqController = require('./FaqController');
const RoleAccessControl = require('../../../Middleware/RoleAccessControl');
const validation = require('../../../Middleware/validation');

module.exports = (router, passport) => {
  // console.log('hello');

  router.get('/faqs', passport.authenticate('bearer', {session: false}), RoleAccessControl(['super-admin', 'customer-admin', 'customer-viewer']), faqController.all);

  router.get('/faqs/:id', passport.authenticate('bearer', {session: false}), RoleAccessControl(['super-admin', 'customer-admin', 'customer-viewer']), faqController.show);

  router.post('/faqs', passport.authenticate('bearer', {session: false}), RoleAccessControl(['super-admin']), validation('storeFaqs'), faqController.store);

  router.put('/faqs/:id', passport.authenticate('bearer', {session: false}), RoleAccessControl(['super-admin']), validation('storeFaqs'), faqController.update);
};
