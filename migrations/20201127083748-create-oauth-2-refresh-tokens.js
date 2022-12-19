'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('oauth2_refresh_tokens', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
      },
      access_token_id: {
        type: Sequelize.STRING,
        references: {
          model: 'oauth2_access_tokens',
          key: 'id',
        },
      },
      user_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      expires_at: {
        type: Sequelize.DATE,
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
    await queryInterface.dropTable('oauth2_refresh_tokens');
  },
};
