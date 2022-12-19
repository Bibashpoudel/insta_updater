const RoleAccessControl = require('../../../Middleware/RoleAccessControl');
const validation = require('../../../Middleware/validation');
const helpVideosController = require('./HelpVideoController');


module.exports = (router, passport) => {
  router.get('/help-videos', passport.authenticate('bearer', {session: false}), RoleAccessControl(['super-admin', 'customer-admin', 'customer-viewer']), helpVideosController.all);

  router.get('/help-videos/:id', passport.authenticate('bearer', {session: false}), RoleAccessControl(['super-admin', 'customer-admin', 'customer-viewer']), helpVideosController.show);

  router.post('/help-videos', passport.authenticate('bearer', {session: false}), RoleAccessControl(['super-admin']), validation('storeHelpVideos'), helpVideosController.store);

  router.put('/help-videos/:id', passport.authenticate('bearer', {session: false}), RoleAccessControl(['super-admin']), validation('storeHelpVideos'), helpVideosController.update);
};
