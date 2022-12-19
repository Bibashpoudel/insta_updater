const mysqlModels = require('../../../models/mysql').default;
const responseHelper = require('../../../Helpers/responseHelper');
const {Enums} = require('../../../Utils');
const {Op} = require('sequelize');

function getFaqData(search, limit, offset) {
  return mysqlModels.FrequentlyAskedQuestion.findAll({
    where: {
      [Op.or]: [
        {title: {[Op.like]: search}},
        {description: {[Op.like]: search}},
      ],
    },
    order: [['created_at', 'DESC']],
  });
}

function getHelpVideos(search, limit, offset) {
  return mysqlModels.HelpVideo.findAll({
    where: {
      [Op.or]: [
        {title: {[Op.like]: search}},
        {description: {[Op.like]: search}},
      ],
    },
    order: [['created_at', 'DESC']],
  });
}

function getHowToDocs(search, limit, offset) {
  return mysqlModels.HowToDocument.findAll({
    where: {
      [Op.or]: [
        {title: {[Op.like]: search}},
        {description: {[Op.like]: search}},
      ],
    },
    order: [['created_at', 'DESC']],
  });
}

module.exports = {
  search: async (req, res, next) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = '%' + (req.body.search).replace(' ', '%') + '%';
      const context = req.body.context;

      const offset = (page - 1) * limit;

      let faqs = [];
      let howToDocs = [];
      let helpVideos = [];

      if (context == 'faqs') {
        faqs = await getFaqData(search, limit, offset);
      } else if (context == 'how-to-docs') {
        howToDocs = await getHowToDocs(search, limit, offset);
      } else if (context == 'help-videos') {
        helpVideos = await getHelpVideos(search, limit, offset);
      } else {
        faqs = await getFaqData(search, limit, offset);
        howToDocs = await getHowToDocs(search, limit, offset);
        helpVideos = await getHelpVideos(search, limit, offset);
      }

      const data = {
        'faqs': faqs,
        'helpVideos': helpVideos,
        'howToDocs': howToDocs,
      };

      return responseHelper(true, '', Enums.HTTP_OK, 'Search Results', data, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, Enums.SERVER_ERROR, Enums.HTTP_SERVER_ERROR, '', '', res);
    }
  },
};
