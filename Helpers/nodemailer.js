const nodemailer = require('nodemailer');
const responseHelper = require('./responseHelper');
const {forgotPasswordMail, sendPassword, sendResponse} = require('./nodemailerHelper');
const {HTTP_SERVER_ERROR, SERVER_ERROR} = require('../Utils/enum');

module.exports = {
  nodemailer: async (requirements, forWhat, res) => {
    try {
      const transporter = await nodemailer.createTransport({
        service: process.env.MAIL_SERVICE,
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT,
        auth: {
          user: process.env.MAIL_ACCOUNT,
          pass: process.env.MAIL_PASSWORD,
        },
      });

      console.log('transporter', transporter);

      switch (forWhat) {
        case 'forgotPassword':
          await forgotPasswordMail(requirements, transporter, res);
          break;
        case 'sendPassword':
          await sendPassword(requirements, transporter, res);
          break;
        case 'contactSupportResponse':
          await sendResponse(requirements, transporter, res);
          break;
      }
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, HTTP_SERVER_ERROR, '', {}, res);
    }
  },
};
