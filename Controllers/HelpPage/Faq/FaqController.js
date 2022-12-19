const mysqlModels = require('../../../models/mysql').default;
const responseHelper = require('../../../Helpers/responseHelper');
const {Enums} = require('../../../Utils');

module.exports = {
  all: async (req, res, next) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const faqs = await mysqlModels.FrequentlyAskedQuestion.findAll({
        order: [['created_at', 'DESC']],
        limit,
        offset,
      });

      return responseHelper(true, '', Enums.HTTP_OK, 'All FAQs', faqs, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, Enums.SERVER_ERROR, Enums.HTTP_SERVER_ERROR, '', '', res);
    }
  },

  show: async (req, res, next) => {
    try {
      const {id} = req.params;

      const faqs = await mysqlModels.FrequentlyAskedQuestion.findByPk(id);

      return responseHelper(true, '', Enums.HTTP_OK, 'FAQ Details', faqs, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, Enums.SERVER_ERROR, Enums.HTTP_SERVER_ERROR, '', '', res);
    }
  },

  store: async (req, res, next) => {
    try {
      const {title, description} = req.body;

      const faqs = await mysqlModels.FrequentlyAskedQuestion.create({
        title: title,
        description: description,
      });


      return responseHelper(true, '', Enums.HTTP_OK, 'newly created faqs', faqs, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, Enums.SERVER_ERROR, Enums.HTTP_SERVER_ERROR, '', '', res);
    }
  },

  update: async (req, res, next) => {
    try {
      const {id} = req.params;
      const {title, description} = req.body;

      const faqModal = await mysqlModels.FrequentlyAskedQuestion.findByPk(id);

      /* Model not found*/
      if (!faqModal) {
        return responseHelper(false, Enums.HTTP_NOT_AVAILABLE, Enums.HTTP_NOT_AVAILABLE, 'Model not fount', [], res);
      }

      faqModal.title = title;
      faqModal.description = description;
      faqModal.save();

      return responseHelper(true, '', Enums.HTTP_OK, 'updated successfully', faqModal, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, Enums.SERVER_ERROR, Enums.HTTP_SERVER_ERROR, '', '', res);
    }
  },
};
