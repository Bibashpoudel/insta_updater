const SocialMediaProfilesController = require('./SocialMediaProfilesController');
const RoleAccessControl = require('../../Middleware/RoleAccessControl');
const validation = require('../../Middleware/validation');

module.exports = (router, passport) => {
  /**
 * @swagger
 * /api/v1/social-media/{type}/search-profiles/{query}:
 *    get:
 *       tags: [Profiles]
 *       parameters:
 *          - in: path
 *            name: type
 *            required: true
 *            schema:
 *               type: string
 *            description: The type of social media
 *          - in: path
 *            name: query
 *            required: true
 *            schema:
 *               type: string
 *            description: The query string for profile search
 *       security:
 *        - bearerAuth:
 *            $ref: '#/components/securitySchemes/bearerAuth'
 *       description: This should sign in the user
 *       responses:
 *           200:
 *              description: Request successfully executed
 *           400:
 *              description: Bad request
 *           404:
 *              description: Request not found
 *           default:
 *              description: Unexpected error
 */
  router.get('/social-media/:type/search-profiles/:query', passport.authenticate('bearer', {session: false}), RoleAccessControl(['customer-admin']), SocialMediaProfilesController.SearchSocialMediaProfiles);

  router.get('/test/social-media/facebook/search-profiles/:query', SocialMediaProfilesController.testSearchSocialMediaProfiles);

  /**
 * @swagger
 * /api/v1/social-media/{type}/profiles/store:
 *    post:
 *       tags: [Profiles]
 *       parameters:
 *          - in: path
 *            name: type
 *            required: true
 *            schema:
 *               type: string
 *            description: The type of social media
 *       security:
 *        - bearerAuth:
 *            $ref: '#/components/securitySchemes/bearerAuth'
 *       description: This should sign in the user
 *       responses:
 *           200:
 *              description: Request successfully executed
 *           400:
 *              description: Bad request
 *           404:
 *              description: Request not found
 *           default:
 *              description: Unexpected error
 */
  router.post('/social-media/:type/profiles/store', passport.authenticate('bearer', {session: false}), RoleAccessControl(['customer-admin']), validation('addSocialMediaProfiles'), SocialMediaProfilesController.addProfiles);


  /**
 * @swagger
 * /api/v1/social-media/:type/profiles/delete:
 *    delete:
 *       tags: [Profiles]
 *       parameters:
 *          - in: path
 *            name: type
 *            required: true
 *            schema:
 *               type: string
 *            description: The type of social media
 *       security:
 *        - bearerAuth:
 *            $ref: '#/components/securitySchemes/bearerAuth'
 *       description: This should sign in the user
 *       responses:
 *           200:
 *              description: Request successfully executed
 *           400:
 *              description: Bad request
 *           404:
 *              description: Request not found
 *           default:
 *              description: Unexpected error
 */
  router.delete('/social-media/:type/profiles/delete', passport.authenticate('bearer', {session: false}), RoleAccessControl(['customer-admin']), validation('deleteSocialMediaProfiles'), SocialMediaProfilesController.deleteProfiles);


  /**
 * @swagger
 * /api/v1/social-media/{type}/profiles:
 *    get:
 *       tags: [Profiles]
 *       parameters:
 *          - in: path
 *            name: type
 *            required: true
 *            schema:
 *               type: string
 *            description: The type of social media
 *       security:
 *        - bearerAuth:
 *            $ref: '#/components/securitySchemes/bearerAuth'
 *       description: This should sign in the user
 *       responses:
 *           200:
 *              description: Request successfully executed
 *           400:
 *              description: Bad request
 *           404:
 *              description: Request not found
 *           default:
 *              description: Unexpected error
 */

  // list with date filter
  router.get('/social-media/:type/profiles-list', passport.authenticate('bearer', {session: false}), RoleAccessControl(['customer-admin', 'customer-viewer']), validation('getProfileComparison'), SocialMediaProfilesController.customerProfilesList);

  // list without date filter
  router.get('/social-media/:type/profiles', passport.authenticate('bearer', {session: false}), RoleAccessControl(['customer-admin', 'customer-viewer']), SocialMediaProfilesController.customerProfiles);
  /**
 * @swagger
 * /api/v1/social-media/{type}/profiles/{profile_id}/basic:
 *    get:
 *       tags: [Profiles]
 *       parameters:
 *          - in: path
 *            name: type
 *            required: true
 *            schema:
 *               type: string
 *            description: The type of social media
 *          - in: path
 *            name: profile_id
 *            required: true
 *            schema:
 *               type: integer
 *            description: The id of the profile
 *       security:
 *        - bearerAuth:
 *            $ref: '#/components/securitySchemes/bearerAuth'
 *       description: This should sign in the user
 *       responses:
 *           200:
 *              description: Request successfully executed
 *           400:
 *              description: Bad request
 *           404:
 *              description: Request not found
 *           default:
 *              description: Unexpected error
 */
  router.get('/social-media/:type/profiles/:profile_id/basic', passport.authenticate('bearer', {session: false}), RoleAccessControl(['customer-admin', 'customer-viewer']), validation('getBasicProfileInfo'), SocialMediaProfilesController.getProfileBasicDetails);

  /**
 * @swagger
 * /api/v1/social-media/{type}/profiles/{profile_id}/likes:
 *    get:
 *       tags: [Profiles]
 *       parameters:
 *          - in: path
 *            name: type
 *            required: true
 *            schema:
 *               type: string
 *            description: The type of social media
 *          - in: path
 *            name: profile_id
 *            required: true
 *            schema:
 *               type: integer
 *            description: The id for profile
 *          - in: query
 *            name: time_filter
 *            schema:
 *               type: string
 *            description: string in [today,last7days,last30days,lastmonth, custom_date]
 *       security:
 *        - bearerAuth:
 *            $ref: '#/components/securitySchemes/bearerAuth'
 *       description: This should sign in the user
 *       responses:
 *           200:
 *              description: Request successfully executed
 *           400:
 *              description: Bad request
 *           404:
 *              description: Request not found
 *           default:
 *              description: Unexpected error
 */
  router.get('/social-media/:type/profiles/:profile_id/likes', passport.authenticate('bearer', {session: false}), RoleAccessControl(['customer-admin', 'customer-viewer']), validation('socialProfileLikes'), SocialMediaProfilesController.getProfileFeedLikes);

  /**
 * @swagger
 * /api/v1/social-media/{type}/profiles/{profile_id}/comments:
 *    get:
 *       tags: [Profiles]
 *       parameters:
 *          - in: path
 *            name: type
 *            required: true
 *            schema:
 *               type: string
 *            description: The type of social media
 *          - in: path
 *            name: profile_id
 *            required: true
 *            schema:
 *               type: integer
 *            description: The id for profile
 *          - in: query
 *            name: time_filter
 *            schema:
 *               type: string
 *            description: string in [today,last7days,last30days,lastmonth, custom_date]
 *       security:
 *        - bearerAuth:
 *            $ref: '#/components/securitySchemes/bearerAuth'
 *       description: This should sign in the user
 *       responses:
 *           200:
 *              description: Request successfully executed
 *           400:
 *              description: Bad request
 *           404:
 *              description: Request not found
 *           default:
 *              description: Unexpected error
 */
  router.get('/social-media/:type/profiles/:profile_id/comments', passport.authenticate('bearer', {session: false}), RoleAccessControl(['customer-admin', 'customer-viewer']), validation('socialProfileComments'), SocialMediaProfilesController.getProfileFeedComments);

  /**
 * @swagger
 * /api/v1/social-media/{type}/profiles/{profile_id}/shares:
 *    get:
 *       tags: [Profiles]
 *       parameters:
 *          - in: path
 *            name: type
 *            required: true
 *            schema:
 *               type: string
 *            description: The type of social media
 *          - in: path
 *            name: profile_id
 *            required: true
 *            schema:
 *               type: integer
 *            description: The id for profile
 *          - in: query
 *            name: time_filter
 *            schema:
 *               type: string
 *            description: string in [today,last7days,last30days,lastmonth, custom_date]
 *       security:
 *        - bearerAuth:
 *            $ref: '#/components/securitySchemes/bearerAuth'
 *       description: This should sign in the user
 *       responses:
 *           200:
 *              description: Request successfully executed
 *           400:
 *              description: Bad request
 *           404:
 *              description: Request not found
 *           default:
 *              description: Unexpected error
 */
  router.get('/social-media/:type/profiles/:profile_id/shares', passport.authenticate('bearer', {session: false}), RoleAccessControl(['customer-admin', 'customer-viewer']), validation('socialProfileShares'), SocialMediaProfilesController.getProfileFeedShares);

  /**
 * @swagger
 * /api/v1/social-media/{type}/profiles/{profile_id}/top-posts:
 *    get:
 *       tags: [Profiles]
 *       parameters:
 *          - in: path
 *            name: type
 *            required: true
 *            schema:
 *               type: string
 *            description: The type of social media
 *          - in: path
 *            name: profile_id
 *            required: true
 *            schema:
 *               type: integer
 *            description: The id for profile
 *       security:
 *        - bearerAuth:
 *            $ref: '#/components/securitySchemes/bearerAuth'
 *       description: This should sign in the user
 *       responses:
 *           200:
 *              description: Request successfully executed
 *           400:
 *              description: Bad request
 *           404:
 *              description: Request not found
 *           default:
 *              description: Unexpected error
 */
  router.get('/social-media/:type/profiles/:profile_id/top-posts', passport.authenticate('bearer', {session: false}), RoleAccessControl(['customer-admin', 'customer-viewer']), validation('socialMediaProfilesTopPosts'), SocialMediaProfilesController.getProfileTopPosts);

  /**
 * @swagger
 * /api/v1/social-media/{type}/profiles/interactions/{period}:
*    get:
 *       tags: [Profiles]
 *       parameters:
 *          - in: path
 *            name: type
 *            required: true
 *            schema:
 *               type: string
 *            description: The type of social media
 *          - in: path
 *            name: profile_id
 *            required: true
 *            schema:
 *               type: integer
 *            description: The id for profile
 *       security:
 *        - bearerAuth:
 *            $ref: '#/components/securitySchemes/bearerAuth'
 *       description: This should sign in the user
 *       responses:
 *           200:
 *              description: Request successfully executed
 *           400:
 *              description: Bad request
 *           404:
 *              description: Request not found
 *           default:
 *              description: Unexpected error
 */
  router.get('/social-media/:type/profiles/interactions/:period', passport.authenticate('bearer', {session: false}), RoleAccessControl(['customer-admin', 'customer-viewer']), validation('socialProfilePostInteractions'), SocialMediaProfilesController.getInteractions);


  /**
 * @swagger
 * /api/v1/social-media/{type}/profiles/{profile_id}/posts-type-distributions/{period}:
*    get:
 *       tags: [Profiles]
 *       parameters:
 *          - in: path
 *            name: type
 *            required: true
 *            schema:
 *               type: string
 *            description: The type of social media
 *          - in: path
 *            name: profile_id
 *            required: true
 *            schema:
 *               type: integer
 *            description: The id for profile
 *          - in: path
 *            name: period
 *            required: true
 *            schema:
 *               type: string
 *            description: day, week, month
 *       requestBody:
 *          required: true
 *          content:
 *            application/x-www-form-urlencoded:
 *              schema:
 *                 $ref: '#/components/schema/dateRange'
 *       security:
 *        - bearerAuth:
 *            $ref: '#/components/securitySchemes/bearerAuth'
 *       description: This should sign in the user
 *       responses:
 *           200:
 *              description: Request successfully executed
 *           400:
 *              description: Bad request
 *           404:
 *              description: Request not found
 *           default:
 *              description: Unexpected error
 */
  router.get('/social-media/:type/profiles/:profile_id/posts-type-distributions/:period', passport.authenticate('bearer', {session: false}), RoleAccessControl(['customer-admin', 'customer-viewer']), validation('socialProfilePostDistribution'), SocialMediaProfilesController.getPostsTypeDistributions);

  router.get('/social-media/:type/profiles/post-type-distributions', passport.authenticate('bearer', {session: false}), RoleAccessControl(['customer-admin', 'customer-viewer']), validation('socialMediaProfilesInteractionDistribution'), SocialMediaProfilesController.getProfilesPostTypeOverview);

  router.get('/social-media/:type/profiles/feed-interaction-distributions', passport.authenticate('bearer', {session: false}), RoleAccessControl(['customer-admin', 'customer-viewer']), validation('socialMediaProfilesPostTypeDistribution'), SocialMediaProfilesController.getInteractionDistributions);


  /**
 * @swagger
 * /api/v1/social-media/{type}/profiles/followers-growth/{period}:
 *    post:
 *       tags: [Profiles]
 *       parameters:
 *          - in: path
 *            name: type
 *            required: true
 *            schema:
 *               type: string
 *            description: The type of social media
 *          - in: query
 *            name: time_filter
 *            required: false
 *            schema:
 *               type: string
 *            description: The query for time_filter
 *       security:
 *        - bearerAuth:
 *            $ref: '#/components/securitySchemes/bearerAuth'
 *       description: This should sign in the user
 *       requestBody:
 *          required: true
 *          content:
 *            application/x-www-form-urlencoded:
 *              schema:
 *                 $ref: '#/components/schema/followerGrowth'
 *       responses:
 *           200:
 *              description: Request successfully executed
 *           400:
 *              description: Bad request
 *           404:
 *              description: Request not found
 *           default:
 *              description: Unexpected error
 */
  router.get('/social-media/:type/profiles/followers-growth/:period', passport.authenticate('bearer', {session: false}), RoleAccessControl(['customer-admin', 'customer-viewer']), validation('socialProfileFollowersGrowth'), SocialMediaProfilesController.getProfileFollowersGrowth);


  /* follower absolute growth */
  router.get('/social-media/:type/profiles/:id/followers-absolute-growth', passport.authenticate('bearer', {session: false}), RoleAccessControl(['customer-admin', 'customer-viewer']), validation('getProfileAbsoluteGrowth'), SocialMediaProfilesController.getProfileFollowersAbsoluteGrowth);

  /* profile interaction growth */
  router.get('/social-media/:type/profiles/:id/interactions-absolute-growth', passport.authenticate('bearer', {session: false}), RoleAccessControl(['customer-admin', 'customer-viewer']), validation('getProfileAbsoluteGrowth'), SocialMediaProfilesController.getProfileInteractionAbsoluteGrowth);

  /**
 * @swagger
 * components:
 *    schema:
 *      followerGrowth:
 *        type: object
 *        properties:
 *          profiles:
 *           type: array
 *           items:
 *            type: string
 *      dateRange:
 *        type: object
 *        properties:
 *          start_date:
 *           type: date
 *          end_date:
 *           type: date
 *      required:
 *         profiles
 *    securitySchemes:
 *      bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

  router.get('/social-media/:type/content-news-feeds', passport.authenticate('bearer', {session: false}), RoleAccessControl(['customer-admin', 'customer-viewer']), validation('getProfileNewsFeeds'), SocialMediaProfilesController.getProfilesContentNewsFeeds);

  // updateProfileColor
  router.put(
      '/social-media/:type/:id/update-profile-color',
      passport.authenticate('bearer', {session: false}),
      RoleAccessControl(['customer-admin', 'customer-viewer']),
      // validation('getProfileNewsFeeds'),
      SocialMediaProfilesController.updateProfileColor,
  );

  /* pull social profile feeds */
  router.put('/social-media/:type/:profile_id/pull', passport.authenticate('bearer', {session: false}), RoleAccessControl(['super-admin']), SocialMediaProfilesController.pullProfile);

  router.delete('/social-media/profiles/delete/:id', passport.authenticate('bearer', {session: false}), RoleAccessControl(['super-admin']), SocialMediaProfilesController.deleteProfile);

  router.post('/social-media/profile-details', validation('getProfileDetailsAndPosts'), SocialMediaProfilesController.getProfileDetails);
};


