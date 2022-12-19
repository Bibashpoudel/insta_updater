const { signInValidation, facebookAuthValidation } = require('../../Helpers/inputValidation');
const AuthController = require('./authController');

module.exports = (router, passport) => {
  /**
 * @swagger
 * /api/v1/sign-in:
 *    post:
 *       tags: [Auth]
 *       requestBody:
 *          required: true
 *          content:
 *            application/x-www-form-urlencoded:
 *              schema:
 *                 $ref: '#/components/schema/signIn'
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
  router.post('/sign-in', signInValidation, AuthController.signIn);

  /**
 * @swagger
 * /api/v1/logout:
 *    get:
 *      tags: [Auth]
 *      security:
 *         - bearerAuth:
 *              $ref: '#/components/securitySchemes/bearerAuth'
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

  router.post('/:type/sign-in', AuthController.facebookAuthLogin);

  router.get(
    '/logout',
    passport.authenticate('bearer', { session: false }),
    AuthController.logout,
  );
};

/**
 * @swagger
 * components:
 *   schema:
 *    signIn:
 *      type: object
 *      properties:
 *        email:
 *          type: string
 *        password:
 *          type: string
 *      required:
 *         email
 *         password
 *   securitySchemes:
 *      bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
