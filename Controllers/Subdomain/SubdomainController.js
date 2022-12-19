const responseHelper = require('../../Helpers/responseHelper');
const mysqlModels = require('../../models/mysql').default;
const { SUBDOMAIN_DETAIL, HTTP_OK, HTTP_SERVER_ERROR, SERVER_ERROR, HTTP_NOT_AVAILABLE, HTTP_BAD_REQUEST, SUBDOMAIN_INVALID } = require('../../Utils/enum');

module.exports = {
  // searchBrand: async (req, res, next)=> {
  //   try {
  //     const brands = await Brands.findAll({
  //       where: {
  //         brand_name: {[Op.startsWith]: req.params['query']},
  //       },
  //     });
  //     return responseHelper(true, 'List of brands', 200, '', brands, res);
  //   } catch (error) {
  //     logger.error(error);
  //     return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
  //   }
  // },
  getSubdomainInfo: async (req, res, next) => {
    try {
      console.log(req.params);
      const customerSubdomain = await mysqlModels.CustomerSubdomain.findOne({
        where: {
          subdomain: req.params['query'],
        },
        raw: true,
      });
      if (customerSubdomain) {
        customerSubdomain['logo'] = customerSubdomain['logo'] ? `${process.env.API_URL}${customerSubdomain['logo']}` : '';
        customerSubdomain['feature_image'] = customerSubdomain['feature_image'] ? `${process.env.API_URL}${customerSubdomain['feature_image']}` : '';
        return responseHelper(true, SUBDOMAIN_DETAIL, HTTP_OK, '', customerSubdomain, res);
      } else {
        return responseHelper(false, SUBDOMAIN_INVALID, HTTP_BAD_REQUEST, '', {}, res);
      }
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, HTTP_SERVER_ERROR, '', {}, res);
    }
  },
};
