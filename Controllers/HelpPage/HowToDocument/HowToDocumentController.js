const mysqlModels = require('../../../models/mysql').default;
const responseHelper = require('../../../Helpers/responseHelper');
const {Enums} = require('../../../Utils');

module.exports = {
  all: async (req, res, next) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const faqs = await mysqlModels.HowToDocument.findAll({
        order: [['created_at', 'DESC']],
        limit,
        offset,
      });

      return responseHelper(true, '', Enums.HTTP_OK, 'All How To Docs', faqs, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, Enums.SERVER_ERROR, Enums.HTTP_SERVER_ERROR, '', '', res);
    }
  },

  show: async (req, res, next) => {
    try {
      const {id} = req.params;

      const faqs = await mysqlModels.HowToDocument.findByPk(id);

      return responseHelper(true, '', Enums.HTTP_OK, 'How To Docs Details', faqs, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, Enums.SERVER_ERROR, Enums.HTTP_SERVER_ERROR, '', '', res);
    }
  },

  store: async (req, res, next) => {
    try {
      const {title, description} = req.body;

      const howToDoc = await mysqlModels.HowToDocument.create({
        title: title,
        description: description,
      });


      return responseHelper(true, '', Enums.HTTP_OK, 'Created How-to Doc', howToDoc, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, Enums.SERVER_ERROR, Enums.HTTP_SERVER_ERROR, '', '', res);
    }
  },
  update: async (req, res, next) => {
    try {
      const {id} = req.params;
      const {title, description} = req.body;

      const howToDoc = await mysqlModels.HowToDocument.findByPk(id);

      /* Model not found*/
      if (!howToDoc) {
        return responseHelper(false, Enums.HTTP_NOT_AVAILABLE, Enums.HTTP_NOT_AVAILABLE, 'Model not fount', [], res);
      }

      howToDoc.title = title;
      howToDoc.description = description;
      howToDoc.save();

      return responseHelper(true, '', Enums.HTTP_OK, 'updated successfully', howToDoc, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, Enums.SERVER_ERROR, Enums.HTTP_SERVER_ERROR, '', '', res);
    }
  },
};
