const responseHelper = require('../../Helpers/responseHelper');
const dashboardService = require('../../Services/Dashboard/dashboardService');
const { Enums } = require('../../Utils');
const { format } = require('date-fns');
const mysqlModels = require('./../../models/mysql').default;
const { Op } = require('sequelize');

module.exports = {
    //Get All Social Media Profile Data
    getDashboardData: async (req, res) => {
        try {
            let profileData = await dashboardService.socialProfileData(req, req.params.type);
            return responseHelper(true, Enums.TOTAL_SOCIAL_MEDIA_PROFILES, 200, '', profileData, res);

        } catch (error) {
            logger.error(error);
            return responseHelper(false, Enums.SERVER_ERROR, Enums.HTTP_SERVER_ERROR, '', {}, res);
        }

    },

    getLoginLogs: async (req, res) => {
        try {
            const queryParams = req.query;
            const { page, page_limit, start_date, end_date, subdomain_id } = queryParams;
            const startDate = format(new Date(start_date), `${Enums.DATE_FORMAT} 00: 00: 00`);
            const endDate = format(new Date(end_date), `${Enums.DATE_FORMAT} 23: 59: 59`);
            const pageOptions = {
                page: parseInt(page) || 1,
                limit: parseInt(page_limit) || 5
            }
            let where = { last_login_at: { [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }] } }
            if (subdomain_id) {
                where = {
                    [Op.and]: [{
                        last_login_at: { [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }] }
                    },
                    { subdomain_id: subdomain_id }]
                }
            }

            const loginLogs = await mysqlModels.User.findAll({
                order: [["last_login_at", "DESC"]],
                attributes: ['subdomain_id', 'first_name', 'last_name', 'email', 'last_login_at', 'last_login_with', 'role', 'timezone'],
                include: [{
                    model: mysqlModels.CustomerSubdomain, as: 'CustomerSubdomain',
                    attributes: ['subdomain'],
                }],
                where: where,
                limit: pageOptions.limit * 1,
                offset: (pageOptions.page - 1) * pageOptions.limit,
            })

            return responseHelper(true, Enums.USER_DETAIL, 200, '', loginLogs, res);

        } catch (error) {
            logger.error(error);
            return responseHelper(false, Enums.SERVER_ERROR, Enums.HTTP_SERVER_ERROR, '', {}, res);
        }
    },

    getSubdomainList: async (req, res) => {
        try {
            const subdomainList = await mysqlModels.CustomerSubdomain.findAll({
                attributes: ['id', 'subdomain']
            })
            return responseHelper(true, Enums.SUBDOMAIN_LISTS, 200, '', subdomainList, res);

        } catch (error) {
            logger.error(error);
            return responseHelper(false, Enums.SERVER_ERROR, Enums.HTTP_SERVER_ERROR, '', {}, res);
        }
    },

    downloadLogs: async (req, res) => {
        try {
            const data = await dashboardService.getDownloadLogs(req);
            return responseHelper(true, Enums.DOWNLOAD_LOGS, 200, '', data, res);

        } catch (error) {
            logger.error(error);
            return responseHelper(false, Enums.SERVER_ERROR, Enums.HTTP_SERVER_ERROR, '', {}, res);
        }
    }
};