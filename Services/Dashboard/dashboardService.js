const mongooseModels = require('../../models/mongo-db').default;
const mysqlModels = require('../../models/mysql').default;
const { format } = require('date-fns');
const { Enums } = require('../../Utils');
const { Op } = require('sequelize');

module.exports = {
    //Get All Social Media Profile Data
    socialProfileData: async (req, type) => {
        const queryParams = req.query;
        const { page, page_limit } = queryParams;
        const pageOptions = {
            page: parseInt(page) || 1,
            limit: parseInt(page_limit) || 5
        }
        let feedCount = await mongooseModels.SocialMediaProfile.find({ 'social_type': type }).countDocuments()
        const profileData = await mongooseModels.SocialMediaProfile.find({
            'social_type': type
        }).limit(pageOptions.limit * 1)
            .skip((pageOptions.page - 1) * pageOptions.limit)
            .sort({ updatedAt: -1 })

        let responseData = []
        if (profileData.length !== 0) {
            for (let data of profileData) {
                let response = {}
                let subdomains = []
                const socialProfile = await mysqlModels.CustomerSubdomainSocialMediaProfile.findAll({
                    where: {
                        'profile_id': data.social_page_id
                    },
                    include: {
                        model: mysqlModels.CustomerSubdomain
                    }
                })
                socialProfile.forEach(data => {
                    if (data.CustomerSubdomain) {
                        subdomains.push(data.CustomerSubdomain.dataValues.subdomain);
                    }
                })

                response.profile_id = data.social_page_id,
                    response.username = data.page_username
                response.profile = data.page_name;
                response.fan_count = data.page_fan_count;
                response.image = data.page_picture;
                response.subdomains = subdomains;
                response.page_url = (type == 'facebook') ? `https://www.facebook.com/${data.social_page_id}` : (type == 'instagram') ? `https://www.instagram.com/${data.page_username}` : null;
                response.updatedAt = data.updatedAt;
                responseData.push(response);
            }
        }

        return { responseData, page: pageOptions.page, pages: Math.ceil(feedCount / pageOptions.limit) };
    },

    getDownloadLogs: async (req) => {
        const queryParams = req.query;
        const { page, page_limit, start_date, end_date, subdomain_id } = queryParams;
        const startDate = format(new Date(start_date), `${Enums.DATE_FORMAT} 00: 00: 00`);
        const endDate = format(new Date(end_date), `${Enums.DATE_FORMAT} 23: 59: 59`);
        const pageOptions = {
            page: parseInt(page) || 1,
            limit: parseInt(page_limit) || 10
        } 
        
        let where = { download_time: { [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }] } }
        console.log(subdomain_id);
        if(queryParams.subdomain_id){
            where.subdomain_id = subdomain_id
        }

        const downloadLogs = await mysqlModels.DownloadLog.findAll({
            order: [["download_time", "DESC"]],
            include: {
                model: mysqlModels.CustomerSubdomain
            },
            where,
            limit: pageOptions.limit * 1,
            offset: (pageOptions.page - 1) * pageOptions.limit,               
        })

        return downloadLogs;

    }
}