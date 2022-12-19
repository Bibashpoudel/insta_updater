const responseHelper = require("../../../Helpers/responseHelper");
const { Enums } = require("../../../Utils");
const {
  FacebookProfileFeedService,
  InstagramProfileFeedService,
  SocialMediaProfileService,
} = require("../../../Services");
const mysqlModels = require("../../../models/mysql").default;
const { Op } = require("sequelize");

module.exports = {
  getProfilesContentNewsFeeds: async (req, res, next) => {
    try {
      const { authUser } = req.user;
      const reqParams = req.params;
      const socialMediaType = reqParams.type;
      const queryParams = req.query;
      const profileIds = queryParams.profiles.split(",").map(Number);
      let responseData = [];
      console.log("reqfrom new11:", reqParams);
      /* checking requested profiles are in customer subdomain profiles */
      const socialProfiles =
        await mysqlModels.CustomerSubdomainSocialMediaProfile.findAll({
          where: {
            subdomain_id: authUser.subdomain_id,
            social_media_type: socialMediaType,
            profile_id: {
              [Op.in]: profileIds,
            },
          },
        });
      console.log("socialProfiles22:", socialProfiles);

      /* Returning when no profiles are in subdomina*/
      if (socialProfiles.length == 0) {
        return responseHelper(
          true,
          "Profiles post interaction distributions",
          200,
          "",
          responseData,
          res
        );
      }

      // /* Fetching data */
      switch (socialMediaType) {
        case "facebook":
          responseData =
            await FacebookProfileFeedService.getProfilesContentNewsFeeds(
              req,
              socialProfiles
            );
          break;
        case "instagram":
          responseData =
            await InstagramProfileFeedService.getProfilesContentNewsFeeds(
              req,
              socialProfiles
            );
          break;
      }

      return responseHelper(
        true,
        "Profiles post interaction distributions",
        200,
        "",
        responseData,
        res
      );
    } catch (error) {
      logger.error(error);
      return responseHelper(
        false,
        Enums.SERVER_ERROR,
        Enums.HTTP_SERVER_ERROR,
        "",
        {},
        res
      );
    }
  },
};
