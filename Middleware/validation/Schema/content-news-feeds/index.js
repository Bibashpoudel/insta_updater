const { format } = require('date-fns');
const { Enums } = require('../../../../Utils');

module.exports = {
    getProfileNewsFeeds: async (req, res) => {

        const { start_date } = req.query;
        let endDateValRules = 'required'

        if (start_date) {
            const startDate = format(new Date(start_date), Enums.DATE_FORMAT);
            endDateValRules = `${endDateValRules}|after:${startDate}`
        }

        const valSchema = {
            'profiles': 'required',
            'start_date': 'required',
            'end_date': endDateValRules,
            'feed_types': 'nullable',
            'keyword_query': 'nullable',
            'sort_by': 'nullable'
        };

        return valSchema;
    },
}