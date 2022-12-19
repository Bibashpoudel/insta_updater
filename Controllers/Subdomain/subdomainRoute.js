const SubdomainController = require('./SubdomainController');

module.exports = (router, passport) => {
  // search for brands may be used for future
  // router.get('/search-brands/:query', passport.authenticate('bearer', {session: false}), BrandController.searchBrand);

  /**
 * @swagger
 * /api/v1/get-subdomain/{query}:
 *    get:
 *      tags: [Subdomain]
 *      parameters:
 *          - in: path
 *            name: query
 *            required: true
 *            schema:
 *               type: string
 *            description: The subdomain search query
 *      description: This should logout the user
 *      responses:
 *           200:
 *              description: Request successfully executed
 *           400:
 *              description: Bad request
 *           404:
 *              description: Request not found
 *           default:
 *              description: Unexpected error
 */
  router.get('/get-subdomain/:query', SubdomainController.getSubdomainInfo);
};

/**
 * @swagger
 * components:
 *    securitySchemes:
 *      bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
