const ejs = require('ejs');
module.exports = {
  forgotPasswordMail: async (requirements, transporter, res) => {
    try {
      const data = await ejs.renderFile('./public/ejs/forgotPassword.ejs', {
        name: requirements.user.first_name,
        email: requirements.user.email,
        link:
          !requirements.customerSubDomain ?
            `${process.env.APP_URL}/change-password-from-mail?Authorization=${requirements.token}` :
            `${process.env.WEB_SCHEME}://${requirements.customerSubDomain}.${process.env.APP_DOMAIN}/change-password-from-mail?Authorization=${requirements.token}`
      });
      if (data) {
        const mainOptions = {
          from: `"${process.env.MAIL_NAME}" <${process.env.MAIL_FROM}>`,
          to: requirements.user.email,
          subject: 'Reset Password',
          html: data,
        };
        await transporter.sendMail(mainOptions);
        logger.info('Forgot password mail sent');
        return 0;
      } else {
        logger.error('ejsFunction error');
      }
    } catch (error) {
      logger.error(error);
    }
  },
  sendPassword: async (requirements, transporter, res) => {
    try {
      const appUrlSplit = process.env.APP_URL.split('://');

      const clientURL = requirements.newUser.subdomain ? `${appUrlSplit[0]}://${requirements.newUser.subdomain.replace(/\s/gi, '')}.${appUrlSplit[1]}/login` : `${appUrlSplit[0]}://${appUrlSplit[1]}/login`;
      const data = await ejs.renderFile('./public/ejs/sendPassword.ejs', {
        name: requirements.newUser.first_name,
        email: requirements.newUser.email,
        subdomain: requirements.newUser.subdomain ? requirements.newUser.subdomain : '',
        password: requirements.password,
        client_url: clientURL,
      });

      if (data) {
        const mainOptions = {
          from: `"${process.env.MAIL_NAME}" <${process.env.MAIL_FROM}>`,
          to: requirements.newUser.email,
          subject: 'Password',
          html: data,
        };
        await transporter.sendMail(mainOptions);
        logger.info('password of user mail sent');
        return 0;
      } else {
        logger.error('ejsFunction error');
      }
    } catch (error) {
      logger.error(error);
    }
  },
  sendResponse: async (requirements, transporter, res) => {
    try {
      const data = await ejs.renderFile('./public/ejs/sendResponse.ejs', {
        name: requirements.data.first_name + ' ' + requirements.data.last_name,
        email: requirements.data.email,
        response: requirements.response,
        question: requirements.data.message
      });
      if (data) {
        const mainOptions = {
          from: `"${process.env.MAIL_NAME}" <${process.env.MAIL_FROM}>`,
          to: requirements.data.email,
          subject: 'RE: Contact Support',
          html: `<h3>Question: ${requirements.data.message}</h3>\n <p>${requirements.response}</p>`,
        };
        await transporter.sendMail(mainOptions);
        logger.info('contact support response sent');
        return 0;
      } else {
        logger.error('ejsFunction error');
      }
    } catch (error) {
      logger.error(error);
    }
  },
};
