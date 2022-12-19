const responseHelper = require('../Helpers/responseHelper');
const {
  HTTP_BAD_REQUEST,
  USER_ACCESS_DENIED,
} = require('../Utils/enum');

module.exports = (allowedRoles) => async (req, res, next) => {
  const {authUser} = req.user;
  const authUserRole = authUser['role'];

  console.log(authUserRole);

  if (!allowedRoles.includes(authUserRole)) {
    return responseHelper(false, USER_ACCESS_DENIED, HTTP_BAD_REQUEST, '', {}, res);
  }


  next();
}
;
