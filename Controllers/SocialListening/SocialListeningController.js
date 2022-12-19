
const responseHelper = require('../../Helpers/responseHelper');
const {Enums} = require('../../Utils');
const {format} = require('date-fns');
const Services = require('./Services');
const InstagramTagService = require('../../Services/SocialListening/InstagramTagService');

module.exports = {
  getTotalPeople: async (req, res, next) => {
    try {
      const reqParams = req.params;
      const queryParams = req.query;
      const {keyword_query} = req.query;

      const {start_date, end_date} = queryParams;

      const startDate = format(new Date(start_date), Enums.DATE_FORMAT);
      const endDate = format(new Date(end_date), Enums.DATE_FORMAT);
      const queries = keyword_query ? keyword_query.split(',').map((item) => item.trim()) : [];
      const dateRanges = await Services.getDateRange(startDate, endDate);

      let responseData = [];

      switch (reqParams.type) {
        case 'facebook':
          break;
        case 'instagram':
          responseData = await InstagramTagService.getNoOfPeople(queries, dateRanges);
          break;
        default:
          // code block
      }

      return responseHelper(true, Enums.SOCIAL_LISTENING_NO_OF_PEOPLE, 200, '', responseData, res);
    } catch (error) {
      logger.error(error);
    }
  },
  getTotalMentions: async (req, res, next) => {
    try {
      const reqParams = req.params;
      const queryParams = req.query;
      const {keyword_query} = req.query;

      const {start_date, end_date} = queryParams;

      const startDate = format(new Date(start_date), Enums.DATE_FORMAT);
      const endDate = format(new Date(end_date), Enums.DATE_FORMAT);
      const queries = keyword_query ? keyword_query.split(',').map((item) => item.trim()) : [];
      const dateRanges = await Services.getDateRange(startDate, endDate);

      let responseData = [];

      switch (reqParams.type) {
        case 'facebook':
          break;
        case 'instagram':
          responseData = await InstagramTagService.getMentions(queries, dateRanges);
          break;
        default:
          // code block
      }

      return responseHelper(true, Enums.SOCIAL_LISTENING_NO_OF_MENTIONS, 200, '', responseData, res);
    } catch (error) {
      logger.error(error);
    }
  },
  getSocialInteractions: async (req, res, next) => {
    try {
      const reqParams = req.params;
      const queryParams = req.query;
      const {keyword_query} = req.query;

      const {start_date, end_date} = queryParams;

      const startDate = format(new Date(start_date), Enums.DATE_FORMAT);
      const endDate = format(new Date(end_date), Enums.DATE_FORMAT);
      const queries = keyword_query ? keyword_query.split(',').map((item) => item.trim()) : [];
      const dateRanges = await Services.getDateRange(startDate, endDate);

      let responseData = [];

      switch (reqParams.type) {
        case 'facebook':
          break;
        case 'instagram':
          responseData = await InstagramTagService.getInteractions(queries, dateRanges);
          break;
        default:
          // code block
      }

      return responseHelper(true, Enums.SOCIAL_LISTENING_SOCIAL_INTERACTION, 200, '', responseData, res);
    } catch (error) {
      logger.error(error);
    }
  },
  getSentimentData: async (req, res, next) => {
    try {
      const reqParams = req.params;
      const queryParams = req.query;
      const {keyword_query} = req.query;

      const {start_date, end_date} = queryParams;

      const startDate = format(new Date(start_date), Enums.DATE_FORMAT);
      const endDate = format(new Date(end_date), Enums.DATE_FORMAT);
      const queries = keyword_query ? keyword_query.split(',').map((item) => item.trim()) : [];

      let responseData = [];

      /* Getting graph timeline based on period */
      const dateRanges = await Services.generateGraphTimeline(startDate, endDate, reqParams.period);

      switch (reqParams.type) {
        case 'facebook':
          break;
        case 'instagram':
          responseData = await InstagramTagService.getSentiment(queries, reqParams, dateRanges);
          break;
        default:
          // code block
      }

      return responseHelper(true, Enums.SOCIAL_LISTENING_SENTIMENT_IN_TIME, 200, '', responseData, res);
    } catch (error) {
      logger.error(error);
    }
  },
  getTopEmoji: async (req, res, next) => {
    try {
      const reqParams = req.params;
      const queryParams = req.query;
      const {keyword_query} = req.query;

      const {start_date, end_date} = queryParams;

      const startDate = format(new Date(start_date), Enums.DATE_FORMAT);
      const endDate = format(new Date(end_date), Enums.DATE_FORMAT);
      const queries = keyword_query ? keyword_query.split(',').map((item) => item.trim()) : [];
      const dateRanges = await Services.getDateRange(startDate, endDate);

      let responseData = [];

      switch (reqParams.type) {
        case 'facebook':
          break;
        case 'instagram':
          responseData = await InstagramTagService.getTopEmojis(queries, dateRanges);
          break;
        default:
          // code block
      }

      return responseHelper(true, Enums.SOCIAL_LISTENING_TOP_EMOJI, 200, '', responseData, res);
    } catch (error) {
      logger.error(error);
    }
  },
  getPotentialImpression: async (req, res, next) => {
    try {
      const reqParams = req.params;
      const queryParams = req.query;
      const {keyword_query} = req.query;

      const {start_date, end_date} = queryParams;

      const startDate = format(new Date(start_date), Enums.DATE_FORMAT);
      const endDate = format(new Date(end_date), Enums.DATE_FORMAT);
      const queries = keyword_query ? keyword_query.split(',').map((item) => item.trim()) : [];
      const dateRanges = await Services.getDateRange(startDate, endDate);

      const responseData = {
        potential_impression_count: 0,
        filter_type: dateRanges.filter_type,
      };
      return responseHelper(true, Enums.SOCIAL_LISTENING_POTENTIAL_IMPRESSION, 200, '', responseData, res);
    } catch (error) {
      logger.error(error);
    }
  },
};
