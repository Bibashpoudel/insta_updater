const Joi = require('@hapi/joi');
const {validateData} = require('../Helpers/reqAndJoiObjectValidator');
const {Op} = require('sequelize');
const responseHelper = require('./responseHelper');
const path = require('path');
const mysqlModels = require('../models/mysql').default;
const {
  HTTP_BAD_REQUEST,
  SUBDOMAIN_BANNERS_REQUIRED,
  SUBDOMAIN_BANNER_REQUIRED,
  RES_VALIDATION_TYPE,
  SUBDOMAIN_FEATURED_SIZE_ERROR,
  SUBDOMAIN_LOGO_SIZE_ERROR,
  USER_EMAIL_CONFLICT,
  SUBDOMAIN_DUPLICATE_ADMIN,
  SUBDOMAIN_BANNERS_FORMAT_ERROR,
  SUBDOMAIN_INVALID,
  PASS_REG,
  EMAIL_REG,
  USER_NOT_FOUND,
  HTTP_UNAUTHORIZED,
  FACEBOOK_USER_NOT_FOUND,
} = require('../Utils/enum');
const imageSupport = ['.png', '.jpg', '.jpeg', '.gif', 'bmp'];


module.exports = {
  createCustomerValidation: async (req, res, next) => {
    try {
      const errors = {};
      if (req.user['role'] === 'super-admin') {
        const files = req.files;

        if (!req.files || !req.files['logo'] || !req.files['featured_image']) {
          errors.brand_banners = SUBDOMAIN_BANNERS_REQUIRED;
        }

        if (files && files['logo'] && files.logo.size > 2097152) {
          errors.brand_logo_size = SUBDOMAIN_LOGO_SIZE_ERROR;
        }

        if (files && files['featured_image'] && files.featured_image.size < 2097152) {
          errors.brand_featured_size = SUBDOMAIN_FEATURED_SIZE_ERROR;
        }

        if (files && files['logo']) {
          const extname = path.extname(req.files['logo'].name);

          if (!imageSupport.includes(extname)) {
            errors.brand_logo_format = SUBDOMAIN_BANNERS_FORMAT_ERROR;
          }
        }

        if (files && files['featured_image']) {
          const extname = path.extname(req.files['featured_image'].name);

          if (!imageSupport.includes(extname)) {
            errors.brand_featured_format = SUBDOMAIN_BANNERS_FORMAT_ERROR;
          }
        }

        const customerSubdomain = await CustomerSubdomain.findOne({
          where: {
            subdomain: req.body['subdomain'].trim(),
          },
        });

        let user;

        if (customerSubdomain) {
          user = await User.findOne({
            where: {
              subdomain_id: customerSubdomain['id'],
              role: 'customer-admin',
            },
          });
        }

        if (user) {
          errors.brand_name = SUBDOMAIN_DUPLICATE_ADMIN;
        }
      }

      const userWithSameEmail = await Users.findOne({
        where: {
          email: req.body['email'],
        },
        raw: true,
      });

      if (userWithSameEmail) {
        errors.email = USER_EMAIL_CONFLICT;
      }

      const roles = ['super-admin', 'customer-admin', 'customer-viewer'];

      const vObj = {
        email: Joi.string().email()
            .regex(EMAIL_REG)
            .rule({
              message: 'Please enter a valid email address',
            })
            .required(),
        first_name: Joi.string()
            .required(),
        last_name: Joi.string()
            .required(),
        role: Joi.string().valid(...roles)
            .required(),
      };

      req.user['role'] === 'super-admin' ? vObj['brand_name'] = Joi.string().required() : vObj['brand_name'] = Joi.string().optional();

      const JoiSchema = await Joi.object(vObj).options({abortEarly: false});

      await validateData(req.body, JoiSchema, errors, res, next);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  changePasswordValidation: async (req, res, next) => {
    try {
      const errors = {};
      const JoiSchema = await Joi.object({
        authorization: Joi.string()
            .required(),
        password: Joi.string()
            .regex(PASS_REG)
            .rule({
              message: 'Password must contain minimum 8 characters, at least one number, one uppercase, one lowercase letter and one special character.',
            })
            .min(8)
            .rule({
              message: 'Password must be at least 8 character',
            })
            .max(16)
            .rule({message: 'Password must be at most 16 character'})
            .required(),
      }).options({abortEarly: false});
      await validateData(req.body, JoiSchema, errors, res, next);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  changePassValidation: async (req, res, next) => {
    try {
      const errors = {};
      const JoiSchema = await Joi.object({
        old_password: Joi.string()
            .required(),
        password: Joi.string()
            .regex(PASS_REG)
            .rule({
              message: 'Password must contain minimum 8 characters, at least one number, one uppercase, one lowercase letter and one special character.',
            })
            .max(16)
            .rule({message: 'Password must be at most 16 character'})
            .required(),
      }).options({abortEarly: false});

      await validateData(req.body, JoiSchema, errors, res, next);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  forgotPasswordValidation: async (req, res, next) => {
    try {
      const errors = {};
      const vObj = {
        email: Joi.string().email()
            .regex(EMAIL_REG)
            .rule({
              message: 'Please enter a valid email address',
            })
            .required(),
        subdomain: Joi.string()
            .required(),
      };
      const JoiSchema = await Joi.object(vObj).options({abortEarly: false});
      await validateData(req.body, JoiSchema, errors, res, next);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  // Sign-in
  signInValidation: async (req, res, next) => {
    try {
      const errors = {};
      const user = await mysqlModels.User.findOne({
        where: {email: req.body.email},
      });

      if (!user) {
        await responseHelper(false, {'email': USER_NOT_FOUND}, HTTP_UNAUTHORIZED, RES_VALIDATION_TYPE, {}, res);
      } else if (req.body.subdomain_id == 'false') {
        return responseHelper(false, SUBDOMAIN_INVALID, 400, '', {}, res);
      } else if (user.dataValues.role == 'super-admin') {
        const JoiSchema = await Joi.object({
          email: Joi.string()
              .regex(EMAIL_REG)
              .rule({
                message: 'Please enter a valid email address',
              })
              .required(),
          password: Joi.string()
              .required(),
        }).options({abortEarly: false});
        await validateData(req.body, JoiSchema, errors, res, next);
      } else {
        const JoiSchema = await Joi.object({
          email: Joi.string()
              .regex(EMAIL_REG)
              .rule({
                message: 'Please enter a valid email address',
              })
              .required(),
          password: Joi.string()
              .required(),
          subdomain_id: Joi.string()
              .required(),
        }).options({abortEarly: false});
        await validateData(req.body, JoiSchema, errors, res, next);
      }
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  facebookAuthValidation: async (req, res, next) => {
    try {
      const errors = {};
      const user = await mysqlModels.User.findOne({
        where: {email: req.body.email},
      });
      if (!user) {
        await responseHelper(false, {'email': FACEBOOK_USER_NOT_FOUND}, HTTP_UNAUTHORIZED, RES_VALIDATION_TYPE, {}, res);
      } else if (req.body.subdomain_id == 'false') {
        return responseHelper(false, SUBDOMAIN_INVALID, 400, '', {}, res);
      } else if (user.dataValues.role == 'super-admin') {
        return responseHelper(false, 'Invalid login', 500, '', {}, res);
      } else {
        const JoiSchema = await Joi.object({
          email: Joi.string()
              .regex(EMAIL_REG)
              .rule({message: 'Please enter a valid email address'})
              .required(),
          subdomain_id: Joi.string()
              .required(),
        }).options({abortEarly: false});
        await validateData(req.body, JoiSchema, errors, res, next);
      }
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  updateCustomerValidation: async (req, res, next) => {
    try {
      const errors = {};
      if (req.user['role'] === 'super-admin') {
        const files = req.files;
        if (files && files['logo'] && files.logo.size > 2097152) {
          // return responseHelper(false, SUBDOMAIN_LOGO_SIZE_ERROR, HTTP_BAD_REQUEST, RES_VALIDATION_TYPE, {}, res);
          errors.brand_logo_size = SUBDOMAIN_LOGO_SIZE_ERROR;
        }
        if (files && files['featured_image'] && files.featured_image.size < 2097152) {
          errors.brand_featured_size = SUBDOMAIN_FEATURED_SIZE_ERROR;
          // return responseHelper(false, SUBDOMAIN_FEATURED_SIZE_ERROR, HTTP_BAD_REQUEST, RES_VALIDATION_TYPE, {}, res);
        }
        if (files && files['logo']) {
          const extname = path.extname(req.files['logo'].name);
          if (!imageSupport.includes(extname)) {
            errors.brand_logo_format = SUBDOMAIN_BANNERS_FORMAT_ERROR;
          }
        }
        if (files && files['featured_image']) {
          const extname = path.extname(req.files['featured_image'].name);
          if (!imageSupport.includes(extname)) {
            errors.brand_featured_format = SUBDOMAIN_BANNERS_FORMAT_ERROR;
          }
        }
      }
      if (req.body['email']) {
        const userWithSameEmail = await Users.findOne({
          where: {
            email: req.body['email'],
            id: {[Op.notIn]: [req.body['user_id']]},
          },
          raw: true,
        });

        if (userWithSameEmail) {
          errors.email = USER_EMAIL_CONFLICT;
        }
      }
      const JoiSchema = await Joi.object({
        user_id: Joi.number().integer()
            .required(),
        email: Joi.string()
            .regex(EMAIL_REG)
            .rule({
              message: 'Please enter a valid email address',
            })
            .required(),
        first_name: Joi.string()
            .optional(),
        last_name: Joi.string()
            .optional(),
        role: Joi.string()
            .optional(),
      }).options({abortEarly: false});
      await validateData(req.body, JoiSchema, errors, res, next);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  updateCustomerBannersValidation: async (req, res, next) => {
    try {
      const errors = {};
      const files = req.files;
      if (['super-admin', 'customer-admin'].includes(req.user['role']) && !files) {
        // return responseHelper(false, SUBDOMAIN_BANNERS_REQUIRED, HTTP_BAD_REQUEST, RES_VALIDATION_TYPE, {}, res);
        errors.brand_banners = SUBDOMAIN_BANNER_REQUIRED;
      }
      if (files && files['logo'] && files.logo.size > 2097152) {
        // return responseHelper(false, SUBDOMAIN_LOGO_SIZE_ERROR, HTTP_BAD_REQUEST, RES_VALIDATION_TYPE, {}, res);
        errors.brand_logo_size = SUBDOMAIN_LOGO_SIZE_ERROR;
      }
      if (files && files['featured_image'] && files.featured_image.size < 2097152) {
        errors.brand_featured_size = SUBDOMAIN_FEATURED_SIZE_ERROR;
        // return responseHelper(false, SUBDOMAIN_FEATURED_SIZE_ERROR, HTTP_BAD_REQUEST, RES_VALIDATION_TYPE, {}, res);
      }
      if (files && files['logo']) {
        const extname = path.extname(req.files['logo'].name);
        if (!imageSupport.includes(extname)) {
          errors.brand_logo_format = SUBDOMAIN_BANNERS_FORMAT_ERROR;
        }
      }
      if (files && files['featured_image']) {
        const extname = path.extname(req.files['featured_image'].name);
        if (!imageSupport.includes(extname)) {
          errors.brand_featured_format = SUBDOMAIN_BANNERS_FORMAT_ERROR;
        }
      }
      const errorKeys = Object.keys(errors);
      if (errorKeys.length != 0) {
        return responseHelper(false, errors, HTTP_BAD_REQUEST, RES_VALIDATION_TYPE, {}, res);
      }
      next();
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
};

