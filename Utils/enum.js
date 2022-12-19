module.exports = {
  // http code status code
  HTTP_OK: 200,
  HTTP_BAD_REQUEST: 400,
  HTTP_UNAUTHORIZED: 401,
  HTTP_NOT_AVAILABLE: 404,
  HTTP_CONFLICT_REQUEST: 409,
  HTTP_SERVER_ERROR: 500,
  HTTP_FORBIDDEN: 403,

  // http response message
  AUTH_SUCCESS: 'Successful login',
  AUTH_UNSUCCESS: 'Authentication unsuccessful',
  SERVER_ERROR: 'Internal server error',
  LOGOUT_SUCCESS: 'Logout successful',

  USER_DEACTIVATED: 'User has been deactivated for some reason',
  USER_NOT_FOUND: 'User does not exists',
  USER_OLD_PASSWORD_NOT_MATCHED: 'Old password does not match',
  USER_PASSWORD_CHANGED: 'Password updated successfully.',
  USER_ACCESS_DENIED: 'Requesting user do not have the privilege',
  USER_ACTIVATED: 'User activated',
  USER_LISTS: 'List of customers',
  USER_EMAIL_CONFLICT: 'User with same email already exists.',
  USER_UPDATED: 'User update was successful',
  USER_DELETED: 'User delete was successful',
  USER_ADDED: 'New customer added',
  USER_DETAIL: 'User details retrieved successfully',
  USER_PASS_NOT_MATCH: 'Incorrect password',
  USER_EMAIL_NOT_EXIST: 'Incorrect email',
  FACEBOOK_USER_NOT_FOUND: 'There is no domain associated to your Facebook login. Please contact administrator.',
  INVALID_SOCIAL_TYPE: 'Invalid social type',


  SUBDOMAIN_DUPLICATE_ADMIN: 'Subdomain already exists',
  SUBDOMAIN_LISTS: 'Subdomain retrieved successfully',
  SUBDOMAIN_DETAIL: 'Detail of Subdomain',
  SUBDOMAIN_BANNERS_UPDATED: 'Logo and Featured image updated successfully',
  SUBDOMAIN_BANNERS_REQUIRED: 'Please choose brand images',
  SUBDOMAIN_BANNER_REQUIRED: 'Any one banner image is required to be updated',
  SUBDOMAIN_LOGO_SIZE_ERROR: 'Size of the Logo Image must be less then 2 mb',
  SUBDOMAIN_FEATURED_SIZE_ERROR: 'Size of the Featured Image must be greater than 2 mb',
  SUBDOMAIN_BANNERS_FORMAT_ERROR: 'Banner image must be a image file',
  SUBDOMAIN_INVALID: 'Invalid subdomain',
  STRONG_PASSWORD: 'must contain at least one number and one uppercase and lowercase letter, and at least 8 or more characters.',

  BODY_VALIDATED: 'Request Object Validation successful',


  // http response status type message
  RES_VALIDATION_TYPE: 'validation',
  RES_ERROR_TYPE: 'error',
  RES_SUCCESS_SUCCESS: 'success',


  /* Social media profiles */
  LIST_OF_SEARCHED_SOCIAL_MEDIA_PROFILES: 'List of searched profiles list',

  /* Social Tag Feeds */
  SOCIAL_LISTENING_SENTIMENT_IN_TIME: 'Sentiment in time data',
  SOCIAL_LISTENING_TOP_EMOJI: 'List of top emojis',
  SOCIAL_LISTENING_NO_OF_PEOPLE: 'Count of total no. of people',
  SOCIAL_LISTENING_NO_OF_MENTIONS: 'Count of total mentions',
  SOCIAL_LISTENING_SOCIAL_INTERACTION: 'Count of total interactions',
  SOCIAL_LISTENING_POTENTIAL_IMPRESSION: 'Count of total impressions',
  POSITIVE_SENTIMENT_RGB: 'rgb(6,78,71)',
  NEGATIVE_SENTIMENT_RGB: 'rgb(255,52,52)',
  NEUTRAL_SENTIMENT_RGB: 'rgb(247, 226, 104)',
  NO_SENTIMENT_RGB: 'rgb(255,248,222)',
  TOTAL_SOCIAL_MEDIA_PROFILES: 'Total No. of Social Media Profiles',

  // regex variables
  EMAIL_REG: /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/,
  PASS_REG: /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$/,

  // Date function format
  DATE_FORMAT: 'yyyy-MM-dd',

  // Logs
  DOWNLOAD_LOGS: 'Total No. of download logs',
};
