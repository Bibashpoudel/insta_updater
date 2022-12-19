const SocialListening = require('./SocialListeningController');
const RoleAccessControl = require('../../Middleware/RoleAccessControl');
const SocialTagControl = require('../../Middleware/SocialTag');
// const validation = require('../../Middleware/validation');

module.exports = (router, passport) => {
  router.get(
      '/social-listening/:type/total-peoples/',
      passport.authenticate('bearer', {session: false}),
      RoleAccessControl(['customer-admin', 'customer-viewer']),
      SocialTagControl(),
      SocialListening.getTotalPeople,
  );

  router.get(
      '/social-listening/:type/total-mentions/',
      passport.authenticate('bearer', {session: false}),
      RoleAccessControl(['customer-admin', 'customer-viewer']),
      SocialTagControl(),
      SocialListening.getTotalMentions,
  );

  router.get(
      '/social-listening/:type/social-interaction/',
      passport.authenticate('bearer', {session: false}),
      RoleAccessControl(['customer-admin', 'customer-viewer']),
      SocialTagControl(),
      SocialListening.getSocialInteractions,
  );

  router.get(
      '/social-listening/:type/potential-impression/',
      passport.authenticate('bearer', {session: false}),
      RoleAccessControl(['customer-admin', 'customer-viewer']),
      SocialTagControl(),
      SocialListening.getPotentialImpression,
  );

  router.get(
      '/social-listening/:type/sentiment-in-time/:period',
      passport.authenticate('bearer', {session: false}),
      RoleAccessControl(['customer-admin', 'customer-viewer']),
      SocialTagControl(),
      SocialListening.getSentimentData,
  );

  router.get(
      '/social-listening/:type/top-emoji/',
      passport.authenticate('bearer', {session: false}),
      RoleAccessControl(['customer-admin', 'customer-viewer']),
      SocialTagControl(),
      SocialListening.getTopEmoji,
  );
};
