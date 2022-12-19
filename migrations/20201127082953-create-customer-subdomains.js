'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('customer_subdomains', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      subdomain: {
        type: Sequelize.STRING,
      },
      logo: {
        type: Sequelize.STRING,
      },
      feature_image: {
        type: Sequelize.STRING,
      },
      user_accounts_limit: {
        type: Sequelize.INTEGER,
      },
      social_media_profiles_limit: {
        type: Sequelize.INTEGER,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('customer_subdomains');
  },
};
