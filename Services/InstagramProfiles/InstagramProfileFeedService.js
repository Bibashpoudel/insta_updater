const mongooseModels = require("../../models/mongo-db").default;
const { format } = require("date-fns");
const { Enums } = require("../../Utils");
const followersServices = require("./followers");

module.exports = {
  /**
    /* Comparison page >>  Feed interaction distributions*/
  getFeedInteractionsDistributions: async (req, profileIds) => {
    const queryParams = req.query;
    const { start_date, end_date } = queryParams;

    const startDate = format(new Date(start_date), Enums.DATE_FORMAT);
    const endDate = format(new Date(end_date), Enums.DATE_FORMAT);

    const result = await mongooseModels.SocialMediaProfile.aggregate([
      {
        $match: {
          social_page_id: {
            $in: profileIds,
          },
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
                total_reactions: "$feed_like_count",
              },
            },
          ],
          as: "profile_feeds",
        },
      },
      {
        $project: {
          id: "$social_page_id",
          page_name: "$page_name",
          page_picture: "$page_picture",
          total_comments: { $sum: "$profile_feeds.feed_comment_count" },
          total_reactions: { $sum: "$profile_feeds.total_reactions" },
        },
      },
    ]);

    return result;
  },
  /**
   * return the profile's posts type distributions
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  getProfileFeedInteractions: async (req, profiles, dateRanges) => {
    const reqParams = req.params;
    const queryParams = req.query;
    const responseData = {
      datasets: [],
    };

    /* Setting timeline for graph data */
    responseData["timeline"] = dateRanges;

    for (const profileID of profiles) {
      const profile = await mongooseModels.SocialMediaProfile.findOne({
        social_page_id: profileID,
        social_type: "instagram",
      }).exec();

      /* Skipping to next iteration when profiles not found*/
      if (!profile) {
        continue;
      }

      /* settings profiles data */
      const profileData = {
        label: profile.page_name,
        data: [],
        backgroundColor: profile.color,
      };

      /* Geting the data for each date range*/
      for (const dateRange of dateRanges) {
        let dateRangeQuery = "";

        /* Creating date matching query based on period*/
        switch (reqParams.period) {
          case "day":
            dateRangeQuery = dateRange.start;
            break;
          default:
            dateRangeQuery = {
              $gte: dateRange.start,
              $lte: dateRange.end,
            };
        }

        /* Getting the sum of interactions of each post like share, comment, like etc.*/
        const profileFeedInteractionResult =
          await mongooseModels.InstagramProfileFeed.aggregate([
            {
              $match: {
                profile_id: profileID,
                feed_created_date: dateRangeQuery,
              },
            },
            {
              $group: {
                _id: null,
                total_interactions_count: {
                  $sum: {
                    $add: ["$feed_comment_count", "$feed_like_count"],
                  },
                },
              },
            },
          ]);

        const profileFeedInteractionsCount = profileFeedInteractionResult.length
          ? profileFeedInteractionResult[0]["total_interactions_count"]
            ? profileFeedInteractionResult[0]["total_interactions_count"]
            : 0
          : 0;

        /* Interactions per 1k fans*/
        if (queryParams.per_1k_fans == "true") {
          const avgInteractionPer1kFans =
            (profileFeedInteractionsCount / profile.page_fan_count) * 1000;

          profileData.data.push(avgInteractionPer1kFans.toFixed(2));
        } else {
          profileData.data.push(profileFeedInteractionsCount);
        }
      }

      /* Setting profile profile date */
      responseData.datasets.push(profileData);
    }

    return responseData;
  },

  /*
   * Get profile comments absoluteGrouwth
   */
  getProfileFeedCommentsAbsoluteGrowth: async (req, profileId, dateRanges) => {
    profileId = JSON.parse(profileId);

    /* Getting the current value */
    const currentTotalCommentCountResult =
      await mongooseModels.InstagramProfileFeed.aggregate([
        {
          $match: {
            profile_id: profileId,
            feed_created_date: {
              $gte: dateRanges.start,
              $lte: dateRanges.end,
            },
          },
        },
        {
          $group: {
            _id: null,
            feed_comment_count: { $sum: "$feed_comment_count" },
          },
        },
      ]);

    const currentTotalCommentCount = currentTotalCommentCountResult.length
      ? currentTotalCommentCountResult[0]["feed_comment_count"]
        ? currentTotalCommentCountResult[0]["feed_comment_count"]
        : 0
      : 0;

    /* Querying for preving compare value */
    const prevTotalCommentCountResult =
      await mongooseModels.InstagramProfileFeed.aggregate([
        {
          $match: {
            profile_id: profileId,
            feed_created_date: {
              $gte: dateRanges.compareGrowthStartDate,
              $lte: dateRanges.compareGrowthEndDate,
            },
          },
        },
        {
          $group: {
            _id: null,
            feed_comment_count: { $sum: "$feed_comment_count" },
          },
        },
      ]);

    const prevTotalCommentCount = prevTotalCommentCountResult.length
      ? prevTotalCommentCountResult[0]["feed_comment_count"]
        ? prevTotalCommentCountResult[0]["feed_comment_count"]
        : 0
      : 0;

    /* Absolute growth:: ((current - prev) / prev) * 100 */
    const absoluteGrowth =
      ((currentTotalCommentCount - prevTotalCommentCount) /
        prevTotalCommentCount) *
      100;

    return {
      total_comments_count: currentTotalCommentCount,
      growth: absoluteGrowth,
      filter_type: dateRanges.filter_type,
    };
  },

  /*
   * Get profile likes absolute growth
   */
  getProfileFeedLikesAbsoluteGrowth: async (req, profileId, dateRanges) => {
    profileId = JSON.parse(profileId);

    const currentTotalLikeCountResult =
      await mongooseModels.InstagramProfileFeed.aggregate([
        {
          $match: {
            profile_id: profileId,
            feed_created_date: {
              $gte: dateRanges.start,
              $lte: dateRanges.end,
            },
          },
        },
        {
          $group: { _id: null, feed_like_count: { $sum: "$feed_like_count" } },
        },
      ]);

    const currentTotalLikeCount = currentTotalLikeCountResult.length
      ? currentTotalLikeCountResult[0]["feed_like_count"]
        ? currentTotalLikeCountResult[0]["feed_like_count"]
        : 0
      : 0;

    /* Querying for preving compare value */
    const prevTotalLikeCountResult =
      await mongooseModels.InstagramProfileFeed.aggregate([
        {
          $match: {
            profile_id: profileId,
            feed_created_date: {
              $gte: dateRanges.compareGrowthStartDate,
              $lte: dateRanges.compareGrowthEndDate,
            },
          },
        },
        {
          $group: { _id: null, feed_like_count: { $sum: "$feed_like_count" } },
        },
      ]);

    const prevTotalLikeCount = prevTotalLikeCountResult.length
      ? prevTotalLikeCountResult[0]["feed_like_count"]
        ? prevTotalLikeCountResult[0]["feed_like_count"]
        : 0
      : 0;

    /* Absolute growth:: ((current - prev) / prev) * 100 */
    const absoluteGrowth =
      ((currentTotalLikeCount - prevTotalLikeCount) / prevTotalLikeCount) * 100;

    return {
      total_likes_count: currentTotalLikeCount,
      growth: absoluteGrowth,
      filter_type: dateRanges.filter_type,
    };
  },

  getFeedInteractionsAbsoluteGrowth: async (req, profile, dateRanges) => {
    const profileId = profile.profile_id;

    const currentTotalReactionCountResult =
      await mongooseModels.InstagramProfileFeed.aggregate([
        {
          $match: {
            profile_id: profileId,
            feed_created_date: {
              $gte: dateRanges.start,
              $lte: dateRanges.end,
            },
          },
        },
        {
          $group: {
            _id: null,
            feed_like_count: { $sum: "$feed_like_count" },
            feed_comment_count: { $sum: "$feed_comment_count" },
          },
        },
        {
          $project: {
            currentInteraction: {
              $sum: ["$feed_like_count", "$feed_comment_count"],
            },
          },
        },
      ]);

    const currentTotalInteractionCount = currentTotalReactionCountResult.length
      ? currentTotalReactionCountResult[0]["currentInteraction"]
        ? currentTotalReactionCountResult[0]["currentInteraction"]
        : 0
      : 0;

    /* Querying for preving compare value */
    const prevTotalInteractionCountResult =
      await mongooseModels.InstagramProfileFeed.aggregate([
        {
          $match: {
            profile_id: profileId,
            feed_created_date: {
              $gte: dateRanges.compareGrowthStartDate,
              $lte: dateRanges.compareGrowthEndDate,
            },
          },
        },
        {
          $group: {
            _id: null,
            feed_like_count: { $sum: "$feed_like_count" },
            feed_comment_count: { $sum: "$feed_comment_count" },
          },
        },
        {
          $project: {
            prevInteractionCount: {
              $sum: ["$feed_like_count", "$feed_comment_count"],
            },
          },
        },
      ]);

    const prevTotalInteractionCount = prevTotalInteractionCountResult.length
      ? prevTotalInteractionCountResult[0]["prevInteractionCount"]
        ? prevTotalInteractionCountResult[0]["prevInteractionCount"]
        : 0
      : 0;

    /* Absolute growth:: ((current - prev) / prev) * 100 */
    const absoluteGrowth =
      prevTotalInteractionCount == 0
        ? 0
        : ((currentTotalInteractionCount - prevTotalInteractionCount) /
            prevTotalInteractionCount) *
          100;

    return {
      total_interaction_count: currentTotalInteractionCount,
      growth: absoluteGrowth,
      filter_type: dateRanges.filter_type,
    };
  },

  /**
   * return the profile's posts type distributions
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  getProfilesPostTypeDistributions: async (req, profileId, dateRanges) => {
    const reqParams = req.params;
    const responseData = {
      datasets: [],
    };

    /* Setting timeline for graph data */
    responseData["timeline"] = dateRanges;

    /* Getting posts types */
    const profileFeedTypes = await mongooseModels.InstagramProfileFeed.distinct(
      "feed_type",
      { profile_id: profileId }
    );

    /* Feed type */
    for (const type of profileFeedTypes) {
      /* fetching feed color */
      const feedTypeColor =
        await mongooseModels.SocialMediaProfileFeedTypeColor.findOne({
          social_type: "instagram",
          feed_type: type,
        }).exec();

      const bgColor = feedTypeColor ? feedTypeColor.color : "";
      const feedTypeData = {
        label: type,
        data: [],
        backgroundColor: bgColor,
      };

      /* Geting the data for each date range*/
      for (const dateRange of dateRanges) {
        let dateRangeQuery = "";

        /* Creating date matching query based on period*/
        switch (reqParams.period) {
          case "day":
            dateRangeQuery = dateRange.start;
            break;
          default:
            dateRangeQuery = {
              $gte: dateRange.start,
              $lte: dateRange.end,
            };
        }

        /* Profile data on each date */
        const profileFeeds = await mongooseModels.InstagramProfileFeed.find({
          profile_id: profileId,
          feed_type: type,
          feed_created_date: dateRangeQuery,
        });

        feedTypeData.data.push(profileFeeds.length);
      }

      responseData.datasets.push(feedTypeData);
    }

    return responseData;
  },

  /* Comparison page >> Profiles posts type overview */
  getProfilesPostTypeOverview: async (req, socialProfiles) => {
    const queryParams = req.query;
    const { start_date, end_date } = queryParams;
    const startDate = format(new Date(start_date), Enums.DATE_FORMAT);
    const endDate = format(new Date(end_date), Enums.DATE_FORMAT);

    /* Getting profile ids */
    const profileIds = socialProfiles.map((a) => a.social_page_id);

    /* Getting posts types */
    const profileFeedTypes = await mongooseModels.InstagramProfileFeed.find({
      profile_id: { $in: profileIds },
    }).distinct("feed_type");

    const labels = profileFeedTypes;

    const responseData = {
      datasets: [],
      labels: labels,
    };

    /* setting datasets for each profiles*/
    for (const key in socialProfiles) {
      if (Object.hasOwnProperty.call(socialProfiles, key)) {
        const socialProfile = socialProfiles[key];

        const socialProfileData = {
          label: socialProfile.page_name,
          data: [],
          backgroundColor: socialProfile.color,
        };

        /* Settings the data for each post types*/
        for (const key in labels) {
          if (Object.hasOwnProperty.call(labels, key)) {
            const profileFeedType = labels[key];

            /* getting profiles post type total */
            const posts = await mongooseModels.InstagramProfileFeed.find({
              profile_id: socialProfile.id,
              feed_type: profileFeedType,
              feed_created_date: {
                $gte: startDate,
                $lte: endDate,
              },
            });

            socialProfileData.data.push(posts.length);
          }
        }

        /* Setting datasets for each profiles*/
        responseData.datasets.push(socialProfileData);
      }
    }

    return responseData;
  },

  /**
   * Get top posts based on interactions
   */
  getTopPosts: async (req, profileId) => {
    const queryParams = req.query;
    const { start_date, end_date, feed_types, page, page_limit } = queryParams;
    const startDate = format(new Date(start_date), Enums.DATE_FORMAT);
    const endDate = format(new Date(end_date), Enums.DATE_FORMAT);
    const pageOptions = {
      page: parseInt(page) || 1,
      limit: parseInt(page_limit) || 5,
    };

    const feedTypesQuery = feed_types ? feed_types.split(",") : [];

    const filter = {
      profile_id: profileId,
      feed_created_date: { $gte: startDate, $lte: endDate },
    };

    /* Appending feed type query */
    if (feedTypesQuery.length > 0) {
      filter["feed_type"] = { $in: feedTypesQuery };
    }

    const offset =
      pageOptions.page > 0 ? (pageOptions.page - 1) * pageOptions.limit : 0;
    const feedCount = await mongooseModels.InstagramProfileFeed.find(
      filter
    ).countDocuments();

    const feeds = await mongooseModels.InstagramProfileFeed.aggregate([
      {
        $match: filter,
      },
      {
        $lookup: {
          from: "socialmediaprofiles",
          localField: "profile_id",
          foreignField: "social_page_id",
          as: "profile_info",
        },
      },
      {
        $project: {
          profile_id: "$profile_id",
          feed_id: "$feed_id",
          feed_type: "$feed_type",
          feed_link: "$feed_link",
          attachment: "$attachment",
          thumbnail: "$thumbnail",
          caption: "$caption",
          feed_created_date: "$feed_created_date",
          feed_created_date_utc: "$feed_created_date_utc",
          feed_comment_count: "$feed_comment_count",
          feed_like_count: "$feed_like_count",
          total_engagement: {
            $sum: {
              $add: ["$feed_comment_count", "$feed_like_count"],
            },
          },
          avg_interaction_per_1k_fans: {
            $multiply: [
              {
                $cond: {
                  if: { $eq: ["$profile_info.page_fan_count", 0] },
                  then: 0,
                  else: {
                    $divide: [
                      {
                        $sum: {
                          $add: ["$feed_comment_count", "$feed_like_count"],
                        },
                      },
                      { $first: "$profile_info.page_fan_count" },
                    ],
                  },
                },
              },
              1000,
            ],
          },
          profile_info: { $first: "$profile_info" },
        },
      },
      { $sort: { total_engagement: -1 } },
      { $skip: offset },
      { $limit: pageOptions.limit },
    ]);

    return {
      feeds: feeds,
      page: pageOptions.page,
      pages: Math.ceil(feedCount / pageOptions.limit),
    };
  },

  getPublicProfileInfo: async (query) => {
    try {
      const filteredProfiles = [];

      console.log("filteredProfiles", filteredProfiles);

      return filteredProfiles;
    } catch (error) {}
  },
  /**
   * return the profile's fan_count growth
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  getProfilesFollowerGrowths: async (req, profiles, dateRanges) => {
    const reqParams = req.params;
    const profileId = profiles.map((p) => p.profile_id);

    // fetch all profile details
    const profileDetails = await mongooseModels.SocialMediaProfile.find({
      social_page_id: profileId,
      social_type: "instagram",
    }).exec();

    // fetch all profiles fan growth
    const profileFanGrowthDetail = await Promise.all(
      profileDetails.map(async (pd, index) => {
        // add day for comparison if period is day
        let fanCountData = [];
        let data = [];
        if (reqParams.period === "day") {
          const date = new Date(dateRanges[0].start);
          dateRanges.unshift({
            start: format(date.setDate(date.getDate() - 1), Enums.DATE_FORMAT),
            end: format(date.setDate(date.getDate() - 1), Enums.DATE_FORMAT),
          });

          const fanCountDetails = await Promise.all(
            dateRanges.map(async (dr) =>
              getFanGrowthOfProfileForDate(pd.social_page_id, dr.start)
            )
          );
          fanCountData = fanCountDetails.map((fcd) =>
            fcd[0] && fcd[0].fan_count ? fcd[0].fan_count : 0
          );
          data = fanCountData.map((fd, index) =>
            index === 0 || fd === 0 || fanCountData[index - 1] === 0
              ? 0
              : fd - fanCountData[index - 1]
          );
        } else {
          const fanCountDetails = await Promise.all(
            dateRanges.map(async (dr) => {
              const internalDateRange = [];
              const internalDate = new Date(dr.start);
              for (
                let date = new Date(
                  format(
                    internalDate.setDate(internalDate.getDate() - 1),
                    Enums.DATE_FORMAT
                  )
                );
                new Date(date) <= new Date(dr.end);
                i = format(date.setDate(date.getDate() + 1), Enums.DATE_FORMAT)
              ) {
                internalDateRange.push(
                  format(date.setDate(date.getDate()), Enums.DATE_FORMAT)
                );
              }
              return await Promise.all(
                internalDateRange.map((idr) =>
                  getFanGrowthOfProfileForDate(pd.social_page_id, idr)
                )
              );
            })
          );

          fanCountData = fanCountDetails.map((fcd) => {
            const internalFanCountData = fcd.map((ifcd) =>
              ifcd[0] && ifcd[0].fan_count ? ifcd[0].fan_count : 0
            );
            return internalFanCountData.reduce(
              (init, d, index) => (index != 0 ? init + d : init),
              0
            );
          });

          data = fanCountDetails.map((fcd) => {
            const internalFanCountData = fcd.map((ifcd) =>
              ifcd[0] && ifcd[0].fan_count ? ifcd[0].fan_count : 0
            );
            const internalData = internalFanCountData.map((ifd, index) =>
              index === 0 || ifd === 0 || internalFanCountData[index - 1] === 0
                ? 0
                : ifd - internalFanCountData[index - 1]
            );

            return internalData.reduce(
              (init, d, index) => (index != 0 ? init + d : init),
              0
            );
          });
        }

        return {
          label: pd.page_name,
          data,
          backgroundColor: pd.color,
          fanCountData,
        };
      })
    );

    return {
      datasets: profileFanGrowthDetail,
      timeline: dateRanges,
    };
  },

  /* Get content news feed*/
  getProfilesContentNewsFeeds: async (req, socialProfiles) => {
    console.log("socilaprofiles333", socialProfiles);
    const profileIds = socialProfiles.map(
      (socialProfile) => socialProfile.profile_id
    );
    console.log("profilesid444", profileIds);
    const queryParams = req.query;
    const {
      start_date,
      end_date,
      feed_types,
      keyword_query,
      page,
      page_limit,
      sort_by,
    } = queryParams;
    const pageOptions = {
      page: parseInt(page) || 1,
      limit: parseInt(page_limit) || 10,
    };

    const feedTypesQuery = feed_types ? feed_types.split(",") : [];
    const keywordQueries = keyword_query ? keyword_query.split(",") : [];

    const startDate = format(new Date(start_date), Enums.DATE_FORMAT);
    const endDate = format(new Date(end_date), Enums.DATE_FORMAT);

    const filter = {
      profile_id: { $in: profileIds },
      feed_created_date: { $gte: startDate, $lte: endDate },
    };

    /* Appending feed type query */
    if (feedTypesQuery.length > 0) {
      filter["feed_type"] = { $in: feedTypesQuery };
    }

    /* add search queries and filter */
    if (keywordQueries.length > 0) {
      const keywordQueriesRegex = [];

      for (const key in keywordQueries) {
        if (Object.hasOwnProperty.call(keywordQueries, key)) {
          const keywordQuery = keywordQueries[key];

          keywordQueriesRegex[key] = new RegExp(keywordQuery);
        }
      }

      filter["caption"] = { $in: keywordQueriesRegex };
    }

    /* Sort feeds by */
    let sortingFilter = { feed_created_date: -1 };

    if (sort_by) {
      switch (sort_by) {
        case "engagement_per_1k_fans":
          sortingFilter = { avg_interaction_per_1k_fans: -1 };
          break;

        case "total_engagement":
          sortingFilter = { total_engagement: -1 };
          break;
        case "feed_comment_count":
          sortingFilter = { feed_comment_count: -1 };
          break;
        case "feed_like_count":
          sortingFilter = { feed_like_count: -1 };
          break;
        default:
          sortingFilter = { feed_created_date: -1 };
          break;
      }
    }

    const offset =
      pageOptions.page > 0 ? (pageOptions.page - 1) * pageOptions.limit : 0;
    const feedCount = await mongooseModels.InstagramProfileFeed.find(
      filter
    ).countDocuments();
    console.log("feedcount", feedCount);
    const totalEngangementQuery = {
      $sum: {
        $add: ["$feed_comment_count", "$feed_like_count"],
      },
    };

    const feeds = await mongooseModels.InstagramProfileFeed.aggregate([
      {
        $match: filter,
      },
      {
        $lookup: {
          from: "socialmediaprofiles",
          localField: "profile_id",
          foreignField: "social_page_id",
          as: "profile_info",
        },
      },
      {
        $project: {
          profile_id: "$profile_id",
          feed_id: "$feed_id",
          feed_type: "$feed_type",
          feed_link: "$feed_link",
          attachment: "$attachment",
          thumbnail: "$thumbnail",
          caption: "$caption",
          feed_created_date: "$feed_created_date",
          feed_created_date_utc: "$feed_created_date_utc",
          feed_comment_count: "$feed_comment_count",
          feed_like_count: "$feed_like_count",
          total_engagement: totalEngangementQuery,
          avg_interaction_per_1k_fans: {
            $multiply: [
              {
                $cond: {
                  if: { $eq: [{ $first: "$profile_info.page_fan_count" }, 0] },
                  then: 0,
                  else: {
                    $divide: [
                      totalEngangementQuery,
                      { $first: "$profile_info.page_fan_count" },
                    ],
                  },
                },
              },
              1000,
            ],
          },
          profile_info: { $first: "$profile_info" },
        },
      },
      { $sort: sortingFilter },
      { $skip: offset },
      { $limit: pageOptions.limit },
    ]);

    return {
      feeds: feeds,
      page: pageOptions.page,
      total: feedCount,
      pages: Math.ceil(feedCount / pageOptions.limit),
    };
  },

  getProfileDetails: async (req, socialMediaProfile) => {
    const result = {};
    const start_date = req.body.from_date;
    const social_page = await mongooseModels.SocialMediaProfile.findOne({
      page_username: socialMediaProfile,
      social_type: "instagram",
    }).populate("feed_details");
    const latest_posts = await mongooseModels.InstagramProfileFeed.find({
      profile_id: social_page.social_page_id,
      feed_created_date: { $gte: start_date },
    }).sort({ feed_created_date: -1 });
    result["social_page_details"] = social_page;
    result["latest_posts"] = latest_posts;

    return result;
  },

  /* profile fan count services*/
  ...followersServices,
};

const getFanGrowthOfProfileForDate = (profileId, date) => {
  return mongooseModels.InstagramProfileFanGrowth.aggregate([
    {
      $match: {
        profile_id: profileId,
        date: date,
      },
    },
    {
      $group: {
        _id: null,
        fan_count: {
          $sum: {
            $add: ["$fan_count"],
          },
        },
      },
    },
  ]);
};
