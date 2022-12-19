const {
  HTTP_SERVER_ERROR,
  SERVER_ERROR,
  HTTP_BAD_REQUEST,
  BODY_VALIDATED,
  RES_VALIDATION_TYPE,
} = require('../Utils/enum');
const responseHelper = require('./responseHelper');
module.exports = {
  // User-defined function to compare the input data with joiobject
  validateData: async (data, JoiSchema, errors, res, next) => {
    try {
      const response = await JoiSchema.validate(data);
      if (response.error) {
        await Promise.all(
            response.error.details.map(async (errDetail)=> {
              errors[errDetail.context.label] = errDetail.message;
            }),
        );
      }
      const errorKeys = Object.keys(errors);
      if (errorKeys.length != 0) {
        return responseHelper(false, errors, HTTP_BAD_REQUEST, RES_VALIDATION_TYPE, {}, res);
      } else {
        logger.info(BODY_VALIDATED);
        next();
      }
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, HTTP_SERVER_ERROR, '', {}, res);
    }
  },
};
