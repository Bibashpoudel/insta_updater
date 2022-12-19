const mysqlModels = require('../../../models/mysql').default;
const mongooseModels = require('../../../models/mongo-db').default
const Sequelize = require('sequelize');
const randomColor = require('randomcolor');
const { addDays, format, endOfWeek, endOfMonth, differenceInCalendarDays, sub } = require('date-fns');
const { Enums } = require('../../../Utils')

module.exports = {
  getProfileAtrributesCount: async (profileID, SocialMediaType) => {
    const data = await mysqlModels.SocialMediaProfile.findOne({
      attributes: {
        exclude: ['id', 'social_type', 'page_name', 'page_picture', 'page_username', 'page_fan_count', 'social_page_id', 'created_at', 'updated_at'],
        include: [
          [Sequelize.literal('COUNT(profile_feeds.id)'), 'page_posts_count'],
          [Sequelize.literal(`SUM(profile_feeds.feed_share_count)`), `page_shares_count`],
          [Sequelize.literal(`SUM(profile_feeds.feed_comment_count)`), `page_comments_count`],
        ],
      },
      where: {
        social_type: SocialMediaType,
        id: profileID,
      },
      include: [{
        model: mysqlModels.FacebookPageFeed,
        as: 'profile_feeds',
        attributes: [],

      }],
      group: ['profile_feeds.profile_id'],

    });
    const defaultData = {};
    defaultData['page_posts_count'] = 0;
    defaultData['page_comments_count'] = 0;
    defaultData['page_shares_count'] = 0;

    return data ? JSON.parse(JSON.stringify(data)) : defaultData;
  },
  generateGraphTimeline: async (startDate, endDate, period) => {
    let dateRanges = [];
    switch (period) {
      case 'day':
        dateRanges = await module.exports.generateGraphTimelineByDays(startDate, endDate);
        break;
      case 'week':
        dateRanges = await module.exports.generateGraphTimelineByWeeks(startDate, endDate);
        break;
      case 'month':
        dateRanges = await module.exports.generateGraphTimelineByMonths(startDate, endDate);
        break;
      default:
      // code block
    }

    return dateRanges;
  },
  generateGraphTimelineByDays: async (startDate, endDate) => {
    startDate = format(new Date(startDate), Enums.DATE_FORMAT); endDate = format(new Date(endDate), Enums.DATE_FORMAT); const dates = [];

    while (startDate <= endDate) {

      dates.push(
        { start: startDate, end: startDate },
      );

      let nextDayDate = addDays(new Date(startDate), 1);

      startDate = format(new Date(nextDayDate), Enums.DATE_FORMAT);
    }

    return dates;
  },
  generateGraphTimelineByWeeks: async (startDate, endDate) => {
    startDate = format(new Date(startDate), Enums.DATE_FORMAT); endDate = format(new Date(endDate), Enums.DATE_FORMAT); const dates = [];

    while (startDate <= endDate) {
      const endDateOfWeek = format(endOfWeek(new Date(startDate)), Enums.DATE_FORMAT);
      const end = endDateOfWeek > endDate ? endDate : endDateOfWeek;


      dates.push(
        { start: startDate, end: end },
      );

      /* Setting start date of next week */
      let nextStartDate = addDays(new Date(end), 1);

      startDate = format(new Date(nextStartDate), Enums.DATE_FORMAT);
    }

    return dates;
  },
  generateGraphTimelineByMonths: async (startDate, endDate) => {
    startDate = format(new Date(startDate), Enums.DATE_FORMAT); endDate = format(new Date(endDate), Enums.DATE_FORMAT); const dates = [];


    while (startDate <= endDate) {
      const endDateOfMonth = format(endOfMonth(new Date(startDate)), Enums.DATE_FORMAT);
      const end = endDateOfMonth > endDate ? endDate : endDateOfMonth;

      dates.push(
        { start: startDate, end: end },
      );

      /* Setting start date of next month */
      let nextStartDate = addDays(new Date(end), 1);

      startDate = format(new Date(nextStartDate), Enums.DATE_FORMAT);
    }

    return dates;
  },
  getGrowthComparisonDateRange: async (startDate, endDate) => {
    const start = format(new Date(startDate), Enums.DATE_FORMAT);;
    const end = format(new Date(endDate), Enums.DATE_FORMAT);
    const today = format(new Date(), Enums.DATE_FORMAT);
    let filter_type = '';

    /* get the diff of start date and enddate*/
    const dateRangeDiff = differenceInCalendarDays(new Date(end), new Date(start));

    const compareGrowthStartDate = format(sub(new Date(startDate), { days: (dateRangeDiff > 0 ? dateRangeDiff + 1 : 1) }), Enums.DATE_FORMAT)

    const compareGrowthEndDate = format(sub(new Date(startDate), { days: 1 }), Enums.DATE_FORMAT)

    /* Filter date text*/
    if (today == end) {
      if (start == end) {
        filter_type = `As of today`;
      } else {
        filter_type = `Last ${dateRangeDiff} days`;
      }
    } else {
      filter_type = `Last ${dateRangeDiff} days`;
    }


    return { start, end, compareGrowthStartDate, compareGrowthEndDate, filter_type };
  },
  generateProfilesUniqueColor: async (SocialMediaType) => {
    const profileColor = randomColor({
      format: 'rgba',
      alpha: 1,
    });

    /* Checking if generated hex color already assigned to a profile */
    console.log('mongooseModels', mongooseModels.SocialMediaProfile);
    const profileColorExists = await mongooseModels.SocialMediaProfile.findOne({
      where: {
        color: profileColor,
        social_type: SocialMediaType,
      },
    });

    /* generating another color when color alredy assigned to a profile */
    if (profileColorExists) {
      module.exports.generateProfilesUniqueColor(SocialMediaType);
    }

    return profileColor;
  },
  generateSocialProfileFeedTypeUniqueColor: async (SocialMediaType) => {
    const feedTypeColor = randomColor({
      format: 'rgba',
      alpha: 1,
    });

    const feedTypeColorTaken = await mysqlModels.SocialMediaProfileFeedTypeColor.findOne({
      where: {
        social_type: SocialMediaType,
        color: feedTypeColor,
      },
    });

    /* calling itself to generate color when color taken*/
    if (feedTypeColorTaken) {
      module.exports.generateSocialProfileFeedTypeUniqueColor(SocialMediaType);
    }

    return feedTypeColor;
  },
  storeFeedTypeUniqueColor: async (SocialMediaType, feedType) => {
    /* checking feedType color already has */
    const hasFeedTypeColor = await mysqlModels.SocialMediaProfileFeedTypeColor.findOne({
      where: {
        social_type: SocialMediaType,
        feed_type: feedType,
      },
    });

    if (hasFeedTypeColor) {
      return;
    }
    /* Creating color for new feed type */
    const feedTypeColor = await module.exports.generateSocialProfileFeedTypeUniqueColor(SocialMediaType);

    /* Storing feed color */
    await mysqlModels.SocialMediaProfileFeedTypeColor.create({
      social_type: SocialMediaType,
      feed_type: feedType,
      color: feedTypeColor,
    });
  },
};
