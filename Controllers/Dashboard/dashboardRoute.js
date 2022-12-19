const dashboardController = require("./dashbordController");
const RoleAccessControl = require('../../Middleware/RoleAccessControl');
const validation = require('../../Middleware/validation');

module.exports = (router, passport) => {

    router.get('/admin-dashboard/:type', passport.authenticate('bearer', { session: false }), RoleAccessControl(['super-admin']), dashboardController.getDashboardData);

    router.get('/dashboard/login-logs', passport.authenticate('bearer', { session: false }), RoleAccessControl(['super-admin']), validation('dateValidation'), dashboardController.getLoginLogs);

    router.get('/dashboard/subdomain-list', passport.authenticate('bearer', { session: false }), RoleAccessControl(['super-admin']), dashboardController.getSubdomainList);

    router.get('/download-logs',  passport.authenticate('bearer', { session: false }), RoleAccessControl(['super-admin']),validation('dateValidation'), dashboardController.downloadLogs);

}