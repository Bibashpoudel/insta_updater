const mysqlModels = require('../../../models/mysql').default;
const responseHelper = require('../../../Helpers/responseHelper');
const {Enums} = require('../../../Utils');
const {nodemailer} = require('../../../Helpers/nodemailer');
const {Op} = require('sequelize');
const moment = require('moment');

module.exports = {
  index: async (req, res, next) => {
    try {
      console.log(moment().subtract(1, 'month'));
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const start_date = new Date(req.query.start_date);
      const end_date = new Date(req.query.end_date + ' 24:00:00');

      const offset = (page - 1) * limit;

      const where = {
        created_at: {
          [Op.between]: [start_date, end_date],
        },
      };

      const support = await mysqlModels.ContactSupport.findAll({
        order: [['created_at', 'DESC']],
        where,
        limit,
        offset,
      });

      return responseHelper(true, '', Enums.HTTP_OK, 'All Contact Support', support, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, Enums.SERVER_ERROR, Enums.HTTP_SERVER_ERROR, '', '', res);
    }
  },

  show: async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);

      const support = await mysqlModels.ContactSupport.findByPk(id);

      return responseHelper(true, '', Enums.HTTP_OK, 'Contact Support Details', support, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, Enums.SERVER_ERROR, Enums.HTTP_SERVER_ERROR, '', '', res);
    }
  },

  store: async (req, res, next) => {
    try {
      const {first_name, last_name, email, mobile, message} = req.body;

      const support = await mysqlModels.ContactSupport.create({
        first_name,
        last_name,
        email,
        mobile,
        message,
      });

      return responseHelper(true, '', Enums.HTTP_OK, 'Contact Support Created', support, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, Enums.SERVER_ERROR, Enums.HTTP_SERVER_ERROR, '', '', res);
    }
  },
  update: async (req, res, next) => {
    try {
      const {id} = req.params;
      const {first_name, last_name, email, mobile, message} = req.body;

      const support = await mysqlModels.ContactSupport.findByPk(id);

      /* Model not found*/
      if (!support) {
        return responseHelper(false, Enums.HTTP_NOT_AVAILABLE, Enums.HTTP_NOT_AVAILABLE, 'Model not fount', [], res);
      }

      support.first_name = first_name;
      support.last_name = last_name;
      support.email = email;
      support.mobile = mobile;
      support.message = message;
      support.save();

      return responseHelper(true, '', Enums.HTTP_OK, 'Contact Support Updated', support, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, Enums.SERVER_ERROR, Enums.HTTP_SERVER_ERROR, '', '', res);
    }
  },

  sendResponse: async (req, res, next) => {
    try {
      const {id} = req.params;
      const {response} = req.body;

      const support = await mysqlModels.ContactSupport.findByPk(id);

      /* Model not found*/
      if (!support) {
        return responseHelper(false, Enums.HTTP_NOT_AVAILABLE, Enums.HTTP_NOT_AVAILABLE, 'Model not fount', [], res);
      }

      support.answered = true;
      support.save();

      await nodemailer({data: support, response}, 'contactSupportResponse', res);

      return responseHelper(true, '', Enums.HTTP_OK, 'Response sent', support, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, Enums.SERVER_ERROR, Enums.HTTP_SERVER_ERROR, '', '', res);
    }
  },
};
