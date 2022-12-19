const mysqlModels = require('../../models/mysql').default;
const responseHelper = require('../../Helpers/responseHelper');

module.exports = {
    createDownloadLog: async (req,res) => {
        try {
            const {name,email,subdomain_id,social_type,profile,file_type,download_time} = req.body;
            await mysqlModels.DownloadLog.create({
                name,
                email,
                subdomain_id,
                social_type,
                profile,
                file_type,
                download_time
            });
            return responseHelper(true, 'Log created successfully', 200, '', '', res);
            
        } catch (error) {
            logger.error(error);
            return responseHelper(false, Enums.SERVER_ERROR, Enums.HTTP_SERVER_ERROR, '', {}, res);            
        }
    }
}