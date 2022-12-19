const {instaProfileUpdaterClient} = require('../axios-clients');
const mysqlModels = require('../models/mysql').default;


const dateDiff = (date) => {
  const date1 = new Date(date);
  const date2 = new Date();

  // To calculate the time difference of two dates
  const Difference_In_Time = date2.getTime() - date1.getTime();

  // To calculate the no. of days between two dates
  return parseInt(Difference_In_Time / (1000 * 3600 * 24));
};

module.exports = () => async (req, res, next) => {
  console.log('sdasd');
  const {authUser} = req.user;
  const {type} = req.params;
  const {keyword_query} = req.query;

  const queries = keyword_query ? keyword_query.split(',').map((item) => item.trim()) : [];

  for (const key in queries) {
    if (Object.hasOwnProperty.call(queries, key)) {
      const query = queries[key];
      const tag = await mysqlModels.CustomerSubdomainSocialTag.findOne({
        where: {
          subdomain_id: authUser.subdomain_id,
          social_media_type: type,
          query_tag: query,
        },
      });

      let updaterClient = null;

      if (tag) {
        const tagUpdateDays = await dateDiff(tag['updated_at']);

        if (tagUpdateDays >= 1) {
          tag['updated_at'] = new Date();
          tag.save();
          updaterClient = await instaProfileUpdaterClient.get('/social-media/'+ type +'/search-hashtag/' + tag['query_tag']);
        }
      } else {
        await mysqlModels.CustomerSubdomainSocialTag.create({
          subdomain_id: authUser.subdomain_id,
          social_media_type: type,
          query_tag: query,
        });
        updaterClient = await instaProfileUpdaterClient.get('/social-media/'+ type +'/search-hashtag/' + query);
      }
    }
  }
  next();
};
