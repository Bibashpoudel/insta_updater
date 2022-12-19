const responseHelper = require('../../Helpers/responseHelper');
const crypto = require('crypto');
const generator = require('generate-password');
const {
  HTTP_OK,
  HTTP_SERVER_ERROR,
  SERVER_ERROR,
  HTTP_FORBIDDEN,
  HTTP_BAD_REQUEST,
  USER_PASSWORD_CHANGED,
  USER_ACCESS_DENIED,
  USER_ACTIVATED,
  USER_DEACTIVATED,
  USER_NOT_FOUND,
  HTTP_NOT_AVAILABLE,
  USER_LISTS,
  USER_DETAIL,
  USER_UPDATED,
  USER_DELETED,
  USER_ADDED,
  AUTH_UNSUCCESS,
  HTTP_UNAUTHORIZED,
  SUBDOMAIN_BANNERS_UPDATED,
  RES_VALIDATION_TYPE,
} = require('../../Utils/enum');
const mysqlModels = require('../../models/mysql').default;
const {mysqlDbConnect} = require('../../models/mysql');
const {Op} = require('sequelize');
const {nodemailer} = require('../../Helpers/nodemailer');
const path = require('path');
const fs = require('fs');
const appDir = path.dirname(require.main.filename);

module.exports = {
  changePasswordPage: async (req, res, next) => {
    try {
      const token = req.query['Authorization'];
      const userForgotPassTok = await mysqlModels.ForgotPasswordToken.findOne({
        where: {
          token: token,
        },
        raw: true,
      });
      if (!userForgotPassTok) {
        return res.render(`ejs/linkNotValid.ejs`);
      }
      if (new Date(userForgotPassTok.expires_at) < new Date()) {
        return res.render(`ejs/fTokenExpired.ejs`);
      } else {
        return res.render(`ejs/changePassword.ejs`, {token, error: '', password: '', re_password: ''});
      }
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, HTTP_SERVER_ERROR, '', {}, res);
    }
  },
  changePasswordFromMail: async (req, res, next) => {
    try {
      const token = req.body['authorization'] || '';
      // if (req.body['re_password'] !== req.body['password']) {
      //   // with error
      //   return res.render(`ejs/changePassword.ejs`, {token, error: USER_PASS_NOT_MATCH, password: req.body.password, re_password: req.body.re_password});
      // }
      const userForgotPassTok = await mysqlModels.ForgotPasswordToken.findOne({
        where: {
          token: token,
        },
        raw: true,
      });

      if (userForgotPassTok && token) {
        const user = await mysqlModels.User.findOne({
          where: {
            id: userForgotPassTok.user_id,
          },
        });
        if (user) {
          user['password'] = req.body['password'];
          await user.save();
          await mysqlModels.ForgotPasswordToken.destroy({
            where: {
              token: token,
            },
            raw: true,
          });
          return responseHelper(true, USER_PASSWORD_CHANGED, HTTP_OK, '', {}, res);
        }
      } else {
        return responseHelper(false, AUTH_UNSUCCESS, HTTP_UNAUTHORIZED, '', {}, res);
      }
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, HTTP_SERVER_ERROR, '', {}, res);
    }
  },
  /**
   * auth user password change
   */
  changePassword: async (req, res, next) => {
    try {
      const {authUser} = req.user;

      authUser['password'] = req.body['password'];
      await authUser.save();
      return responseHelper(true, USER_PASSWORD_CHANGED, HTTP_OK, '', authUser, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, HTTP_SERVER_ERROR, '', {}, res);
    }
  },
  createUsers: async (req, res, next) => {
    try {
      const {authUser} = req.user;
      const authUserRole = authUser['role'];
      const sequelizeInstance = await mysqlDbConnect();


      /* Checking users add limit */
      if (authUserRole == 'customer-admin') {
        const subdomain = await mysqlModels.CustomerSubdomain.findByPk(authUser.subdomain_id);
        const usersAddLimit = subdomain.user_accounts_limit;

        /* checking alredy added users accounts */
        const {count, rows} = await mysqlModels.User.findAndCountAll({
          where: {
            subdomain_id: subdomain.id,
          },
        });

        /* returning when users add limit is exceed */
        if (count >= usersAddLimit) {
          return responseHelper(false, `users can't be added as you have ${usersAddLimit - count} reminaing user(s) add limit.`, HTTP_FORBIDDEN, '', {}, res);
        }
      }

      /* Creating password for user */
      const cusPassword = generator.generate({
        length: 8,
        numbers: true,
        uppercase: true,
        lowercase: true,
        strict: true,
      });


      /* Creating customer subdomain and user by super admin */
      const newUser = await sequelizeInstance.transaction(async (t) => {
        let userSubdomainId = null;

        /* THIS CODE IS GETS EXECUTED WHEN AUTH USER IS SUPER-ADMIN AND USER TO BE CREATED IS CUSTOMER-ADMIN*/
        if (authUserRole === 'super-admin' && req.body['role'] != 'super-admin') {
          let logo = '';
          let feature_image = '';

          /* Uploading logo and banners*/
          if (req.files && req.files.length !== 0) {
            const files = req.files;

            let current_date = Date.now();
            const icon_logo = files['logo'];
            const icon_featured_image = files['featured_image'];
            icon_logo.mv(`${appDir}/public/uploads/icon_logo_${current_date}.${icon_logo.mimetype.split('/').pop()}`);
            logo = `/uploads/icon_logo_${current_date}.${icon_logo.mimetype.split('/').pop()}`;
            current_date = Date.now();
            icon_featured_image.mv(`${appDir}/public/uploads/icon_featured_image_${current_date}.${icon_featured_image.mimetype.split('/').pop()}`);
            feature_image = `/uploads/icon_featured_image_${current_date}.${icon_featured_image.mimetype.split('/').pop()}`;
          }

          const [customerSubdomain, created] = await mysqlModels.CustomerSubdomain.findOrCreate({
            where: {
              subdomain: req.body['subdomain'],
            },
            defaults: {
              subdomain: req.body['subdomain'],
              logo: logo,
              feature_image: feature_image,
              user_accounts_limit: req.body['user_accounts_limit'],
              social_media_profiles_limit: req.body['social_media_profiles_limit'],
            },
          });


          if (!created) {
            await fs.unlink(`${appDir}/public${logo}`, () => { });
            await fs.unlink(`${appDir}/public${feature_image}`, () => { });
          }

          userSubdomainId = customerSubdomain.id;
        }

        /* Customer admin */
        if (authUserRole === 'customer-admin') {
          userSubdomainId = authUser['subdomain_id'];
        }

        /* User to be created is super-admin or customer admin*/
        const userInputs = {
          first_name: req.body['first_name'] || '',
          last_name: req.body['last_name'] || '',
          email: req.body['email'],
          role: req.body['role'],
          contact_number: req.body['contact_number'],
          password: cusPassword,
          created_by: authUser['user_id'],
          timezone: 'Australia/Sydney',
        };

        /* WHEN USER TO BE CREATED IS NOT SUPER-ADMIN*/
        if (req.body['role'] !== 'super-admin') {
          userInputs['subdomain_id'] = userSubdomainId;
        }

        /* Additional attributes for user created by customer-admin*/
        if (authUserRole === 'customer-admin') {
          userInputs['employee_number'] = req.body['employee_number'];
          userInputs['position'] = req.body['position'];
        }


        const newUser = await mysqlModels.User.create(userInputs, {
          include: [{
            model: mysqlModels.CustomerSubdomain,
            as: 'CustomerSubdomain',
          }],
        }, {transaction: t});
        // converting to json object

        /* FOR CUSTOMER ADMIN USERS ONLY*/
        if (newUser.role !== 'super-admin') {
          const newUserSubdomain = await newUser.getCustomerSubdomain();


          const createdUser = newUser.toJSON();

          createdUser['subdomain'] = newUserSubdomain.subdomain;
          createdUser['logo'] = newUserSubdomain.logo;
          createdUser['feature_image'] = newUserSubdomain.feature_image;
          createdUser['user_accounts_limit'] = newUserSubdomain.user_accounts_limit;
          createdUser['social_media_profiles_limit'] = newUserSubdomain.social_media_profiles_limit;


          return createdUser;
        }

        return newUser;
      });


      /* Sending password to user email */
      await nodemailer({newUser, password: cusPassword}, 'sendPassword', res);

      return responseHelper(true, USER_ADDED, HTTP_OK, '', newUser, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, HTTP_SERVER_ERROR, '', {}, res);
    }
  },
  /* Deletes the users resouse */
  deleteUsers: async (req, res, next) => {
    try {
      const {authUser} = req.user;
      const sequelizeInstance = await mysqlDbConnect();

      const role = await getAccessRoleAccToReqRole(authUser, res);
      const where = {
        id: req.params['user_id'] == authUser.id ? null : req.params['user_id'],
        role,
      };

      /* WHEN AUTH USER IS CUSTOMER ADMIN */
      if (authUser['role'] === 'customer-admin') {
        where['subdomain_id'] = authUser['subdomain_id'];
      }

      const user = await mysqlModels.User.findOne({
        where,
      });

      if (!user) {
        return responseHelper(false, USER_NOT_FOUND, HTTP_NOT_AVAILABLE, '', {}, res);
      }

      try {
        await sequelizeInstance.transaction(async (transaction) => {
          /* Deleting the user */
          await user.destroy({}, {transaction});

          if (authUser['role'] === 'super-admin' && user['role'] === 'customer-admin') {
            /* Finding all other customer admin within a subdomains */
            const otherCustomerAdminsOfSubdomain = await mysqlModels.User.findAll({
              where: {
                role: 'customer-admin',
                subdomain_id: user['subdomain_id'],
              },
            });

            /* Deleting all records related to a sub-domain when */
            if (otherCustomerAdminsOfSubdomain.length == 0) {
              const subdomain = await mysqlModels.CustomerSubdomain.findOne({where: {id: user['subdomain_id']}});

              if (subdomain) {
                await subdomain.destroy({}, {transaction});

                await fs.unlink(`${appDir}/public${subdomain['logo']}`, () => { });
                await fs.unlink(`${appDir}/public${subdomain['feature_image']}`, () => { });
              }

              /* Getting all the users of that subdomain */
              const users = await mysqlModels.User.findAll({where: {subdomain_id: user['subdomain_id']}});

              /* Deleting all the users */
              await Promise.all(
                  users.map(async (user) => {
                    await user.destroy({}, {transaction});
                  }),
              );
            }
          }
        });

        return responseHelper(true, USER_DELETED, HTTP_OK, '', {}, res);
      } catch (error) {
        logger.error(error);
        return responseHelper(false, SERVER_ERROR, HTTP_SERVER_ERROR, '', {}, res);
      }
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, HTTP_SERVER_ERROR, '', {}, res);
    }
  },
  enableDisableCustomer: async (req, res, next) => {
    try {
      const {authUser} = req.user;
      const role = await getAccessRoleAccToReqRole(authUser, res);
      const where = {
        id: req.params['user_id'],
        role,
      };
      if (req.user['role'] === 'customer-admin') {
        where['subdomain_id'] = req.user['subdomain_id'];
      }
      const user = await mysqlModels.User.findOne({
        where,
      });
      if (user) {
        user['active'] = user['active'] ? 0 : 1;
        await user.save();
        return responseHelper(true, user['active'] ? USER_ACTIVATED : USER_DEACTIVATED, HTTP_OK, '', user, res);
      }
      return responseHelper(false, USER_NOT_FOUND, HTTP_NOT_AVAILABLE, '', {}, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, HTTP_SERVER_ERROR, '', {}, res);
    }
  },
  forgotPassword: async (req, res, next) => {
    try {
      let where = {
        email: req.body['email'],
      };

      if (req.body.subdomain !== 'false') {
        const subdomain = await mysqlModels.CustomerSubdomain.findOne({
          where: {
            subdomain: req.body.subdomain,
          },
          attributes: ['id', 'subdomain'],
        });
        where = {
          email: req.body['email'],
          subdomain_id: subdomain.id,
        };
      }

      const user = await mysqlModels.User.findOne({
        where,
        raw: true,
      });

      if (user) {
        const userForgotPassToken = await mysqlModels.ForgotPasswordToken.findOne({
          where: {
            user_id: user.id,
          },
        });
        const token = await generateForgotPassToken();
        let customerSubDomain;
        if (user.role != 'super-admin') {
          findCustomerSubDomaim = await mysqlModels.CustomerSubdomain.findOne({
            where: {
              id: user.subdomain_id,
            },
          });
          customerSubDomain = findCustomerSubDomaim.subdomain;
        }

        if (userForgotPassToken) {
          userForgotPassToken['token'] = token;
          await userForgotPassToken.save();
        } else {
          await mysqlModels.ForgotPasswordToken.create({
            token: token,
            user_id: user.id,
          });
        }
        await nodemailer({user, token, customerSubDomain}, 'forgotPassword', res);
        return responseHelper(true, `Mail sent to ${user.email}`, HTTP_OK, '', {}, res);
      } else {
        return responseHelper(false, {'email': USER_NOT_FOUND}, HTTP_NOT_AVAILABLE, RES_VALIDATION_TYPE, {}, res);
      }
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, HTTP_SERVER_ERROR, '', {}, res);
    }
  },
  getUsers: async (req, res, next) => {
    try {
      const {authUser} = req.user;
      const {limit, offset} = await paginationDetail(req, 1, 5);
      const roles = await getAccessRoleAccToReqRole(authUser, res);

      let where = {
        role: {
          [Op.in]: roles,
        },
        id: {[Op.ne]: authUser.id},
      };

      if (req.query['query']) {
        const whereTemp = {
          [Op.or]: [
            {first_name: {[Op.substring]: req.query['query']}},
            {last_name: {[Op.substring]: req.query['query']}},
          ],
        };
        where = {...where, ...whereTemp};
      }

      /* WHEN AUTH USER IS CUSTOMER-ADMIN */
      if (authUser['role'] === 'customer-admin') {
        where['subdomain_id'] = authUser['subdomain_id'];
      }

      const users = await mysqlModels.User.findAll({
        attributes: {exclude: ['password']},
        where,
        include: [{
          model: mysqlModels.CustomerSubdomain,
          as: 'CustomerSubdomain',
        }],
        limit,
        offset,
        order: [['created_at', 'DESC']],
      });

      /* SETTING UP THE LOGO AND FEATURE IMAGE BASE URLS*/
      await Promise.all(
          users.map(async (user) => {
            if (user['subdomain_id']) {
              user.CustomerSubdomain['logo'] = user.CustomerSubdomain['logo'] ? `${process.env.API_URL}${user.CustomerSubdomain['logo']}` : '';
              user.CustomerSubdomain['feature_image'] = user.CustomerSubdomain['feature_image'] ? `${process.env.API_URL}${user.CustomerSubdomain['feature_image']}` : '';
            }
          }),
      );

      return responseHelper(true, USER_LISTS, HTTP_OK, '', {users, totalUsers: await mysqlModels.User.count({where})}, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, HTTP_SERVER_ERROR, '', {}, res);
    }
  },
  editUser: async (req, res, next) => {
    try {
      const {authUser} = req.user;
      const where = {
        id: req.params['user_id'],
      };

      if (authUser['user_id'] !== req.params['user_id']) {
        const role = await getAccessRoleAccToReqRole(authUser, res);

        where['role'] = role;

        /* FOR CUSTOMER ADMIN ONLY*/
        if (authUser['role'] === 'customer-admin') {
          where['subdomain_id'] = authUser['subdomain_id'];
        }
      }

      const user = await mysqlModels.User.findOne({
        attributes: {exclude: ['password']},
        where,
        include: [{
          model: mysqlModels.CustomerSubdomain,
          as: 'CustomerSubdomain',
        }],
      });

      if (user && user['CustomerSubdomain']) {
        user.CustomerSubdomain['logo'] = user.CustomerSubdomain['logo'] ? `${process.env.API_URL}${user.CustomerSubdomain['logo']}` : '';
        user.CustomerSubdomain['feature_image'] = user.CustomerSubdomain['feature_image'] ? `${process.env.API_URL}${user.CustomerSubdomain['feature_image']}` : '';
      }
      user ?
        responseHelper(true, USER_DETAIL, HTTP_OK, '', user, res) :
        responseHelper(false, USER_NOT_FOUND, HTTP_NOT_AVAILABLE, '', {}, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, HTTP_SERVER_ERROR, '', {}, res);
    }
  },

  /**
   * Updates user resource
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  updateUser: async (req, res, next) => {
    try {
      const {authUser} = req.user;
      const where = {
        id: req.params['id'],
      };


      /* WHEN UPDATE IS DONE BY SUPER-ADMIN*/
      if (authUser['role'] === 'super-admin') {
        where['role'] = {[Op.in]: ['super-admin', 'customer-admin']};
      }

      /* WHEN UPDATE IS DONE BY CUSTOMER-ADMIN* */
      if (authUser['role'] === 'customer-admin') {
        where['subdomain_id'] = authUser['subdomain_id'];
      }

      /* Not allowing super admin to update customer-viewer*/

      const user = await mysqlModels.User.findOne({
        where,
        include: [
          {model: mysqlModels.CustomerSubdomain, as: 'CustomerSubdomain'},
        ],
      });

      if (user) {
        user['first_name'] = req.body['first_name'] || user['first_name'];
        user['last_name'] = req.body['last_name'] || user['last_name'];
        user['email'] = req.body['email'] || user['email'];
        user['contact_number'] = req.body['contact_number'] || user['contact_number'];

        /* WHEN AUTH USER IS A CUSTOMER-ADMIN*/
        if (authUser['role'] == 'customer-admin') {
          user['role'] = req.body['role'] || user['role'];
          user['employee_number'] = req.body['employee_number'] || user['employee_number'];
          user['position'] = req.body['position'] || user['position'];
        }


        /* WHEN AUTH USER IS SUPER-ADMIN AND  USER TO BE UPDATED IS CUSTOMER-ADMIN*/
        if (authUser['role'] == 'super-admin' && user['role'] == 'customer-admin') {
          const CustomerSubdomain = user.CustomerSubdomain;

          CustomerSubdomain['user_accounts_limit'] = req.body['user_accounts_limit'] || user['user_accounts_limit'];
          CustomerSubdomain['social_media_profiles_limit'] = req.body['social_media_profiles_limit'] || user['social_media_profiles_limit'];
          CustomerSubdomain['subdomain'] = req.body['subdomain'] || user['subdomain'];

          CustomerSubdomain.save();
          await updateCustomerLogoAndBannerImage(CustomerSubdomain, req);
        }

        await user.save();

        /* SETTING UP THE LOGO AND FEATURE IMAGE BASE URLS*/
        if (user['subdomain_id']) {
          user.CustomerSubdomain['logo'] = user.CustomerSubdomain['logo'] ? `${process.env.API_URL}${user.CustomerSubdomain['logo']}` : '';
          user.CustomerSubdomain['feature_image'] = user.CustomerSubdomain['feature_image'] ? `${process.env.API_URL}${user.CustomerSubdomain['feature_image']}` : '';
        }

        return responseHelper(true, USER_UPDATED, HTTP_OK, '', user, res);
      }

      return responseHelper(false, USER_NOT_FOUND, HTTP_NOT_AVAILABLE, '', {}, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, HTTP_SERVER_ERROR, '', {}, res);
    }
  },
  updateAuthUser: async (req, res, next) => {
    try {
      const {authUser} = req.user;

      /* Setting attributes to be updated */
      authUser['first_name'] = req.body['first_name'] || authUser['first_name'];
      authUser['last_name'] = req.body['last_name'] || authUser['last_name'];
      authUser['contact_number'] = req.body['contact_number'] || authUser['contact_number'];
      authUser['timezone'] = req.body['timezone'] || authUser['timezone'];

      /* Updating the user  */
      await authUser.save();
      return responseHelper(true, USER_UPDATED, HTTP_OK, '', authUser, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, HTTP_SERVER_ERROR, '', {}, res);
    }
  },
  /** *
   * Updating own logo and feature image by customer-admin
   */
  updateCustomerLogoBanners: async (req, res, next) => {
    try {
      const {authUser} = req.user;

      const customerSubdomain = await mysqlModels.CustomerSubdomain.findOne({
        where: {
          id: authUser['subdomain_id'],
        },
      });

      const updatedCustomerSubdomain = await updateCustomerLogoAndBannerImage(customerSubdomain, req);
      updatedCustomerSubdomain['logo'] = updatedCustomerSubdomain['logo'] ? `${process.env.API_URL}${updatedCustomerSubdomain['logo']}` : '';
      updatedCustomerSubdomain['feature_image'] = updatedCustomerSubdomain['feature_image'] ? `${process.env.API_URL}${updatedCustomerSubdomain['feature_image']}` : '';
      return responseHelper(true, SUBDOMAIN_BANNERS_UPDATED, HTTP_OK, '', updatedCustomerSubdomain, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, HTTP_SERVER_ERROR, '', {}, res);
    }
  },
};

const generateForgotPassToken = async () => {
  const token = crypto.randomBytes(32).toString('hex');
  const fToken = await mysqlModels.ForgotPasswordToken.findOne({
    where: {
      token: token,
    },
    raw: true,
  });
  if (!fToken) {
    return token;
  }
  generateForgotPassToken();
};

const getAccessRoleAccToReqRole = async (authUser, res) => {
  switch (authUser['role']) {
    case 'super-admin':
      return ['customer-admin', 'super-admin'];
    case 'customer-admin':
      return ['customer-admin', 'customer-viewer'];
    default:
      return responseHelper(false, USER_ACCESS_DENIED, HTTP_BAD_REQUEST, '', {}, res);
  }
};

const paginationDetail = async (req, defaultPage, defaultLimit) => {
  const limit = req.query['limit'] && req.query['limit'] != 0 ? parseInt(req.query['limit'], 10) : defaultLimit;
  const page = req.query['page'] && req.query['page'] != 0 ? parseInt(req.query['page'], 10) : defaultPage;
  const offset = (page - 1) * limit;
  return {limit, offset};
};

const updateCustomerLogoAndBannerImage = async (updatedCustomerSubdomain, req) => {
  /* updating subdomain if file exist */
  const files = req.files;

  if (files && files.length !== 0) {
    let current_date = Date.now();

    /* Handling logo update */
    if (files['logo']) {
      await fs.unlink(`${appDir}/public${updatedCustomerSubdomain.logo}`, () => { });

      const icon_logo = files['logo'];
      icon_logo.mv(`${appDir}/public/uploads/icon_logo_${current_date}.${icon_logo.mimetype.split('/').pop()}`);
      const logo = `/uploads/icon_logo_${current_date}.${icon_logo.mimetype.split('/').pop()}`;

      /* Updating the path */
      updatedCustomerSubdomain.logo = logo;
    }

    /* Handling feature image update */
    if (files['featured_image']) {
      await fs.unlink(`${appDir}/public${updatedCustomerSubdomain.feature_image}`, () => { });

      const icon_featured_image = files['featured_image'];

      current_date = Date.now();
      icon_featured_image.mv(`${appDir}/public/uploads/icon_featured_image_${current_date}.${icon_featured_image.mimetype.split('/').pop()}`);
      const feature_image = `/uploads/icon_featured_image_${current_date}.${icon_featured_image.mimetype.split('/').pop()}`;

      /* Updating the path */
      updatedCustomerSubdomain.feature_image = feature_image;
    }

    /* Updating the path */
    await updatedCustomerSubdomain.save();
    return updatedCustomerSubdomain;
  }
};
