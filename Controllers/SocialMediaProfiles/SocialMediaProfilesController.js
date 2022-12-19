const responseHelper = require("../../Helpers/responseHelper");
const { Enums } = require("../../Utils");
const mysqlModels = require("../../models/mysql").default;
const { Op } = require("sequelize");
const { format } = require("date-fns");
const Services = require("./Services");
const {
  FacebookProfileFeedService,
  InstagramProfileFeedService,
  SocialMediaProfileService,
} = require("../../Services");
const mongooseModels = require("../../models/mongo-db").default;
const {
  fbProfileUpdaterClient,
  instaProfileUpdaterClient,
} = require("../../axios-clients");
const contentNewsFeeds = require("./content-news-feed");

module.exports = {
  /** *
   *  Social profiles
   ***/
  SearchSocialMediaProfiles: async (req, res, next) => {
    try {
      const { authUser } = req.user;
      const reqParams = req.params;
      const matchedPublicProfiles = [];
      let socialMediaProfilesRes = [];
      console.log("request data", reqParams);

      switch (reqParams.type) {
        case "facebook":
          socialMediaProfilesRes = await fbProfileUpdaterClient.get(
            `/social-media/facebook/search-profiles/${reqParams.query}`
          );
          break;
        case "instagram":
          socialMediaProfilesRes = await instaProfileUpdaterClient.get(
            `/social-media/instagram/search-profiles/${reqParams.query}`
          );
          break;
      }

      const {
        data: { socialMediaProfiles },
      } = socialMediaProfilesRes;

      for (const key in socialMediaProfiles) {
        if (Object.hasOwnProperty.call(socialMediaProfiles, key)) {
          const socialProfile = socialMediaProfiles[key];

          /* Checking if matched profile is already added */
          const alreadyAdded =
            await mysqlModels.CustomerSubdomainSocialMediaProfile.findOne({
              where: {
                profile_id: socialProfile.id,
                subdomain_id: authUser.subdomain_id,
              },
            });

          /* When profile is already added */
          if (alreadyAdded) {
            socialProfile["is_already_added"] = true;
          }

          matchedPublicProfiles.push(socialProfile);
        }
      }

      /** searching profile from facebook or instagram **/
      return responseHelper(
        true,
        Enums.LIST_OF_SEARCHED_SOCIAL_MEDIA_PROFILES,
        Enums.HTTP_OK,
        "",
        matchedPublicProfiles,
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
  testSearchSocialMediaProfiles: async (req, res, next) => {
    try {
      const reqParams = req.params;
      const socialMediaProfilesRes = await fbProfileUpdaterClient.get(
        `/test/social-media/facebook/search-profiles/${reqParams.query}`
      );
      console.log(socialMediaProfilesRes.data);
      /** searching profile from facebook or instagram **/
      return res.json(socialMediaProfilesRes.data);
    } catch (error) {
      console.error(error);
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

  /**
   * Adds new profile for customer subdomain
   */
  addProfiles: async (req, res, next) => {
    try {
      const { authUser } = req.user;
      const reqBody = req.body;
      const reqParams = req.params;
      const profilesToBeAdded = reqBody.profiles;

      /* getting configured profile add limit for a subdomaing */
      const customerSubdomain = await mysqlModels.CustomerSubdomain.findByPk(
        authUser.subdomain_id
      );
      const socialMediaProfilesLimit =
        customerSubdomain.social_media_profiles_limit;

      /** Getting added profiles  */
      const { count, rows } =
        await mysqlModels.CustomerSubdomainSocialMediaProfile.findAndCountAll({
          where: {
            subdomain_id: customerSubdomain.id,
          },
        });

      /* Calculating remaining profile add limit*/
      const remainingProfileAddLimit = socialMediaProfilesLimit - count;

      /* Returning with error message when profiles to be added is greater then configured profiles limit */
      if (profilesToBeAdded.length > remainingProfileAddLimit) {
        return responseHelper(
          false,
          `Profile(s) can't be added as you have ${remainingProfileAddLimit} reminaing profile add limit.`,
          Enums.HTTP_FORBIDDEN,
          "",
          {},
          res
        );
      }

      /** Adding profiles and downloading data from facebook or instagram*/
      for (const key in profilesToBeAdded) {
        if (Object.hasOwnProperty.call(profilesToBeAdded, key)) {
          const profile = profilesToBeAdded[key];
          if (profile.username !== "undefined") {
            /* Creating the records of customers socail media profiles */
            const [newProfile] =
              await mysqlModels.CustomerSubdomainSocialMediaProfile.findOrCreate(
                {
                  where: {
                    subdomain_id: authUser.subdomain_id,
                    profile_id: profile.id,
                    social_media_type: reqParams.type,
                  },
                  defaults: {
                    subdomain_id: authUser.subdomain_id,
                    profile_id: profile.id,
                    social_media_type: reqParams.type,
                  },
                }
              );

            /* Creating the social media profile records for msv platform */
            const profileName = profile.name ? profile.name : "";
            const profileUsername = profile.username ? profile.username : "";
            const profilePicture = profile.profile_picture_url
              ? profile.profile_picture_url
              : "";
            const profileFanCount = profile.fan_count ? profile.fan_count : 0;
            const profilePostsCount = profile.posts_count
              ? profile.posts_count
              : 0;

            const updateProfileAttributes = {
              social_page_id: profile.id,
              social_type: reqParams.type,
              page_name: profileName,
              page_username: profileUsername,
            };

            if (reqParams.type == "facebook") {
              updateProfileAttributes["page_fan_count"] = profileFanCount;
              updateProfileAttributes["page_picture"] = profilePicture;
              updateProfileAttributes["page_posts_count"] = profilePostsCount;
            }

            const socialMediaProfileRes =
              await mongooseModels.SocialMediaProfile.findOneAndUpdate(
                {
                  social_page_id: profile.id,
                  social_type: reqParams.type,
                },
                updateProfileAttributes,
                { new: true, upsert: true, rawResult: true }
              );

            /*  checking if new social media profile added in msv platform or not*/
            const newSocialMediaProfileCreated =
              socialMediaProfileRes &&
              socialMediaProfileRes.lastErrorObject &&
              !socialMediaProfileRes.lastErrorObject.updatedExisting
                ? true
                : false;
            const socialMediaProfile = socialMediaProfileRes.value;

            /* Adding Profiles color when new profile is added*/
            if (newSocialMediaProfileCreated) {
              const profileColor = await Services.generateProfilesUniqueColor(
                reqParams.type
              );
              socialMediaProfile.color = profileColor;
              socialMediaProfile.save();
            }

            /* Getting profile post count*/
            // const socialMediaProfilePostCount = await socialMediaProfile.getPostCount();

            /* Getting only the least updated profile which is added in customer subdomain*/
            const socialMediaProfileNotUpdatedToday =
              await mongooseModels.SocialMediaProfile.findOne({
                social_type: reqParams.type,
                last_updated_date: {
                  $ne: format(new Date(), Enums.DATE_FORMAT),
                },
                social_page_id: profile.id,
              });

            /** Fetching data facebook/Instagram when profiles has no posts */
            if (socialMediaProfileNotUpdatedToday) {
              // sending profile data to profile updater microservice
              switch (reqParams.type) {
                case "facebook":
                  await fbProfileUpdaterClient.post(
                    "/profiles/store",
                    socialMediaProfile
                  );
                  break;
                case "instagram":
                  await instaProfileUpdaterClient.post(
                    "/profiles/store",
                    socialMediaProfile
                  );
                  break;
              }
            }
          }
        }
      }

      console.log("reqParams.type", reqParams.type);
      return responseHelper(
        true,
        "Profile added successfully.",
        Enums.HTTP_OK,
        "",
        profilesToBeAdded,
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
  /*
   * Removes the added profiles
   */
  deleteProfiles: async (req, res, next) => {
    try {
      const { authUser } = req.user;
      const reqBody = req.body;
      const profilesToBeDeleted = reqBody.profiles;
      const reqParams = req.params;

      /** Deleting Social media profiles*/
      const result =
        await mysqlModels.CustomerSubdomainSocialMediaProfile.destroy({
          where: {
            subdomain_id: authUser.subdomain_id,
            profile_id: profilesToBeDeleted,
            social_media_type: reqParams.type,
          },
        });

      return responseHelper(
        true,
        "profiles deleted successfully",
        200,
        "",
        result,
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
  /**
   * returns the list of profile added within a subdomain
   */
  customerProfilesList: async (req, res, next) => {
    try {
      const { authUser } = req.user;
      const reqParams = req.params;
      const queryParams = req.query;
      const searchQuery = queryParams.search;
      const { start_date, end_date } = queryParams;
      const SocialMediaType = reqParams.type ? reqParams.type : "facebook";
      let socialProfiles = [];

      const startDate = format(new Date(start_date), Enums.DATE_FORMAT);
      const endDate = format(new Date(end_date), Enums.DATE_FORMAT);

      /* Getting graph timeline based on period */
      const dateRanges = await Services.getGrowthComparisonDateRange(
        startDate,
        endDate
      );

      /* getting the profiles added in a subdomain */
      /* Getting customer added profiles */
      const customerSocialProfiles =
        await mysqlModels.CustomerSubdomainSocialMediaProfile.findAll({
          where: {
            subdomain_id: authUser["subdomain_id"],
            social_media_type: SocialMediaType,
          },
          attributes: ["profile_id"],
        });

      /* Collecting only profile ids*/
      const customerSocialProfileIds = customerSocialProfiles.map(
        (el) => el.profile_id
      );

      /* Profiles match query*/
      const profileFilter = {
        social_page_id: {
          $in: customerSocialProfileIds,
        },
        social_type: SocialMediaType,
      };

      /* Profiles search query by name*/
      if (searchQuery) {
        profileFilter["page_name"] = {
          $regex: "^" + searchQuery,
          $options: "i",
        };
      }

      /* Getting the data based on different social media type */
      switch (SocialMediaType) {
        case "facebook":
          const interactionPer1kFans = {
            $multiply: [
              {
                $cond: {
                  if: { $eq: ["$page_fan_count", 0] },
                  then: 0,
                  else: {
                    $divide: [
                      {
                        $sum: "$profile_feeds.total_interactions",
                      },
                      "$page_fan_count",
                    ],
                  },
                },
              },
              1000,
            ],
          };
          socialProfiles = await mongooseModels.SocialMediaProfile.aggregate([
            {
              $match: profileFilter,
            },
            {
              $lookup: {
                from: "facebook_profile_fan_growths",
                let: {
                  social_page_id: "$social_page_id", // localField
                },
                pipeline: [
                  {
                    $match: {
                      date: startDate,
                      $expr: {
                        $and: [
                          {
                            $eq: [
                              "$$social_page_id", // localField variable it can be used only in $expr
                              "$profile_id", // foreignField
                            ],
                          },
                        ],
                      },
                    },
                  },
                  {
                    $project: {
                      fan_count: "$fan_count",
                    },
                  },
                ],
                as: "start_date_fan_count",
              },
            },
            // current date range fan growth
            {
              $lookup: {
                from: "facebook_profile_fan_growths",
                let: {
                  social_page_id: "$social_page_id", // localField
                },
                pipeline: [
                  {
                    $match: {
                      date: { $gte: dateRanges.start, $lte: dateRanges.end },
                      $expr: {
                        $and: [
                          {
                            $eq: [
                              "$$social_page_id", // localField variable it can be used only in $expr
                              "$profile_id", // foreignField
                            ],
                          },
                        ],
                      },
                    },
                  },
                  {
                    $project: {
                      fan_growth: { $sum: "$fan_growth" },
                    },
                  },
                ],
                as: "current_fan_growth",
              },
            },

            // prev date range fan growth
            {
              $lookup: {
                from: "facebook_profile_fan_growths",
                let: {
                  social_page_id: "$social_page_id", // localField
                },
                pipeline: [
                  {
                    $match: {
                      date: {
                        $gte: dateRanges.compareGrowthStartDate,
                        $lte: dateRanges.compareGrowthEndDate,
                      },
                      $expr: {
                        $and: [
                          {
                            $eq: [
                              "$$social_page_id", // localField variable it can be used only in $expr
                              "$profile_id", // foreignField
                            ],
                          },
                        ],
                      },
                    },
                  },
                  {
                    $project: {
                      fan_growth: { $sum: "$fan_growth" },
                    },
                  },
                ],
                as: "previous_fan_growth",
              },
            },
            {
              $lookup: {
                from: "facebookpagefeeds",
                let: {
                  social_page_id: "$social_page_id", // localField
                },
                pipeline: [
                  {
                    $match: {
                      feed_created_date: { $gte: startDate, $lte: endDate },
                      $expr: {
                        $and: [
                          {
                            $eq: [
                              "$$social_page_id", // localField variable it can be used only in $expr
                              "$profile_id", // foreignField
                            ],
                          },
                        ],
                      },
                    },
                  },
                  {
                    $project: {
                      profile_id: "$profile_id",
                      feed_type: "$feed_type",
                      feed_comment_count: "$feed_comment_count",
                      feed_share_count: "$feed_share_count",
                      total_interactions: {
                        $sum: {
                          $add: [
                            "$feed_comment_count",
                            "$feed_share_count",
                            "$feed_like_count",
                            "$feed_love_count",
                            "$feed_haha_count",
                            "$feed_wow_count",
                          ],
                        },
                      },
                    },
                  },
                ],
                as: "profile_feeds",
              },
            },
            // feed count previous date range
            {
              $lookup: {
                from: "facebookpagefeeds",
                let: {
                  social_page_id: "$social_page_id", // localField
                },
                pipeline: [
                  {
                    $match: {
                      feed_created_date: {
                        $gte: dateRanges.compareGrowthStartDate,
                        $lte: dateRanges.compareGrowthEndDate,
                      },
                      $expr: {
                        $and: [
                          {
                            $eq: [
                              "$$social_page_id", // localField variable it can be used only in $expr
                              "$profile_id", // foreignField
                            ],
                          },
                        ],
                      },
                    },
                  },
                  {
                    $project: {
                      profile_id: "$profile_id",
                      feed_type: "$feed_type",
                    },
                  },
                ],
                as: "profile_feeds_prev_date_range",
              },
            },
            {
              $project: {
                id: "$social_page_id",
                username: "$page_username",
                name: "$page_name",
                picture: "$page_picture",
                page_url: {
                  $concat: [
                    "https://www.facebook.com/",
                    { $toString: { $toLong: "$social_page_id" } },
                  ],
                },
                color: "$color",
                fan_count: { $sum: "$page_fan_count" },
                fan_count_for_date_range: {
                  $sum: "$current_fan_growth.fan_growth",
                },
                is_data_downloading: "$is_data_downloading",
                shares_count: { $sum: "$profile_feeds.feed_share_count" },
                comments_count: { $sum: "$profile_feeds.feed_comment_count" },
                interactions_count: {
                  $sum: "$profile_feeds.total_interactions",
                },
                posts_count: { $size: "$profile_feeds" },
                avg_interaction_per_post: {
                  $cond: {
                    if: { $eq: [{ $size: "$profile_feeds" }, 0] },
                    then: 0,
                    else: {
                      $divide: [
                        {
                          $sum: "$profile_feeds.total_interactions",
                        },
                        { $size: "$profile_feeds" },
                      ],
                    },
                  },
                },
                interaction_per_1k_fans: interactionPer1kFans,
                avg_interaction_per_1k_fans_per_post: {
                  $cond: {
                    if: { $eq: [{ $size: "$profile_feeds" }, 0] },
                    then: 0,
                    else: {
                      $divide: [
                        interactionPer1kFans,
                        { $size: "$profile_feeds" },
                      ],
                    },
                  },
                },
                relative_fan_change: {
                  // ((last day - 1st day)/1st day)*100
                  $multiply: [
                    {
                      $cond: {
                        if: {
                          $eq: [
                            {
                              $subtract: [
                                "$page_fan_count",
                                { $sum: "$current_fan_growth.fan_growth" },
                              ],
                            },
                            0,
                          ],
                        },
                        then: 0,
                        else: {
                          $divide: [
                            { $sum: "$current_fan_growth.fan_growth" },
                            {
                              $subtract: [
                                "$page_fan_count",
                                { $sum: "$current_fan_growth.fan_growth" },
                              ],
                            },
                          ],
                        },
                      },
                    },
                    100,
                  ],
                },
                post_absolute_growth: {
                  $multiply: [
                    {
                      $cond: {
                        if: { $eq: [{ $size: "$profile_feeds" }, 0] },
                        then: 0,
                        else: {
                          $divide: [
                            {
                              $subtract: [
                                { $size: "$profile_feeds_prev_date_range" },
                                { $size: "$profile_feeds" },
                              ],
                            },
                            { $size: "$profile_feeds" },
                          ],
                        },
                      },
                    },
                    100,
                  ],
                },
                followers_absolute_growth: {
                  $multiply: [
                    {
                      $cond: {
                        if: {
                          $eq: [{ $sum: "$current_fan_growth.fan_growth" }, 0],
                        },
                        then: 0,
                        else: {
                          $divide: [
                            {
                              $subtract: [
                                { $sum: "$previous_fan_growth.fan_growth" },
                                { $sum: "$current_fan_growth.fan_growth" },
                              ],
                            },
                            { $sum: "$current_fan_growth.fan_growth" },
                          ],
                        },
                      },
                    },
                    100,
                  ],
                },
              },
            },
          ]);
          break;
        case "instagram":
          const interactionPerThousandFans = {
            $multiply: [
              {
                $cond: {
                  if: { $eq: ["$page_fan_count", 0] },
                  then: 0,
                  else: {
                    $divide: [
                      {
                        $sum: "$profile_feeds.total_interactions",
                      },
                      "$page_fan_count",
                    ],
                  },
                },
              },
              1000,
            ],
          };
          const currentDateRangeFollowCount = {
            $subtract: [
              { $sum: "$end_date_fan_count.follow_count" },
              { $sum: "$start_date_fan_count.follow_count" },
            ],
          };
          const prevDateRangeFollowCount = {
            $subtract: [
              { $sum: "$prev_end_date_fan_count.follow_count" },
              { $sum: "$prev_start_date_fan_count.follow_count" },
            ],
          };

          socialProfiles = await mongooseModels.SocialMediaProfile.aggregate([
            {
              $match: profileFilter,
            },
            {
              $lookup: {
                from: "instagram_profile_fan_growths",
                let: {
                  social_page_id: "$social_page_id", // localField
                },
                pipeline: [
                  {
                    $match: {
                      date: startDate,
                      $expr: {
                        $and: [
                          {
                            $eq: [
                              "$$social_page_id", // localField variable it can be used only in $expr
                              "$profile_id", // foreignField
                            ],
                          },
                        ],
                      },
                    },
                  },
                  {
                    $project: {
                      fan_count: "$fan_count",
                      follow_count: "$follows_count",
                    },
                  },
                ],
                as: "start_date_fan_count",
              },
            },
            {
              $lookup: {
                from: "instagram_profile_fan_growths",
                let: {
                  social_page_id: "$social_page_id", // localField
                },
                pipeline: [
                  {
                    $match: {
                      date: { $gte: dateRanges.start, $lte: dateRanges.end },
                      $expr: {
                        $and: [
                          {
                            $eq: [
                              "$$social_page_id", // localField variable it can be used only in $expr
                              "$profile_id", // foreignField
                            ],
                          },
                        ],
                      },
                    },
                  },
                  {
                    $project: {
                      fan_count: "$fan_count",
                      follow_count: "$follows_count",
                      fan_growth: { $sum: "$fan_growth" },
                    },
                  },
                ],
                as: "current_fan_growth",
              },
            },
            {
              $lookup: {
                from: "instagram_profile_fan_growths",
                let: {
                  social_page_id: "$social_page_id", // localField
                },
                pipeline: [
                  {
                    $match: {
                      date: {
                        $gte: dateRanges.compareGrowthStartDate,
                        $lte: dateRanges.compareGrowthEndDate,
                      },
                      $expr: {
                        $and: [
                          {
                            $eq: [
                              "$$social_page_id", // localField variable it can be used only in $expr
                              "$profile_id", // foreignField
                            ],
                          },
                        ],
                      },
                    },
                  },
                  {
                    $project: {
                      fan_count: "$fan_count",
                      follow_count: "$follows_count",
                      fan_growth: { $sum: "$fan_growth" },
                    },
                  },
                ],
                as: "previous_fan_growth",
              },
            },
            {
              $lookup: {
                from: "instagramprofilefeeds",
                let: {
                  social_page_id: "$social_page_id", // localField
                },
                pipeline: [
                  {
                    $match: {
                      feed_created_date: { $gte: startDate, $lte: endDate },
                      $expr: {
                        $and: [
                          {
                            $eq: [
                              "$$social_page_id", // localField variable it can be used only in $expr
                              "$profile_id", // foreignField
                            ],
                          },
                        ],
                      },
                    },
                  },
                  {
                    $project: {
                      profile_id: "$profile_id",
                      feed_type: "$feed_type",
                      feed_comment_count: "$feed_comment_count",
                      feed_share_count: "$feed_share_count",
                      total_interactions: {
                        $sum: {
                          $add: ["$feed_comment_count", "$feed_like_count"],
                        },
                      },
                    },
                  },
                ],
                as: "profile_feeds",
              },
            },
            // feed count previous date range
            {
              $lookup: {
                from: "instagramprofilefeeds",
                let: {
                  social_page_id: "$social_page_id", // localField
                },
                pipeline: [
                  {
                    $match: {
                      feed_created_date: {
                        $gte: dateRanges.compareGrowthStartDate,
                        $lte: dateRanges.compareGrowthEndDate,
                      },
                      $expr: {
                        $and: [
                          {
                            $eq: [
                              "$$social_page_id", // localField variable it can be used only in $expr
                              "$profile_id", // foreignField
                            ],
                          },
                        ],
                      },
                    },
                  },
                  {
                    $project: {
                      profile_id: "$profile_id",
                      feed_type: "$feed_type",
                    },
                  },
                ],
                as: "profile_feeds_prev_date_range",
              },
            },
            {
              $project: {
                id: "$social_page_id",
                username: "$page_username",
                name: "$page_name",
                picture: "$page_picture",
                page_url: {
                  $concat: ["https://www.instagram.com/", "$page_username"],
                },
                color: "$color",
                fan_count: { $sum: "$page_fan_count" },
                fan_count_for_date_range: {
                  $sum: "$current_fan_growth.fan_growth",
                },
                following_count: currentDateRangeFollowCount,
                is_data_downloading: "$is_data_downloading",
                comments_count: { $sum: "$profile_feeds.feed_comment_count" },
                interactions_count: {
                  $sum: "$profile_feeds.total_interactions",
                },
                posts_count: { $size: "$profile_feeds" },
                avg_interaction_per_post: {
                  $cond: {
                    if: { $eq: [{ $size: "$profile_feeds" }, 0] },
                    then: 0,
                    else: {
                      $divide: [
                        {
                          $sum: "$profile_feeds.total_interactions",
                        },
                        { $size: "$profile_feeds" },
                      ],
                    },
                  },
                },
                interaction_per_1k_fans: interactionPerThousandFans,
                avg_interaction_per_1k_fans_per_post: {
                  $cond: {
                    if: { $eq: [{ $size: "$profile_feeds" }, 0] },
                    then: 0,
                    else: {
                      $divide: [
                        interactionPerThousandFans,
                        { $size: "$profile_feeds" },
                      ],
                    },
                  },
                },
                relative_fan_change: {
                  // relative_fan_change_formula = ((last day - 1st day)/1st day)*100
                  $multiply: [
                    {
                      $cond: {
                        if: {
                          $eq: [
                            {
                              $subtract: [
                                "$page_fan_count",
                                { $sum: "$current_fan_growth.fan_growth" },
                              ],
                            },
                            0,
                          ],
                        },
                        then: 0,
                        else: {
                          $divide: [
                            { $sum: "$current_fan_growth.fan_growth" },
                            {
                              $subtract: [
                                "$page_fan_count",
                                { $sum: "$current_fan_growth.fan_growth" },
                              ],
                            },
                          ],
                        },
                      },
                    },
                    100,
                  ],
                },
                post_absolute_growth: {
                  $multiply: [
                    {
                      $cond: {
                        if: { $eq: [{ $size: "$profile_feeds" }, 0] },
                        then: 0,
                        else: {
                          $divide: [
                            {
                              $subtract: [
                                { $size: "$profile_feeds_prev_date_range" },
                                { $size: "$profile_feeds" },
                              ],
                            },
                            { $size: "$profile_feeds" },
                          ],
                        },
                      },
                    },
                    100,
                  ],
                },
                followers_absolute_growth: {
                  $multiply: [
                    {
                      $cond: {
                        if: {
                          $eq: [{ $sum: "$current_fan_growth.fan_growth" }, 0],
                        },
                        then: 0,
                        else: {
                          $divide: [
                            {
                              $subtract: [
                                { $sum: "$previous_fan_growth.fan_growth" },
                                { $sum: "$current_fan_growth.fan_growth" },
                              ],
                            },
                            { $sum: "$current_fan_growth.fan_growth" },
                          ],
                        },
                      },
                    },
                    100,
                  ],
                },
                following_absolute_growth: {
                  $multiply: [
                    {
                      $cond: {
                        if: { $eq: [currentDateRangeFollowCount, 0] },
                        then: 0,
                        else: {
                          $divide: [
                            {
                              $subtract: [
                                prevDateRangeFollowCount,
                                currentDateRangeFollowCount,
                              ],
                            },
                            currentDateRangeFollowCount,
                          ],
                        },
                      },
                    },
                    100,
                  ],
                },
              },
            },
          ]);
          break;
        default:
        // code block
      }
      return responseHelper(
        true,
        "list of profiles",
        Enums.HTTP_OK,
        "",
        socialProfiles,
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

  // new api
  customerProfiles: async (req, res, next) => {
    try {
      const { authUser } = req.user;
      const reqParams = req.params;
      const queryParams = req.query;
      const searchQuery = queryParams.search;
      const SocialMediaType = reqParams.type ? reqParams.type : "facebook";
      let socialProfiles = [];

      /* getting the profiles added in a subdomain */
      /* Getting customer added profiles */
      const customerSocialProfiles =
        await mysqlModels.CustomerSubdomainSocialMediaProfile.findAll({
          where: {
            subdomain_id: authUser["subdomain_id"],
            social_media_type: SocialMediaType,
          },
          attributes: ["profile_id"],
        });

      /* Collecting only profile ids*/
      const customerSocialProfileIds = customerSocialProfiles.map(
        (el) => el.profile_id
      );

      /* Profiles match query*/
      const profileFilter = {
        social_page_id: {
          $in: customerSocialProfileIds,
        },
        social_type: SocialMediaType,
      };

      /* Profiles search query by name*/
      if (searchQuery) {
        profileFilter["page_name"] = {
          $regex: "^" + searchQuery,
          $options: "i",
        };
      }

      /* Getting the data based on different social media type */
      switch (SocialMediaType) {
        case "facebook":
          const interactionPer1kFans = {
            $multiply: [
              {
                $cond: {
                  if: { $eq: ["$page_fan_count", 0] },
                  then: 0,
                  else: {
                    $divide: [
                      {
                        $sum: "$profile_feeds.total_interactions",
                      },
                      "$page_fan_count",
                    ],
                  },
                },
              },
              1000,
            ],
          };
          socialProfiles = await mongooseModels.SocialMediaProfile.aggregate([
            {
              $match: profileFilter,
            },
            {
              $lookup: {
                from: "facebookpagefeeds",
                let: {
                  social_page_id: "$social_page_id", // localField
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          {
                            $eq: [
                              "$$social_page_id", // localField variable it can be used only in $expr
                              "$profile_id", // foreignField
                            ],
                          },
                        ],
                      },
                    },
                  },
                  {
                    $project: {
                      profile_id: "$profile_id",
                      feed_type: "$feed_type",
                      feed_comment_count: "$feed_comment_count",
                      feed_share_count: "$feed_share_count",
                      total_interactions: {
                        $sum: {
                          $add: [
                            "$feed_comment_count",
                            "$feed_share_count",
                            "$feed_like_count",
                            "$feed_love_count",
                            "$feed_haha_count",
                            "$feed_wow_count",
                          ],
                        },
                      },
                    },
                  },
                ],
                as: "profile_feeds",
              },
            },
            {
              $project: {
                id: "$social_page_id",
                username: "$page_username",
                name: "$page_name",
                picture: "$page_picture",
                page_url: {
                  $concat: [
                    "https://www.facebook.com/",
                    { $toString: { $toLong: "$social_page_id" } },
                  ],
                },
                color: "$color",
                fan_count: "$page_fan_count",
                following_count: "$page_follows_count",
                is_data_downloading: "$is_data_downloading",
                shares_count: { $sum: "$profile_feeds.feed_share_count" },
                comments_count: { $sum: "$profile_feeds.feed_comment_count" },
                interactions_count: {
                  $sum: "$profile_feeds.total_interactions",
                },
                posts_count: { $size: "$profile_feeds" },
                avg_interaction_per_post: {
                  $cond: {
                    if: { $eq: [{ $size: "$profile_feeds" }, 0] },
                    then: 0,
                    else: {
                      $divide: [
                        {
                          $sum: "$profile_feeds.total_interactions",
                        },
                        { $size: "$profile_feeds" },
                      ],
                    },
                  },
                },
                interaction_per_1k_fans: interactionPer1kFans,
                avg_interaction_per_1k_fans_per_post: {
                  $cond: {
                    if: { $eq: [{ $size: "$profile_feeds" }, 0] },
                    then: 0,
                    else: {
                      $divide: [
                        interactionPer1kFans,
                        { $size: "$profile_feeds" },
                      ],
                    },
                  },
                },
              },
            },
          ]);
          break;
        case "instagram":
          const interactionPerThousandFans = {
            $multiply: [
              {
                $cond: {
                  if: { $eq: ["$page_fan_count", 0] },
                  then: 0,
                  else: {
                    $divide: [
                      {
                        $sum: "$profile_feeds.total_interactions",
                      },
                      "$page_fan_count",
                    ],
                  },
                },
              },
              1000,
            ],
          };

          socialProfiles = await mongooseModels.SocialMediaProfile.aggregate([
            {
              $match: profileFilter,
            },
            {
              $lookup: {
                from: "instagramprofilefeeds",
                let: {
                  social_page_id: "$social_page_id", // localField
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          {
                            $eq: [
                              "$$social_page_id", // localField variable it can be used only in $expr
                              "$profile_id", // foreignField
                            ],
                          },
                        ],
                      },
                    },
                  },
                  {
                    $project: {
                      profile_id: "$profile_id",
                      feed_type: "$feed_type",
                      feed_comment_count: "$feed_comment_count",
                      feed_share_count: "$feed_share_count",
                      total_interactions: {
                        $sum: {
                          $add: ["$feed_comment_count", "$feed_like_count"],
                        },
                      },
                    },
                  },
                ],
                as: "profile_feeds",
              },
            },
            {
              $project: {
                id: "$social_page_id",
                username: "$page_username",
                name: "$page_name",
                picture: "$page_picture",
                page_url: {
                  $concat: ["https://www.instagram.com/", "$page_username"],
                },
                color: "$color",
                fan_count: "$page_fan_count",
                following_count: "$page_follows_count",
                is_data_downloading: "$is_data_downloading",
                comments_count: { $sum: "$profile_feeds.feed_comment_count" },
                interactions_count: {
                  $sum: "$profile_feeds.total_interactions",
                },
                posts_count: { $size: "$profile_feeds" },
                avg_interaction_per_post: {
                  $cond: {
                    if: { $eq: [{ $size: "$profile_feeds" }, 0] },
                    then: 0,
                    else: {
                      $divide: [
                        {
                          $sum: "$profile_feeds.total_interactions",
                        },
                        { $size: "$profile_feeds" },
                      ],
                    },
                  },
                },
                interaction_per_1k_fans: interactionPerThousandFans,
                avg_interaction_per_1k_fans_per_post: {
                  $cond: {
                    if: { $eq: [{ $size: "$profile_feeds" }, 0] },
                    then: 0,
                    else: {
                      $divide: [
                        interactionPerThousandFans,
                        { $size: "$profile_feeds" },
                      ],
                    },
                  },
                },
              },
            },
          ]);
          break;
        default:
        // code block
      }

      return responseHelper(
        true,
        "list of profiles",
        Enums.HTTP_OK,
        "",
        socialProfiles,
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

  // this is profile overview page basic info like name,username etc controller
  getProfileBasicDetails: async (req, res, next) => {
    try {
      const reqParams = req.params;
      const { authUser } = req.user;
      const queryParams = req.query;
      const { start_date, end_date } = queryParams;
      const socialMediaType = reqParams.type;
      const startDate = format(new Date(start_date), Enums.DATE_FORMAT);
      const endDate = format(new Date(end_date), Enums.DATE_FORMAT);
      let responseData = [];

      /* Getting profiles only added in customer subdomain  */
      const customerSubdomainProfile =
        await mysqlModels.CustomerSubdomainSocialMediaProfile.findOne({
          attributes: ["profile_id"],
          where: {
            profile_id: reqParams["profile_id"],
            subdomain_id: authUser.subdomain_id,
            social_media_type: socialMediaType,
          },
        });

      if (customerSubdomainProfile) {
        responseData = await SocialMediaProfileService.getProfileInfo(
          socialMediaType,
          customerSubdomainProfile["profile_id"],
          startDate,
          endDate
        );
      }

      return responseHelper(true, "profile data", 200, "", responseData, res);
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

  // this is profile overview page like card info controller on time_filter= last7days,today etc basis
  getProfileFeedLikes: async (req, res, next) => {
    try {
      const reqParams = req.params;
      const queryParams = req.query;
      const { start_date, end_date } = queryParams;
      const startDate = format(new Date(start_date), Enums.DATE_FORMAT);
      const endDate = format(new Date(end_date), Enums.DATE_FORMAT);
      let responseData;

      /* Getting graph timeline based on period */
      const dateRanges = await Services.getGrowthComparisonDateRange(
        startDate,
        endDate
      );

      switch (reqParams.type) {
        case "facebook":
          responseData =
            await FacebookProfileFeedService.getProfileFeedLikesAbsoluteGrowth(
              req,
              reqParams["profile_id"],
              dateRanges
            );
          break;
        case "instagram":
          responseData =
            await InstagramProfileFeedService.getProfileFeedLikesAbsoluteGrowth(
              req,
              reqParams["profile_id"],
              dateRanges
            );
          break;
        default:
        // code block
      }

      return responseHelper(true, "profile data", 200, "", responseData, res);
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

  // this is profile overview page comment card  info  controller on time_filter= last7days,today etc basis
  getProfileFeedComments: async (req, res, next) => {
    try {
      const reqParams = req.params;
      const queryParams = req.query;
      const { start_date, end_date } = queryParams;
      const startDate = format(new Date(start_date), Enums.DATE_FORMAT);
      const endDate = format(new Date(end_date), Enums.DATE_FORMAT);
      let responseData;

      /* Getting graph timeline based on period */
      const dateRanges = await Services.getGrowthComparisonDateRange(
        startDate,
        endDate
      );

      switch (reqParams.type) {
        case "facebook":
          responseData =
            await FacebookProfileFeedService.getProfileFeedCommentsAbsoluteGrowth(
              req,
              reqParams["profile_id"],
              dateRanges
            );
          break;
        case "instagram":
          responseData =
            await InstagramProfileFeedService.getProfileFeedCommentsAbsoluteGrowth(
              req,
              reqParams["profile_id"],
              dateRanges
            );
          break;
        default:
        // code block
      }

      return responseHelper(true, "profile data", 200, "", responseData, res);
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

  // this is profile overview page share card  info controller on time_filter= last7days,today etc basis
  getProfileFeedShares: async (req, res, next) => {
    try {
      const reqParams = req.params;
      const queryParams = req.query;
      const { start_date, end_date } = queryParams;
      const startDate = format(new Date(start_date), Enums.DATE_FORMAT);
      const endDate = format(new Date(end_date), Enums.DATE_FORMAT);

      /* Getting graph timeline based on period */
      const dateRanges = await Services.getGrowthComparisonDateRange(
        startDate,
        endDate
      );

      switch (reqParams.type) {
        case "facebook":
          responseData =
            await FacebookProfileFeedService.getProfileFeedSharesAbsoluteGrowth(
              req,
              reqParams["profile_id"],
              dateRanges
            );
          break;
        case "instagram":
          responseData = {
            total_shares_count: 0,
            growth: 0,
            filter_type: dateRanges.filter_type,
          };
          break;
        default:
        // code block
      }

      return responseHelper(true, "profile data", 200, "", responseData, res);
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

  // profile overview get profile top posts based on total like, comment, share
  getProfileTopPosts: async (req, res, next) => {
    try {
      const reqParams = req.params;
      let responseData = [];
      const profileID = JSON.parse(reqParams["profile_id"]);

      switch (reqParams.type) {
        case "facebook":
          responseData = await FacebookProfileFeedService.getTopPosts(
            req,
            profileID
          );
          break;
        case "instagram":
          responseData = await InstagramProfileFeedService.getTopPosts(
            req,
            profileID
          );
          break;
        default:
        // code block
      }

      return responseHelper(
        true,
        "profile top feeds",
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

  getInteractions: async (req, res, next) => {
    try {
      const reqParams = req.params;
      const queryParams = req.query;
      const { start_date, end_date } = queryParams;
      const startDate = format(new Date(start_date), Enums.DATE_FORMAT);
      const endDate = format(new Date(end_date), Enums.DATE_FORMAT);
      let responseData = {
        datasets: [],
      };

      const profiles = JSON.parse(queryParams.profiles);

      /* Getting graph timeline based on period */
      const dateRanges = await Services.generateGraphTimeline(
        startDate,
        endDate,
        reqParams.period
      );

      switch (reqParams.type) {
        case "facebook":
          responseData =
            await FacebookProfileFeedService.getProfileFeedInteractions(
              req,
              profiles,
              dateRanges
            );
          break;
        case "instagram":
          responseData =
            await InstagramProfileFeedService.getProfileFeedInteractions(
              req,
              profiles,
              dateRanges
            );
          break;
        default:
        // code block
      }

      return responseHelper(
        true,
        "Profile post interactions",
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

  /**
   *  gets the profiles post type distribution
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  getPostsTypeDistributions: async (req, res, next) => {
    try {
      const reqParams = req.params;
      const queryParams = req.query;
      const { start_date, end_date } = queryParams;
      const startDate = format(new Date(start_date), Enums.DATE_FORMAT);
      const endDate = format(new Date(end_date), Enums.DATE_FORMAT);
      let responseData = [];

      /* Getting graph timeline based on period */
      const dateRanges = await Services.generateGraphTimeline(
        startDate,
        endDate,
        reqParams.period
      );

      switch (reqParams.type) {
        case "facebook":
          responseData =
            await FacebookProfileFeedService.getProfilesPostTypeDistributions(
              req,
              reqParams["profile_id"],
              dateRanges
            );
          break;
        case "instagram":
          responseData =
            await InstagramProfileFeedService.getProfilesPostTypeDistributions(
              req,
              reqParams["profile_id"],
              dateRanges
            );
          break;
        default:
        // code block
      }

      return responseHelper(
        true,
        "Profile post type breakdown",
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

  // get profiles follower growth chart data based on time_filter = last7days,today etc basis
  getProfileFollowersGrowth: async (req, res, next) => {
    try {
      const { authUser } = req.user;
      const reqParams = req.params;
      const queryParams = req.query;
      const { start_date, end_date } = queryParams;
      const startDate = format(new Date(start_date), Enums.DATE_FORMAT);
      const endDate = format(new Date(end_date), Enums.DATE_FORMAT);
      const socialMediaType = reqParams.type;
      let responseData = {};

      const profiles = JSON.parse(queryParams.profiles);

      /* checking requsted profiles are in customer subdomain profiles */
      const socialProfiles =
        await mysqlModels.CustomerSubdomainSocialMediaProfile.findAll({
          where: {
            subdomain_id: authUser.subdomain_id,
            social_media_type: socialMediaType,
            profile_id: {
              [Op.in]: profiles,
            },
          },
        });

      /* Returning when no profiles are in subdomina*/
      if (socialProfiles.length == 0) {
        return responseHelper(
          true,
          "Profiles followers growths",
          200,
          "",
          responseData,
          res
        );
      }

      /* Getting graph timeline based on period */
      const dateRanges = await Services.generateGraphTimeline(
        startDate,
        endDate,
        reqParams.period
      );

      /* Getting data based on social medai platform*/
      switch (reqParams.type) {
        case "facebook":
          responseData =
            await FacebookProfileFeedService.getProfilesFollowerGrowths(
              req,
              socialProfiles,
              dateRanges
            );
          break;
        case "instagram":
          responseData =
            await InstagramProfileFeedService.getProfilesFollowerGrowths(
              req,
              socialProfiles,
              dateRanges
            );
          break;
        default:
        // code block
      }

      return responseHelper(
        true,
        "Profiles followers growths",
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

  getProfileFollowersAbsoluteGrowth: async (req, res, next) => {
    try {
      const { authUser } = req.user;
      const reqParams = req.params;
      const queryParams = req.query;
      const { start_date, end_date } = queryParams;
      const startDate = format(new Date(start_date), Enums.DATE_FORMAT);
      const endDate = format(new Date(end_date), Enums.DATE_FORMAT);
      const socialMediaType = reqParams.type;
      const profileId = reqParams.id;
      let responseData = {};

      console.log(profileId);

      /* checking requsted profiles are in customer subdomain profiles */
      const socialProfile =
        await mysqlModels.CustomerSubdomainSocialMediaProfile.findOne({
          where: {
            subdomain_id: authUser.subdomain_id,
            social_media_type: socialMediaType,
            profile_id: profileId,
          },
        });

      /* Returning when no profiles are in subdomina*/
      if (!socialProfile) {
        return responseHelper(
          true,
          "Profiles followers growths",
          200,
          "",
          responseData,
          res
        );
      }

      /* Getting graph timeline based on period */
      const dateRanges = await Services.getGrowthComparisonDateRange(
        startDate,
        endDate
      );

      /* Getting data based on social medai platform*/
      switch (reqParams.type) {
        case "facebook":
          responseData =
            await FacebookProfileFeedService.getProfileFanCountAbsoluteGrowth(
              req,
              socialProfile,
              dateRanges
            );
          break;
        case "instagram":
          responseData =
            await InstagramProfileFeedService.getProfileFanCountAbsoluteGrowth(
              req,
              socialProfile,
              dateRanges
            );
          // responseData = [];
          break;
        default:
        // code block
      }

      return responseHelper(
        true,
        "Profile followers absolute growth",
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

  // here ref
  getProfileInteractionAbsoluteGrowth: async (req, res, next) => {
    try {
      const { authUser } = req.user;
      const reqParams = req.params;
      const queryParams = req.query;
      const { start_date, end_date } = queryParams;
      const startDate = format(new Date(start_date), Enums.DATE_FORMAT);
      const endDate = format(new Date(end_date), Enums.DATE_FORMAT);
      const socialMediaType = reqParams.type;
      const profileId = reqParams.id;
      let responseData = {};

      console.log(profileId);

      /* checking requsted profiles are in customer subdomain profiles */
      const socialProfile =
        await mysqlModels.CustomerSubdomainSocialMediaProfile.findOne({
          where: {
            subdomain_id: authUser.subdomain_id,
            social_media_type: socialMediaType,
            profile_id: profileId,
          },
        });

      /* Returning when no profiles are in subdomina*/
      if (!socialProfile) {
        return responseHelper(
          true,
          "Profile interaction growth",
          200,
          "",
          responseData,
          res
        );
      }

      /* Getting graph timeline based on period */
      const dateRanges = await Services.getGrowthComparisonDateRange(
        startDate,
        endDate
      );

      /* Getting data based on social medai platform*/
      switch (reqParams.type) {
        case "facebook":
          responseData =
            await FacebookProfileFeedService.getFeedInteractionsAbsoluteGrowth(
              req,
              socialProfile,
              dateRanges
            );
          break;
        case "instagram":
          responseData =
            await InstagramProfileFeedService.getFeedInteractionsAbsoluteGrowth(
              req,
              socialProfile,
              dateRanges
            );
          // responseData = [];
          break;
        default:
        // code block
      }

      return responseHelper(
        true,
        "Profile interaction absolute growth",
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

  /* Comparison page >> Profiles post type distributions */
  getProfilesPostTypeOverview: async (req, res, next) => {
    try {
      const { authUser } = req.user;
      const queryParams = req.query;
      const reqParams = req.params;
      const socialMediaType = reqParams.type;

      const profiles = JSON.parse(queryParams.profiles);

      /* Getting selected social profies */
      const socialProfiles = await mongooseModels.SocialMediaProfile.find({
        social_page_id: { $in: profiles },
        social_type: socialMediaType,
      });

      /* Fetching data */
      switch (socialMediaType) {
        case "facebook":
          responseData =
            await FacebookProfileFeedService.getProfilesPostTypeOverview(
              req,
              socialProfiles
            );
          break;
        case "instagram":
          responseData =
            await InstagramProfileFeedService.getProfilesPostTypeOverview(
              req,
              socialProfiles
            );
          break;
        default:
        // code block
      }

      return responseHelper(
        true,
        "Profiles post type distributions",
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

  /* Comparison page >> Get social profiles post type interaction distributions */
  getInteractionDistributions: async (req, res, next) => {
    try {
      const reqParams = req.params;
      const socialMediaType = reqParams.type;
      const queryParams = req.query;
      const profileIds = JSON.parse(queryParams.profiles);

      // /* Fetching data */
      switch (socialMediaType) {
        case "facebook":
          responseData =
            await FacebookProfileFeedService.getFeedInteractionsDistributions(
              req,
              profileIds
            );
          break;
        case "instagram":
          responseData =
            await InstagramProfileFeedService.getFeedInteractionsDistributions(
              req,
              profileIds
            );
          break;
        default:
        // code block
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
  /** Update Social Profile Color */
  updateProfileColor: async (req, res, next) => {
    try {
      const reqParams = req.params;
      const socialMediaType = reqParams.type;
      const profileId = reqParams.id;
      const { color } = req.body;

      switch (socialMediaType) {
        case "facebook":
          responseData = await SocialMediaProfileService.updateProfileColor(
            profileId,
            color,
            socialMediaType
          );
          break;
        case "instagram":
          responseData = await SocialMediaProfileService.updateProfileColor(
            profileId,
            color,
            socialMediaType
          );
          break;
      }

      return responseHelper(
        true,
        "Profile Updated",
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

  /**
   * Crawl profile for customer subdomain
   */
  pullProfile: async (req, res, next) => {
    try {
      const reqParams = req.params;
      const socialMediaProfile = reqParams.profile_id;

      // sending profile data to profile updater microservice
      switch (reqParams.type) {
        case "facebook":
          await fbProfileUpdaterClient.post(
            `/profiles/pull/${socialMediaProfile}`
          );
          break;
        case "instagram":
          await instaProfileUpdaterClient.post(
            `/profiles/pull/${socialMediaProfile}`
          );
          break;
      }

      return responseHelper(
        true,
        "Profile updating...",
        Enums.HTTP_OK,
        "",
        {},
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
  /*
   * Removes the profile and everything related to it.
   */
  deleteProfile: async (req, res, next) => {
    try {
      const profileId = req.params.id;
      const profileData = await mongooseModels.SocialMediaProfile.find({
        social_page_id: profileId,
      });
      if (profileData.length == 0) {
        return responseHelper(
          false,
          Enums.SERVER_ERROR,
          Enums.HTTP_SERVER_ERROR,
          "",
          {},
          res
        );
      }
      // Deletes Social Media Profile from MySQL
      await mysqlModels.CustomerSubdomainSocialMediaProfile.destroy({
        where: {
          profile_id: profileId,
        },
      });

      // Deletes Social Media Profile from Mongo
      await mongooseModels.SocialMediaProfile.deleteOne({
        social_page_id: profileId,
      });
      switch (profileData[0].social_type) {
        case "facebook":
          // Deletes All feeds related to the page
          await mongooseModels.FacebookPageFeed.deleteMany({
            profile_id: profileId,
          });
          // Deletes All fan count related to the page
          await mongooseModels.FacebookProfileFanGrowth.deleteMany({
            profile_id: profileId,
          });
          break;

        case "instagram":
          // Deletes All feeds related to the page
          await mongooseModels.InstagramProfileFeed.deleteMany({
            profile_id: profileId,
          });
          // Deletes All fan count related to the page
          await mongooseModels.InstagramProfileFanGrowth.deleteMany({
            profile_id: profileId,
          });
          break;
      }

      return responseHelper(
        true,
        "Profile deleted successfully",
        200,
        "",
        profileData,
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

  /**
   * get profile details and latest posts
   */
  getProfileDetails: async (req, res, next) => {
    try {
      const socialMediaProfile = req.body.page_username;
      const socialType = req.body.social_type;

      const valid_profile = await mongooseModels.SocialMediaProfile.findOne({
        social_type: socialType,
        page_username: socialMediaProfile,
      });

      if (req.body.token !== process.env.MSV_DATA_TOKEN) {
        return responseHelper(
          false,
          "Enter Valid Token",
          Enums.HTTP_BAD_REQUEST,
          Enums.RES_VALIDATION_TYPE,
          {},
          res
        );
      } else if (!valid_profile) {
        return responseHelper(
          false,
          "Enter Valid Profile",
          Enums.HTTP_BAD_REQUEST,
          Enums.RES_VALIDATION_TYPE,
          {},
          res
        );
      }

      switch (socialType) {
        case "facebook":
          responseData = await FacebookProfileFeedService.getProfileDetails(
            req,
            socialMediaProfile
          );
          break;
        case "instagram":
          responseData = await InstagramProfileFeedService.getProfileDetails(
            req,
            socialMediaProfile
          );
          break;
        default:
        // code block
      }

      return responseHelper(
        true,
        "Profile details retrieved successfully",
        Enums.HTTP_OK,
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

  /* content news feed*/
  ...contentNewsFeeds,
};
