const mysqlModels = require('../../../models/mysql').default;
const responseHelper = require('../../../Helpers/responseHelper');
const {Enums} = require('../../../Utils');

module.exports = {
  all: async (req, res, next) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const faqs = await mysqlModels.HelpVideo.findAll({
        order: [['created_at', 'DESC']],
        limit,
        offset,
      });

      return responseHelper(true, '', Enums.HTTP_OK, 'All Videos', faqs, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, Enums.SERVER_ERROR, Enums.HTTP_SERVER_ERROR, '', '', res);
    }
  },

  show: async (req, res, next) => {
    try {
      const {id} = req.params;

      const faqs = await mysqlModels.HelpVideo.findByPk(id);

      return responseHelper(true, '', Enums.HTTP_OK, 'Help Video Details', faqs, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, Enums.SERVER_ERROR, Enums.HTTP_SERVER_ERROR, '', '', res);
    }
  },

  store: async (req, res, next) => {
    try {
      const {title, description, video_link} = req.body;

      const newHelpVideo = await mysqlModels.HelpVideo.create({
        title: title,
        description: description,
      });


      return responseHelper(true, '', Enums.HTTP_OK, 'newly created helps video record', newHelpVideo, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, Enums.SERVER_ERROR, Enums.HTTP_SERVER_ERROR, '', '', res);
    }
  },

  update: async (req, res, next) => {
    try {
      const {id} = req.params;
      const {title, description, video_link} = req.body;


      const helpVideo = await mysqlModels.HelpVideo.findByPk(id);

      /* Model not found*/
      if (!helpVideo) {
        return responseHelper(false, Enums.HTTP_NOT_AVAILABLE, Enums.HTTP_NOT_AVAILABLE, 'Model not fount', [], res);
      }

      helpVideo.title = title;
      helpVideo.description = description;
      helpVideo.save();

      return responseHelper(true, '', Enums.HTTP_OK, 'updated successfully', helpVideo, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, Enums.SERVER_ERROR, Enums.HTTP_SERVER_ERROR, '', '', res);
    }
  },
};
