const mongooseModels = require('../../../models/mongo-db').default;
const { format } = require('date-fns');
const { Enums } = require('../../../Utils');
const Services = require('./../../../Controllers/SocialMediaProfiles/Services/index');

module.exports = {
  /*
  * Get profile comments absoluteGrouwth
  */
  getProfileFanCountAbsoluteGrowth: async (req, profiles, dateRanges) => {
    let profileId = profiles.profile_id

    const currentDateRangeFanGrowthResult = await mongooseModels.FacebookProfileFanGrowth.find({ $and: [{ profile_id: profileId, }, { date: { $gte: dateRanges.start } }, { date: { $lte: dateRanges.end } }] }, 'fan_growth');
    const currentDateRangeFanGrowth = currentDateRangeFanGrowthResult.reduce((init, f) => f.fan_growth ? f.fan_growth + init : init, 0);

    const prevDateRangeFanGrowthResult = await mongooseModels.FacebookProfileFanGrowth.find({ $and: [{ profile_id: profileId, }, { date: { $gte: dateRanges.compareGrowthStartDate } }, { date: { $lte: dateRanges.compareGrowthEndDate } }] }, 'fan_growth');
    const prevDateRangeFanGrowth = prevDateRangeFanGrowthResult.reduce((init, f) => f.fan_growth ? f.fan_growth + init : init, 0);

    /* Absolute growth:: ((current - prev) / prev) * 100 */
    const absoluteGrowth = prevDateRangeFanGrowth == 0 ? 0 : ((currentDateRangeFanGrowth - prevDateRangeFanGrowth) / prevDateRangeFanGrowth) * 100;

    return {
      followers_growth: currentDateRangeFanGrowth,
      absolute_growth: absoluteGrowth,
      filter_type: dateRanges.filter_type,
    };
  },
  /**
  * return the profile's fan_count growth
  * @param {*} req
  * @param {*} res
  * @param {*} next
  */
  getProfilesFollowerGrowths: async (req, profiles, dateRanges) => {
    const reqParams = req.params;
    const profileId = profiles.map(p => p.profile_id);

    //fetch all profile details
    const profileDetails = await mongooseModels.SocialMediaProfile.find({
      social_page_id: profileId,
      social_type: "facebook"
    }).exec();

    //fetch all profiles fan growth
    const profileFanGrowthDetail = await Promise.all(profileDetails.map(async (pd, index) => {
      //add day for comparison if period is day
      let fanCountData = [];
      let data = [];
      if (reqParams.period === 'day') {
        const date = new Date(dateRanges[0].start);
        dateRanges.unshift({ start: format(date.setDate(date.getDate() - 1), Enums.DATE_FORMAT), end: format(date.setDate(date.getDate() - 1), Enums.DATE_FORMAT) });

        const fanCountDetails = await Promise.all(dateRanges.map(async dr => getFanGrowthOfProfileForDate(pd.social_page_id, dr.start)));
        fanCountData = fanCountDetails.map(fcd => fcd[0] && fcd[0].fan_count ? fcd[0].fan_count : 0);
        data = fanCountData.map((fd, index) => (index === 0 || fd === 0 || fanCountData[index - 1] === 0) ? 0 : fd - fanCountData[index - 1]);
      } else {
        const fanCountDetails = await Promise.all(dateRanges.map(async dr => {
          const internalDateRange = [];
          const internalDate = new Date(dr.start);
          for (let date = new Date(format(internalDate.setDate(internalDate.getDate() - 1), Enums.DATE_FORMAT)); new Date(date) <= new Date(dr.end); i = format(date.setDate(date.getDate() + 1), Enums.DATE_FORMAT)) {
            internalDateRange.push(format(date.setDate(date.getDate()), Enums.DATE_FORMAT));
          }
          return await Promise.all(internalDateRange.map(idr => getFanGrowthOfProfileForDate(pd.social_page_id, idr)));
        }));

        fanCountData = fanCountDetails.map(fcd => {
          const internalFanCountData = fcd.map(ifcd => ifcd[0] && ifcd[0].fan_count ? ifcd[0].fan_count : 0);
          return internalFanCountData.reduce((init, d, index) => index != 0 ? init + d : init, 0);
        });

        data = fanCountDetails.map(fcd => {
          const internalFanCountData = fcd.map(ifcd => ifcd[0] && ifcd[0].fan_count ? ifcd[0].fan_count : 0);
          const internalData = internalFanCountData.map((ifd, index) => (index === 0 || ifd === 0 || internalFanCountData[index - 1] === 0) ? 0 : ifd - internalFanCountData[index - 1]);

          return internalData.reduce((init, d, index) => index != 0 ? init + d : init, 0);
        });
      }

      return {
        label: pd.page_name,
        data,
        backgroundColor: pd.color,
        fanCountData,
      }
    }));

    return {
      datasets: profileFanGrowthDetail,
      timeline: dateRanges
    }

  },
}

const getFanGrowthOfProfileForDate = (profileId, date) => {
  return mongooseModels.FacebookProfileFanGrowth.aggregate([
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
            $add: [
              '$fan_count',
            ]
          }
        }
      },
    },
  ]);
}