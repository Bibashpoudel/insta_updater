const logController = require("./LogController");
const RoleAccessControl = require('../../Middleware/RoleAccessControl');

module.exports = (router, passport) => {
    router.post('/download-logs/create',  logController.createDownloadLog);
}