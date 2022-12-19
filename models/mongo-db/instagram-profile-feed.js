const mongoose = require('mongoose');
const findOrCreate = require('mongoose-findorcreate');


const instagramProfileFeedSchema = new mongoose.Schema(
    {
      profile_id: {
        type: Number,
        required: true,
      },
      feed_id: {
        type: String,
        required: true,
      },
      feed_link: {
        type: String,
        required: true,
      },
      caption: {
        type: String,
        default: null,
      },
      feed_type: {
        type: String,
        required: true,
      },
      attachment: {
        type: String,
        required: true,
      },
      thumbnail: {
        type: String,
        default: null,
    },
      feed_like_count: {
        type: Number,
        default: 0,
      },
      feed_comment_count: {
        type: Number,
        default: 0,
      },
      feed_created_date: {
        type: String,
        required: true,
      },
    },
    {timestamps: true},
);

/* Plugings configurations */
instagramProfileFeedSchema.plugin(findOrCreate);


const InstagramProfileFeed = mongoose.model('InstagramProfileFeed', instagramProfileFeedSchema);


module.exports = InstagramProfileFeed;
