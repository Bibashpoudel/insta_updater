// const Validator = require('validatorjs');
const inputValidator = require('node-input-validator');
const mysqlModels = require('../../models/mysql').default;
const { Op } = require('sequelize');

const responseHelper = require('../../Helpers/responseHelper');
const { Enums } = require('../../Utils');
const inputValidationSchemas = require('./Schema');
const { format } = require('date-fns');


/* Registration of custom validatio rule*/
inputValidator.extend('image', async ({ value, args }) => {
  if (value.mimetype.includes('image')) {
    return true;
  }

  return false;
});
inputValidator.extendMessages({
  image: 'The :attribute must be a image file.',
});


inputValidator.extend('file', async ({ value, args }) => {
  const inputTypeof = typeof value;

  if (inputTypeof == 'object') {
    return true;
  }

  return false;
});

inputValidator.extend('strong_password', async ({ value, args }) => {
  if (value.match(Enums.PASS_REG)) {
    return true;
  }

  return false;
});

/* Adding customer validation message*/
inputValidator.extendMessages({
  file: 'The :attribute must be a file.',
});

inputValidator.extendMessages({
  strong_password: `The :attribute ${Enums.STRONG_PASSWORD}`,
});


inputValidator.extend('unique', async ({ value, args }) => {
  // default field is email in this example
  const filed = args[1] || 'email';

  const condition = {};

  condition[filed] = value;

  // add ignore condition
  if (args[2]) {
    condition['id'] = { [Op.ne]: args[2] };
  }


  const emailExist = await mysqlModels[args[0]].findOne({ where: condition });

  // email already exists
  if (emailExist) {
    return false;
  }

  return true;
});

const ValidationSchema = {
  addSocialMediaProfiles: async (req, res) => {
    const valSchema = {
      'profiles': 'required|array',
      'profiles.*.id': 'required|integer',
    };

    return valSchema;
  },
  deleteSocialMediaProfiles: async (req, res) => {
    const valSchema = {
      'profiles': 'required|array|minLength:1',
      'profiles.*': 'required',
    };

    return valSchema;
  },
  socialProfilePostDistribution: async (req, res) => {
    const valSchema = {
      'start_date': 'required',
      'end_date': 'required',
    };

    return valSchema;
  },
  socialProfilePostInteractions: async (req, res) => {
    const valSchema = {
      'start_date': 'required',
      'end_date': 'required',
      'profiles': 'required',
    };

    return valSchema;
  },
  socialProfileFollowersGrowth: async (req, res) => {
    const valSchema = {
      'start_date': 'required',
      'end_date': 'required',
      'profiles': 'required',
    };

    return valSchema;
  },
  socialProfileLikes: async (req, res) => {
    const valSchema = {
      'start_date': 'required',
      'end_date': 'required',
    };

    return valSchema;
  },
  socialProfileComments: async (req, res) => {
    const valSchema = {
      'start_date': 'required',
      'end_date': 'required',
    };

    return valSchema;
  },
  socialProfileShares: async (req, res) => {
    const valSchema = {
      'start_date': 'required',
      'end_date': 'required',
    };

    return valSchema;
  },
  socialMediaProfilesInteractionDistribution: async (req, res) => {
    const valSchema = {
      'start_date': 'required',
      'end_date': 'required',
      'profiles': 'required',
    };

    return valSchema;
  },
  socialMediaProfilesPostTypeDistribution: async (req, res) => {
    const valSchema = {
      'start_date': 'required',
      'end_date': 'required',
      'profiles': 'required',
    };

    return valSchema;
  },
  socialMediaProfilesTopPosts: async (req, res) => {
    const { start_date } = req.query;
    let endDateValRules = 'required'

    if (start_date) {
      const startDate = format(new Date(start_date), Enums.DATE_FORMAT);
      endDateValRules = `${endDateValRules}|after:${startDate}`
    }
    
    const valSchema = {
      'start_date': 'required',
      'end_date': endDateValRules,
    };

    return valSchema;
  },
  /* Help page*/
  storeFaqs: async (req, res) => {
    const valSchema = {
      'title': 'required|string',
      'description': 'required|string',
    };

    return valSchema;
  },
  storeHelpVideos: async (req, res) => {
    const valSchema = {
      'title': 'required|string',
      'description': 'required|string',
    };

    return valSchema;
  },
  howToDocs: async (req, res) => {
    const valSchema = {
      'title': 'required|string',
      'description': 'required|string',
    };

    return valSchema;
  },
  contactSupport: async (req, res) => {
    const valSchema = {
      'first_name': 'required|string',
      'last_name': 'required|string',
      'email': 'required|email',
      'mobile': 'required|phoneNumber',
      'message': 'required|string',
    };

    return valSchema;
  },
  contactSupportResponse: async (req, res) => {
    const valSchema = {
      'response': 'required|string',
    };

    return valSchema;
  },
  ...inputValidationSchemas,
};

module.exports = (schema) => async (req, res, next) => {
  try {
    const inputs = {};

    const valSchema = await ValidationSchema[schema](req, res);

    /* Merging req.body and req.files in a single object*/
    if (req.files) {
      for (const [key, value] of Object.entries(req.files)) {
        inputs[key] = value;
      }
    }

    for (const [key, value] of Object.entries(req.body)) {
      inputs[key] = value;
    }

    /* Pushing query params to inputs objects*/
    for (const [key, value] of Object.entries(req.query)) {
      inputs[key] = value;
    }


    const validation = new inputValidator.Validator(inputs, valSchema);

    const valid = await validation.check();
    /* validation check */

    if (!valid) {
      return responseHelper(false, validation.errors, Enums.HTTP_BAD_REQUEST, Enums.RES_VALIDATION_TYPE, {}, res);
    }

    // Validation passed
    next();
  } catch (error) {
    logger.error(error);
    return responseHelper(false, Enums.SERVER_ERROR, Enums.HTTP_SERVER_ERROR, '', {}, res);
  }
}
  ;
