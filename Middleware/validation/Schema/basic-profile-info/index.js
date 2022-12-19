const {format} = require('date-fns');
const {Enums} = require('../../../../Utils');

module.exports = {
  getBasicProfileInfo: async (req, res) => {
    const {start_date} = req.query;
    let endDateValRules = 'required';

    if (start_date) {
      const startDate = format(new Date(start_date), Enums.DATE_FORMAT);
      endDateValRules = `${endDateValRules}|after:${startDate}`;
    }

    const valSchema = {
      'start_date': 'required',
      'end_date': endDateValRules,
    };
    return valSchema;
  },
  getProfileDetailsAndPosts: async (req, res) => {
    const valSchema = {
      'token': 'required',
      'social_type': 'required',
      'page_username': 'required',
      'from_date': 'required',
    };
    return valSchema;
  },
};
