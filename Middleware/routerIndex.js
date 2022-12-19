const Router = require('express').Router;
const passport = require('passport');
const authRoute = require('../Controllers/Auth/authRoute');
const userRoute = require('../Controllers/User/userRoute');
const subdomainRoute = require('../Controllers/Subdomain/subdomainRoute');
const SocialMediaProfilesRoute = require('../Controllers/SocialMediaProfiles/SocialMediaProfilesRoute');


module.exports = () => {
  const router = Router();
  authRoute(router, passport);
  userRoute(router, passport);
  subdomainRoute(router, passport);
  SocialMediaProfilesRoute(router, passport);
  return router;
};
