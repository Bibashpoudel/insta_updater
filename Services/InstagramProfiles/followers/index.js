const mongooseModels = require('../../../models/mongo-db').default;
const { format } = require('date-fns');
const { Enums } = require('../../../Utils');
const Services = require('./../../../Controllers/SocialMediaProfiles/Services/index');


module.exports = {

  getProfileFanCountAbsoluteGrowth: async (req, profiles, dateRanges) => {
    let profileId = profiles.profile_id;

    const currentDateRangeFanGrowthResult = await mongooseModels.InstagramProfileFanGrowth.find({ $and: [{ profile_id: profileId, }, { date: { $gte: dateRanges.start } }, { date: { $lte: dateRanges.end } }] }, 'fan_growth');
    const currentDateRangeFanGrowth = currentDateRangeFanGrowthResult.reduce((init, f) => f.fan_growth ? f.fan_growth + init : init, 0);

    const prevDateRangeFanGrowthResult = await mongooseModels.InstagramProfileFanGrowth.find({ $and: [{ profile_id: profileId, }, { date: { $gte: dateRanges.compareGrowthStartDate } }, { date: { $lte: dateRanges.compareGrowthEndDate } }] }, 'fan_growth');
    const prevDateRangeFanGrowth = prevDateRangeFanGrowthResult.reduce((init, f) => f.fan_growth ? f.fan_growth + init : init, 0);

    /* Absolute growth:: ((current - prev) / prev) * 100 */
    const absoluteGrowth = prevDateRangeFanGrowth == 0 ? 0 : ((currentDateRangeFanGrowth - prevDateRangeFanGrowth) / prevDateRangeFanGrowth) * 100;

    return {
      followers_growth: currentDateRangeFanGrowth,
      absolute_growth: absoluteGrowth,
      filter_type: dateRanges.filter_type,
    };
  },
};