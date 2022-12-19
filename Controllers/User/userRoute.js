const {createCustomerValidation, forgotPasswordValidation, changePasswordValidation, updateCustomerValidation, updateCustomerBannersValidation, changePassValidation} = require('../../Helpers/inputValidation');
const UserController = require('./userController');
const validation = require('../../Middleware/validation');
const RoleAccessControl = require('../../Middleware/RoleAccessControl');

module.exports = (router, passport) => {
  /**
 * @swagger
 * /api/v1/enable-disable-customer/{user_id}:
 *    get:
 *      tags: [User]
 *      parameters:
 *          - in: path
 *            name: user_id
 *            required: true
 *            schema:
 *               type: integer
 *            description: The id for user
 *      security:
 *        - bearerAuth:
 *            $ref: '#/components/securitySchemes/bearerAuth'
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
  router.get('/enable-disable-customer/:user_id', passport.authenticate('bearer', {session: false}), UserController.enableDisableCustomer);

  // This is to get page for password change
  router.get('/change-password', UserController.changePasswordPage);

  /**
 * @swagger
 * /api/v1/create-users:
 *    post:
 *      tags: [User]
 *      security:
 *        - bearerAuth:
 *            $ref: '#/components/securitySchemes/bearerAuth'
 *      requestBody:
 *          required: true
 *          content:
 *            application/x-www-form-urlencoded:
 *              schema:
 *                 $ref: '#/components/schema/newUser'
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
  router.post('/create-users', passport.authenticate('bearer', {session: false}), RoleAccessControl(['super-admin', 'customer-admin']), validation('userCreate'), UserController.createUsers);

  /**
 * @swagger
 * /api/v1/change-password:
 *    put:
 *      tags: [User]
 *      security:
 *        - bearerAuth:
 *            $ref: '#/components/securitySchemes/bearerAuth'
 *      requestBody:
 *          required: true
 *          content:
 *            application/x-www-form-urlencoded:
 *              schema:
 *                 $ref: '#/components/schema/changePassword'
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
  router.put('/change-password', passport.authenticate('bearer', {session: false}), validation('authUserPasswordUpdate'), UserController.changePassword);

  /**
 * @swagger
 * /api/v1/forgot-password:
 *    post:
 *      tags: [User]
 *      description: This should logout the user
 *      requestBody:
 *          required: true
 *          content:
 *            application/x-www-form-urlencoded:
 *              schema:
 *                 $ref: '#/components/schema/forgotPassword'
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
  router.post('/forgot-password', forgotPasswordValidation, UserController.forgotPassword);

  /**
 * @swagger
 * /api/v1/change-password-mail:
 *    post:
 *      tags: [User]
 *      requestBody:
 *          required: true
 *          content:
 *            application/x-www-form-urlencoded:
 *              schema:
 *                 $ref: '#/components/schema/changePasswordMail'
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
  router.post('/change-password-mail', changePasswordValidation, UserController.changePasswordFromMail);

  /**
 * @swagger
 * /api/v1/customer-logo-banners:
 *    put:
 *      tags: [User]
 *      security:
 *        - bearerAuth:
 *            $ref: '#/components/securitySchemes/bearerAuth'
 *      requestBody:
 *          required: true
 *          content:
 *            application/x-www-form-urlencoded:
 *              schema:
 *                 $ref: '#/components/schema/updateSubdomainBanner'
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
  router.put('/customer-logo-banners', passport.authenticate('bearer', {session: false}), RoleAccessControl(['customer-admin']), updateCustomerBannersValidation, UserController.updateCustomerLogoBanners);

  /**
 * @swagger
 * /api/v1/users/{user_id}/delete:
 *    delete:
 *      tags: [User]
 *      parameters:
 *          - in: path
 *            name: user_id
 *            required: true
 *            schema:
 *               type: integer
 *            description: The id for user
 *      security:
 *        - bearerAuth:
 *            $ref: '#/components/securitySchemes/bearerAuth'
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
  router.delete('/users/:user_id/delete', passport.authenticate('bearer', {session: false}), RoleAccessControl(['super-admin', 'customer-admin']), UserController.deleteUsers);

  /* USERS UPDATE API ENDPOINT*/
  /**
 * @swagger
 * /api/v1/users/{id}/update:
 *    put:
 *      tags: [User]
 *      parameters:
 *          - in: path
 *            name: id
 *            required: true
 *            schema:
 *               type: integer
 *            description: The id for user
 *      security:
 *        - bearerAuth:
 *            $ref: '#/components/securitySchemes/bearerAuth'
 *      requestBody:
 *          required: true
 *          content:
 *            application/x-www-form-urlencoded:
 *              schema:
 *                 $ref: '#/components/schema/updateUser'
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
  router.put('/users/:id/update', passport.authenticate('bearer', {session: false}), RoleAccessControl(['super-admin', 'customer-admin']), validation('updateUser'), UserController.updateUser);

  /**
 * @swagger
 * /api/v1/me/update:
 *    put:
 *      tags: [User]
 *      security:
 *        - bearerAuth:
 *            $ref: '#/components/securitySchemes/bearerAuth'
 *      requestBody:
 *          required: true
 *          content:
 *            application/x-www-form-urlencoded:
 *              schema:
 *                 $ref: '#/components/schema/updateAuthUser'
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
  router.put('/me/update', passport.authenticate('bearer', {session: false}), RoleAccessControl(['super-admin', 'customer-admin', 'customer-viewer']), validation('updateAuthUser'), UserController.updateAuthUser);

  /**
 * @swagger
 * /api/v1/users/{user_id}:
 *    get:
 *      tags: [User]
 *      parameters:
 *          - in: path
 *            name: user_id
 *            required: true
 *            schema:
 *               type: integer
 *            description: The id for user
 *      security:
 *        - bearerAuth:
 *            $ref: '#/components/securitySchemes/bearerAuth'
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
  router.get('/users/:user_id', passport.authenticate('bearer', {session: false}), RoleAccessControl(['super-admin', 'customer-admin']), UserController.editUser);

  /**
 * @swagger
 * /api/v1/users:
 *    get:
 *      tags: [User]
 *      security:
 *        - bearerAuth:
 *            $ref: '#/components/securitySchemes/bearerAuth'
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
  router.get('/users', passport.authenticate('bearer', {session: false}), RoleAccessControl(['super-admin', 'customer-admin']), UserController.getUsers);
};

/**
 * @swagger
 * components:
 *   schema:
 *    newUser:
 *      type: object
 *      properties:
 *        first_name:
 *          type: string
 *        last_name:
 *          type: string
 *        email:
 *          type: string
 *        contact_number:
 *          type: string
 *        role:
 *          type: string
 *        position:
 *          type: string
 *        employee_number:
 *          type: string
 *        user_accounts_limit:
 *          type: string
 *        social_media_profiles_limit:
 *          type: string
 *        logo:
 *          type: file
 *        featured_image:
 *          type: file
 *      required:
 *         email
 *         password
 *    updateAuthUser:
 *      type: object
 *      properties:
 *        first_name:
 *          type: string
 *        last_name:
 *          type: string
 *        contact_number:
 *          type: string
 *      required:
 *         email
 *         password
 *    updateUser:
 *      type: object
 *      properties:
 *        first_name:
 *          type: string
 *        last_name:
 *          type: string
 *        email:
 *          type: string
 *        contact_number:
 *          type: string
 *        role:
 *          type: string
 *        position:
 *          type: string
 *        employee_number:
 *          type: string
 *        user_accounts_limit:
 *          type: string
 *        social_media_profiles_limit:
 *          type: string
 *        logo:
 *          type: file
 *        featured_image:
 *          type: file
 *      required:
 *         email
 *         password
 *    changePasswordMail:
 *      type: object
 *      properties:
 *        authorization:
 *          type: string
 *        password:
 *          type: string
 *      required:
 *         authorization
 *         password
 *    changePassword:
 *      type: object
 *      properties:
 *        password:
 *          type: string
 *        confirm_password:
 *          type: string
 *      required:
 *         password
 *         confirm_password
 *    forgotPassword:
 *      type: object
 *      properties:
 *        email:
 *          type: string
 *      required:
 *         email
 *    updateSubdomainBanner:
 *      type: object
 *      properties:
 *        logo:
 *          type: file
 *        featured_image:
 *          type: file
 *   securitySchemes:
 *      bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
