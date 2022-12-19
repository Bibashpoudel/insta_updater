const mongoose = require('mongoose');
const DateOnly = require('mongoose-dateonly')(mongoose);


const facebookPageFeedSchema = new mongoose.Schema(
    {
      profile_id: {
        type: Number,
        required: true,
      },
      feed_id: {
        type: String,
        required: true,
      },
      feed_type: {
        type: String,
        default: null,
      },
      feed_link: {
        type: String,
        default: null,
      },
      caption: {
        type: String,
        default: null,
      },
      attachment: {
        type: String,
        default: null,
      },
      thumbnail: {
        type: String,
        default: null,
      },
      feed_share_count: {
        type: Number,
        default: 0,
      },
      feed_comment_count: {
        type: Number,
        default: 0,
      },
      feed_like_count: {
        type: Number,
        default: 0,
      },
      feed_love_count: {
        type: Number,
        default: 0,
      },
      feed_haha_count: {
        type: Number,
        default: 0,
      },
      feed_wow_count: {
        type: Number,
        default: 0,
      },
      feed_created_date: {
        type: String,
      },
    },
    {timestamps: true},
);

/* Setting up the virtual attributes */
facebookPageFeedSchema.virtual('interactions_count').
    get(function() {
      return this.feed_share_count + this.feed_comment_count + this.feed_haha_count + this.feed_like_count + this.feed_love_count + this.feed_wow_count;
    });
facebookPageFeedSchema.set('toJSON', {virtuals: true});

const FacebookPageFeed = mongoose.model('FacebookPageFeed', facebookPageFeedSchema);

module.exports = FacebookPageFeed;
