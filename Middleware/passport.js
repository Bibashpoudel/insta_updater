const passport = require('passport');
const mysqlModels = require('../models/mysql/index').default;
const BearerStrategy = require('passport-http-bearer').Strategy;

passport.use(
    new BearerStrategy(async (token, done) => {
      const accessToken = await mysqlModels.AccessToken.findOne({
        where: {
          id: token,
        },
      });

      if (!accessToken) {
        return done(null, false);
      }

     

      const user = await mysqlModels.User.findOne({
        where: {
          id: accessToken.user_id,
        },
      });

      return done(null, {authUser: user, authToken: accessToken}, {scope: 'read'});
    }),
);

module.exports = passport;
