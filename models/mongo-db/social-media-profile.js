const mongoose = require('mongoose');

const FacebookPageFeed = require('./FacebookPageFeed');
const InstagramProfileFeed = require('./instagram-profile-feed');


const socialMediaProfileSchema = new mongoose.Schema({
  social_type: {
    type: String,
    required: true,
  },
  social_page_id: {
    type: Number,
    required: true,
  },
  page_name: {
    type: String,
  },
  page_username: {
    type: String,
  },
  page_picture: {
    type: String,
  },
  page_posts_count: {
    type: Number,
    default: 0,
  },
  page_shares_count: {
    type: Number,
    default: 0,
  },
  page_comments_count: {
    type: Number,
    default: 0,
  },
  page_fan_count: {
    type: Number,
    default: 0,
  },
  page_follows_count: {
    type: Number,
    default: 0,
  },
  color: {
    type: String,
  },
  is_data_downloading: {
    type: Boolean,
    default: true,
  }
},
  {
    timestamps: true,
  },
)
  ;


/* Setting up the virtual attributes */
socialMediaProfileSchema.virtual('id').
  get(function () {
    return this.social_page_id;
  });


/* Vertiual methods */
socialMediaProfileSchema.method('getPostCount', async function (cb) {
  let totalPosts = 0;
  switch (this.social_type) {
    case 'facebook':
      totalPosts = await FacebookPageFeed.where('profile_id', this.social_page_id).countDocuments().exec();
      break;
    case 'instagram':
      totalPosts = await InstagramProfileFeed.where('profile_id', this.social_page_id).countDocuments().exec();
      break;
    default:
  }

  return totalPosts;
});


socialMediaProfileSchema.method('getShareAndCommentCount', async function (cb) {
  const output = {
    page_comments_count: 0,
    page_shares_count: 0,
  };


  switch (this.social_type) {
    case 'facebook':
      const result = await FacebookPageFeed.aggregate([
        {
          $match: {
            profile_id: this.social_page_id,
          },
        },
        {
          $group: {
            _id: null,
            total_comments_count: { $sum: '$feed_comment_count' },
            total_shares_count: { $sum: '$feed_share_count' },
          },
        },
      ]);

      output['page_comments_count'] = result[0] ? result[0].total_comments_count : 0;
      output['page_shares_count'] = result[0] ? result[0].total_shares_count : 0;
      break;
    case 'instagram':
      const data = await InstagramProfileFeed.aggregate([
        {
          $match: {
            profile_id: this.social_page_id,
          },
        },
        {
          $group: {
            _id: null,
            total_comments_count: { $sum: '$feed_comment_count' },
          },
        },
      ]);

      output['page_comments_count'] = data[0] ? data[0].total_comments_count : 0;
      break;
    default:
    // code block
  }


  return output;
});

socialMediaProfileSchema.set('toJSON', { virtuals: true });

const SocialMediaProfile = mongoose.model('SocialMediaProfile', socialMediaProfileSchema);


module.exports = SocialMediaProfile;
