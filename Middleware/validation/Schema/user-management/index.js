const mysqlModels = require('../../../../models/mysql').default;
const responseHelper = require('./../../../../Helpers/responseHelper');
const Enums = require('./../../../../Utils/enum');

module.exports = {
  authUserPasswordUpdate: async (req, res) => {
    const valSchema = {
      password: 'required|strong_password',
      confirm_password: 'required|same:password',
    };

    return valSchema;
  },
  userCreate: async (req, res) => {
    const {authUser} = req.user;
    const authUserRole = authUser['role'];
    const valSchema = {
    };

    /* Super admin create the users*/
    if (authUserRole === 'super-admin' && req.body['role'] !== 'super-admin') {
      valSchema['subdomain'] = 'required|unique:CustomerSubdomain,subdomain';
      valSchema['logo'] = 'required|file|image';
      valSchema['featured_image'] = 'required|file|image';
      valSchema['user_accounts_limit'] = 'required|integer|min:1';
      valSchema['social_media_profiles_limit'] = 'required|integer|min:1';
    }

    valSchema['first_name'] = 'required';
    valSchema['last_name'] = 'required';
    valSchema['email'] = 'required|email';

    const email_exist = await mysqlModels.User.findOne({
      where: {
        subdomain_id: req.user.authUser.dataValues.subdomain_id,
        email: req.body.email,
      },
    });

    const email_validation = email_exist ? 'required|email|unique:User,email' : 'required|email';

    /* Super admin create the users*/
    if (authUserRole === 'super-admin') {
      valSchema['role'] = 'required|in:super-admin,customer-admin,';
    } else {
      valSchema['role'] = 'required|in:customer-admin,customer-viewer';
      valSchema['employee_number'] = 'required';
      valSchema['position'] = 'required';
      valSchema['email'] = email_validation;
    }


    valSchema['contact_number'] = 'required|phoneNumber';


    return valSchema;
  },
  updateUser: async (req, res) => {
    const {authUser} = req.user;
    const authUserRole = authUser['role'];

    const userToBeUpdated = await mysqlModels.User.findByPk(req.params.id);

    const subdomainToBeUpdated = await mysqlModels.CustomerSubdomain.findByPk(userToBeUpdated.dataValues.subdomain_id);

    if (!userToBeUpdated) {
      return responseHelper(false, Enums.USER_NOT_FOUND, Enums.HTTP_NOT_AVAILABLE, '', {}, res);
    }

    const email_exist = await mysqlModels.User.findOne({
      where: {
        subdomain_id: userToBeUpdated.dataValues.subdomain_id,
        email: req.body.email,
      },
    });

    const email_validation = email_exist ?
    email_exist.dataValues.id == req.params.id ?
    'required|email' :
    `required|email|unique:User,email,${req.params.id}`:
    'required|email';

    const valSchema = {
      first_name: 'required',
      last_name: 'required',
      email: email_validation,
      contact_number: 'required|phoneNumber',
    };

    /* WHEN SUPER ADMIN UPDATES  THE USERS*/
    if (authUserRole === 'super-admin') {
      /* WHEN SUPER ADMIN UPDATED CUSTOMER ADMIN*/
      if (userToBeUpdated.role == 'customer-admin') {
        valSchema['logo'] = 'sometimes|file|image';
        valSchema['featured_image'] = 'sometimes|file|image';
        valSchema['user_accounts_limit'] = 'required|integer|min:1';
        valSchema['social_media_profiles_limit'] = 'required|integer|min:1';
        valSchema['subdomain'] = `required|string|unique:CustomerSubdomain,subdomain,${subdomainToBeUpdated.dataValues.id}`;
        // valSchema['email'] = `required|email|unique:User,email,${req.params.id}`;
      }
    }

    /* WHEN CUSTOMER ADMIN UPDATES THE USERS*/
    if (authUserRole === 'customer-admin') {
      valSchema['role'] = 'required|in:customer-admin,customer-viewer';
      valSchema['employee_number'] = 'required';
      valSchema['position'] = 'required';
    }

    return valSchema;
  },
  updateAuthUser: async (req, res) => {
    const valSchema = {
      first_name: 'required',
      last_name: 'required',
      contact_number: 'required|phoneNumber',
    };

    return valSchema;
  },
};
