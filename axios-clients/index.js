const axios = require('axios');

/* Facebook profile updater client config*/
const fbProfileUpdaterClient = axios.create({
    baseURL: process.env.FB_PROFILE_UPDATER_API,
    params: {
        // access_token: process.env.FB_GRAPH_API_ACCESS_TOKEN
    }
});

/* Instagram profile updater client config*/
const instaProfileUpdaterClient = axios.create({
    baseURL: process.env.INSTA_PROFILE_UPDATER_API,
    params: {
        // access_token: process.env.FB_GRAPH_API_ACCESS_TOKEN
    }
});

/* Get Facebook User Detail config*/
const getFacebookUserDetail = axios.create({
    baseURL: process.env.getFacebookUserDetail,
    params: {
        // access_token: process.env.FB_GRAPH_API_ACCESS_TOKEN
    }
});


module.exports = {
    fbProfileUpdaterClient,
    instaProfileUpdaterClient,
    getFacebookUserDetail
}