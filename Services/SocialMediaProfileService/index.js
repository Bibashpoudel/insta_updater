const mongooseModels = require('../../models/mongo-db').default;
const randomColor = require('randomcolor');

module.exports = {
  /*
  * Get profile info
  */
  getProfileInfo: async (socialMediaType, profileId, startDate, endDate) => {
    const profile = await mongooseModels.SocialMediaProfile.findOne({
      social_page_id: profileId,
      social_type: socialMediaType,
    }).exec();

    let totalPostCount = {};
    switch (socialMediaType) {
      case 'facebook':
        totalPostCount = await mongooseModels.FacebookPageFeed.countDocuments({ feed_created_date: { $gte: startDate, $lte: endDate }, profile_id: profileId });
        break;
      case 'instagram':
        totalPostCount = await mongooseModels.InstagramProfileFeed.countDocuments({ feed_created_date: { $gte: startDate, $lte: endDate }, profile_id: profileId });
        break;
      default:
        break;
    }

    const profileUrl = socialMediaType == 'facebook' ? `https://www.facebook.com/${profile.page_username}` : `https://www.instagram.com/${profile.page_username}`

    return {
      page_name: profile.page_name,
      page_picture: profile.page_picture,
      page_fan_count: profile.page_fan_count,
      page_following: profile.page_follows_count,
      total_feeds_count: totalPostCount,
      page_url: profileUrl
    };
  },
  generateSocialProfileFeedTypeUniqueColor: async (SocialMediaType) => {
    const feedTypeColor = randomColor({
      format: 'rgba',
      alpha: 1,
    });

    const feedTypeColorTaken = await mongooseModels.SocialMediaProfileFeedTypeColor.findOne({
      social_type: SocialMediaType,
      color: feedTypeColor,
    }).exec();

    /* calling itself to generate color when color taken*/
    if (feedTypeColorTaken) {
      module.exports.generateSocialProfileFeedTypeUniqueColor(SocialMediaType);
    }

    return feedTypeColor;
  },
  storeFeedTypeUniqueColor: async (SocialMediaType, feedType) => {
    console.log('This need to be called.');
    /* checking feedType color already has */
    const hasFeedTypeColor = await mongooseModels.SocialMediaProfileFeedTypeColor.findOne({
      social_type: SocialMediaType,
      feed_type: feedType,
    }).exec();

    if (hasFeedTypeColor) {
      return;
    }
    /* Creating color for new feed type */
    const feedTypeColor = await module.exports.generateSocialProfileFeedTypeUniqueColor(SocialMediaType);

    /* Storing feed color */
    await mongooseModels.SocialMediaProfileFeedTypeColor.create({
      social_type: SocialMediaType,
      feed_type: feedType,
      color: feedTypeColor,
    });
  },


  /**
   * Update Social Profile Color
   * @param {string} profileId
   * @param {string} color
   * @param {string} socialType
   * @returns {mongooseModels.SocialMediaProfile}
   */
  updateProfileColor: async (profileId, color, socialType) => {
    const profile = await mongooseModels.SocialMediaProfile.findOneAndUpdate({ social_page_id: profileId, social_type: socialType }, { color: color });
    return profile;
  },
};
