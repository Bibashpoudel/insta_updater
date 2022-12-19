const mongoose = require('mongoose');

const FacebookPageFeed = require('./FacebookPageFeed');
const InstagramProfileFeed = require('./instagram-profile-feed');
const SocialMediaProfile = require('./social-media-profile');
const SocialMediaProfileFeedTypeColor = require('./SocialMediaProfileFeedTypeColor');
const FacebookProfileFanGrowth = require('./facebook-profile-fan-growth');
const InstagramProfileFanGrowth = require('./InstagramProfileFanGrowth');
const SocialFeedTag = require('./SocialFeedTag');
const SocialTag = require('./SocialTag');
const SocialFeedEmoji = require('./SocialFeedEmoji');

/* Configuration deprication warning */
mongoose.set('useFindAndModify', false);

const mongoDbConnect = () => {
  const DATABASE_URL = process.env.MONGO_DB_CONNECTION_URL;

  console.log('DATABASE_URL', DATABASE_URL);
  return mongoose.connect(DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
};
mongoose.set('debug', (collectionName, method, query, doc) => {
  console.log(`${collectionName}.${method}`, JSON.stringify(query), doc);
});


mongoose.connection.on('error', (err) => {
  console.log('err', err);
});

mongoose.connection.on('connected', (err, res) => {
  console.log('mongoose is connected');
});

/* Merging all models into single object */
const models = {
  FacebookProfileFanGrowth,
  FacebookPageFeed,
  InstagramProfileFeed,
  InstagramProfileFanGrowth,
  SocialMediaProfile,
  SocialMediaProfileFeedTypeColor,
  SocialFeedTag,
  SocialFeedEmoji,
  SocialTag
};

module.exports.mongoDbConnect = mongoDbConnect;

exports.default = models;
