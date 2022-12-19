const mongooseModels = require('../../models/mongo-db').default;
const mysqlModels = require('../../models/mysql').default;
const {Enums} = require('../../Utils');


const getSentimentTypeColor = (sentimentType) => {
  switch (sentimentType) {
    case 'positive':
      return Enums.POSITIVE_SENTIMENT_RGB;
    case 'negative':
      return Enums.NEGATIVE_SENTIMENT_RGB;
    case 'neutral':
      return Enums.NEUTRAL_SENTIMENT_RGB;
    default:
      break;
  }
};

module.exports = {
  getSentiment: async (queries, reqParams, dateRanges) => {
    const responseData = {
      datasets: [],
    };
    responseData['timeline'] = dateRanges;
    const sentimentTypes = await mongooseModels.SocialFeedTag.distinct('sentiment_type');

    for (type of sentimentTypes) {
      const sentimentTypeData = {
        label: type,
        data: [],
        backgroundColor: await getSentimentTypeColor(type),
      };
      for (const dateRange of dateRanges) {
        switch (reqParams.period) {
          case 'day':
            dateRangeQuery = dateRange.start;
            break;
          default:
            dateRangeQuery = {
              $gte: dateRange.start,
              $lte: dateRange.end,
            };
        }


        const sentimentData = await mongooseModels.SocialFeedTag.find({
          'query_tag': {$in: queries},
          'social_type': 'instagram',
          'feed_created_date': dateRangeQuery,
          'sentiment_type': type,
        });

        sentimentTypeData.data.push(sentimentData.length);
      }
      responseData.datasets.push(sentimentTypeData);
    }

    return responseData;
  },

  getTopEmojis: async (queries, dateRange) => {
    const data = await mongooseModels.SocialFeedEmoji.aggregate([
      {$match: {'query_tag': {$in: queries}, 'social_type': 'instagram', 'feed_created_date': {$gte: dateRange.start, $lte: dateRange.end}}},
      {$group: {
        '_id': {
          'emoji': '$emoji',
        },
        'count': {$sum: 1},
      }},
      {$project: {emoji: '$_id.emoji', count: '$count', _id: 0}},
      {'$sort': {'count': -1}},
    ]);

    return data;
  },

  getMentions: async (query, dateRanges) => {
    const data = await mongooseModels.SocialFeedTag.aggregate([
      {$match: {'query_tag': {$in: query}, 'social_type': 'instagram', 'feed_created_date': {$gte: dateRanges.start, $lte: dateRanges.end}}},
      {$project: {mentions: 1}},
      {$unwind: '$mentions'},
    ]);

    return {
      total_mentions_count: data.length,
      filter_type: dateRanges.filter_type,
    };
  },

  getInteractions: async (query, dateRanges) => {
    const data = await mongooseModels.SocialFeedTag.aggregate([
      {$match: {'query_tag': {$in: query}, 'social_type': 'instagram', 'feed_created_date': {$gte: dateRanges.start, $lte: dateRanges.end}}},
      {
        $group: {
          _id: '',
          total_comments: {$sum: '$feed_comment_count'},
          total_likes: {$sum: '$feed_like_count'},
        },
      },
      {$project: {total: {$add: ['$total_comments', '$total_likes']}, _id: 0}},
    ]);

    return {
      total_interactions_count: data[0] ? data[0].total : 0,
      filter_type: dateRanges.filter_type,
    };
  },

  getNoOfPeople: async (query, dateRanges) => {
    const data = await mongooseModels.SocialFeedTag.aggregate([
      {$match: {'query_tag': {$in: query}, 'social_type': 'instagram', 'feed_created_date': {$gte: dateRanges.start, $lte: dateRanges.end}}},
      {$group: {
        _id: '',
        count: {$sum: '$feed_like_count'},
      }},
      {$project: {
        likes: '$count',
        _id: 0,
      }},
    ]);

    const tags = await mongooseModels.SocialTag.findOne({
      query_tag: query
    },'is_downloading');
    return {
      total_people_count: data[0] ? data[0].likes : 0,
      filter_type: dateRanges.filter_type,
      is_downloading: tags.is_downloading
    };
  },

  getPotentialImpressions: async (query, dateRange) => {
    console.log('yes');
    return;
  },
};
