const responseHelper = require('../../Helpers/responseHelper');
const tokenGenerator = require('../../Middleware/tokenGenerator');
const {
  HTTP_OK,
  HTTP_SERVER_ERROR,
  SERVER_ERROR,
  AUTH_SUCCESS,
  LOGOUT_SUCCESS,
  USER_NOT_FOUND,
  USER_DEACTIVATED,
  USER_PASS_NOT_MATCH,
  HTTP_CONFLICT_REQUEST,
  HTTP_UNAUTHORIZED,
  RES_VALIDATION_TYPE,
  SUBDOMAIN_INVALID,
  INVALID_SOCIAL_TYPE,
  FACEBOOK_USER_NOT_FOUND,
} = require('../../Utils/enum');
const mysqlModels = require('../../models/mysql').default;
const axios = require('axios');
const {getFacebookUserDetail} = require('../../axios-clients');

module.exports = {
  signIn: async (req, res, next) => {
    try {
      let user;
      const where = {email: req.body.email};

      const userDetail = await mysqlModels.User.findOne({
        where,
        include: [{model: mysqlModels.CustomerSubdomain, as: 'CustomerSubdomain'}],
      });

      if (userDetail.dataValues.role == 'super-admin') {
        user = userDetail;
      } else if (req.body.subdomain_id) {
        user = await mysqlModels.User.findOne({
          where: {email: req.body.email, subdomain_id: req.body.subdomain_id},
          include: [{model: mysqlModels.CustomerSubdomain, as: 'CustomerSubdomain'}],
        });
      }

      const sendTokenResponse = async () => {
        if (!user['active']) {
          await responseHelper(false, {'email': USER_DEACTIVATED}, HTTP_CONFLICT_REQUEST, RES_VALIDATION_TYPE, {}, res);
        }

        if (user['CustomerSubdomain']) {
          user.CustomerSubdomain['logo'] = user.CustomerSubdomain['logo'] ? `${process.env.API_URL}${user.CustomerSubdomain['logo']}` : '';
          user.CustomerSubdomain['feature_image'] = user.CustomerSubdomain['feature_image'] ? `${process.env.API_URL}${user.CustomerSubdomain['feature_image']}` : '';
        }

        const tempUser = JSON.parse(JSON.stringify(user));
        delete tempUser['password'];
        const tokens = await tokenGenerator(tempUser);
        user['last_login_at'] = new Date();
        user['last_login_with'] = 'msv';

        await user.save();

        return responseHelper(true, AUTH_SUCCESS, HTTP_OK, '', tokens, res);
      };

      user ?
        await user.comparePassword(req.body.password) ?
          await sendTokenResponse() :
          await responseHelper(false, {'password': USER_PASS_NOT_MATCH}, HTTP_UNAUTHORIZED, RES_VALIDATION_TYPE, {}, res) :
        await responseHelper(false, {'email': USER_NOT_FOUND}, HTTP_UNAUTHORIZED, RES_VALIDATION_TYPE, {}, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, HTTP_SERVER_ERROR, '', {}, res);
    }
  },
  logout: async (req, res, next) => {
    try {
      const {authToken} = req.user;

      /* Deleting the auth token*/
      await authToken.destroy();

      return responseHelper(true, LOGOUT_SUCCESS, HTTP_OK, '', {}, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, HTTP_SERVER_ERROR, '', {}, res);
    }
  },

  facebookAuthLogin: async (req, res, next) => {
    try {
      let user;
      if (req.params.type !== 'facebook') {
        return responseHelper(false, INVALID_SOCIAL_TYPE, HTTP_SERVER_ERROR, '', {}, res);
      }
      const params = {
        fields: 'email,name,id',
        access_token: req.query.access_token,
      };
      const facebookUserData = await axios.get(`${process.env.FB_GRAPH_API_BASE_URL}/me`, {params});
      const userDetail = await mysqlModels.User.findOne({
        where: {
          email: facebookUserData.data.email,
          subdomain_id: req.body.subdomain_id,
        },
        include: [{model: mysqlModels.CustomerSubdomain, as: 'CustomerSubdomain'}],
      });

      if (!userDetail) {
        return responseHelper(false, FACEBOOK_USER_NOT_FOUND, HTTP_UNAUTHORIZED, '', {}, res);
      } else if (userDetail) {
        user = userDetail;
      } else if (userDetail.dataValues.subdomain_id !== req.body.subdomain_id) {
        return responseHelper(false, {'subdomain': SUBDOMAIN_INVALID}, HTTP_UNAUTHORIZED, RES_VALIDATION_TYPE, {}, res);
      }
      const sendTokenResponse = async () => {
        if (!user['active']) {
          await responseHelper(false, {'email': USER_DEACTIVATED}, HTTP_CONFLICT_REQUEST, RES_VALIDATION_TYPE, {}, res);
        }

        if (user['CustomerSubdomain']) {
          user.CustomerSubdomain['logo'] = user.CustomerSubdomain['logo'] ? `${process.env.API_URL}${user.CustomerSubdomain['logo']}` : '';
          user.CustomerSubdomain['feature_image'] = user.CustomerSubdomain['feature_image'] ? `${process.env.API_URL}${user.CustomerSubdomain['feature_image']}` : '';
        }

        const tempUser = JSON.parse(JSON.stringify(user));
        delete tempUser['password'];
        const tokens = await tokenGenerator(tempUser);
        user['last_login_at'] = new Date();
        user['last_login_with'] = 'facebook';

        await user.save();

        return responseHelper(true, AUTH_SUCCESS, HTTP_OK, '', tokens, res);
      };
      await sendTokenResponse();
    } catch (error) {
      if (error.config) {
        if (error.config.url.includes('facebook')) {
          console.log(error.response.data);
          return responseHelper(false, error.response.data.error.message, HTTP_UNAUTHORIZED, '', {}, res);
        }
      }

      logger.error(error);
      return responseHelper(false, SERVER_ERROR, HTTP_SERVER_ERROR, '', {}, res);
    }
  },
};
