
const Router = require('express').Router;
const passport = require('passport');
const authRoute = require('../Controllers/Auth/authRoute');
const userRoute = require('../Controllers/User/userRoute');
const subdomainRoute = require('../Controllers/Subdomain/subdomainRoute');
const SocialMediaProfilesRoute = require('../Controllers/SocialMediaProfiles/SocialMediaProfilesRoute');
const faqRoutes = require('../Controllers/HelpPage/Faq/FaqRoute');
const helpVideosRoutes = require('../Controllers/HelpPage/HelpVideo/HelpVideoRoute');
const howToDocsRoutes = require('../Controllers/HelpPage/HowToDocument/HowToDocumentRoute.js');
const helpSearchRoutes = require('../Controllers/HelpPage/Search/SearchRoute.js');
const contactSupport = require('../Controllers/HelpPage/ContactSupport/ContactSupportRoute.js');
const SocialListening = require('../Controllers/SocialListening/SocialListeningRoute');
const dashboard = require('../Controllers/Dashboard/dashboardRoute');
const log = require('../Controllers/Logger/LoggerRoute');

module.exports = () => {
  const router = Router();

  authRoute(router, passport);
  userRoute(router, passport);
  subdomainRoute(router, passport);
  SocialMediaProfilesRoute(router, passport);
  faqRoutes(router, passport);
  helpVideosRoutes(router, passport);
  howToDocsRoutes(router, passport);
  helpSearchRoutes(router, passport);
  contactSupport(router, passport);
  SocialListening(router, passport);
  dashboard(router,passport);
  log(router,passport);

  return router;
};


