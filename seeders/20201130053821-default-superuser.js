'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('users', [{
      email: 'sadmin@gmail.com',
      password: '$2b$10$pLtdRoUPYsxUqSgWmJBVLeaymeiGGMOA6hne7lYVozuitqWBLgh6G',
      role: 'super-admin',
      created_at: new Date(),
      updated_at: new Date(),
      timezone: "Australia/Sydney",
    }], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', null, {});
  },
};
