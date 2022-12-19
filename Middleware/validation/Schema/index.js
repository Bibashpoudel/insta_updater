const contentNewsFeeds = require('./content-news-feeds')
const socialProfileAbsoluteGrowth = require('./social-profile-absolute-growth')
const helpPage = require('./help-page')
const userManagement = require('./user-management')
const compareSocialMediaProfiles = require('./compare-social-media-profiles');
const basicProfileInfo = require('./basic-profile-info');
const dateValidation = require('./date-validation');

module.exports = {
  ...contentNewsFeeds,
  ...socialProfileAbsoluteGrowth,
  ...helpPage,
  ...userManagement,
  ...compareSocialMediaProfiles,
  ...basicProfileInfo,
  ...dateValidation,
};

