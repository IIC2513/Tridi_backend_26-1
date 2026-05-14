'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
        'Sessions', 
        [
          {
            token: 'session_token_1',
            exp_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            userId: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          }, {
            token: 'session_token_2',
            exp_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            userId: 2,
            createdAt: new Date(),
            updatedAt: new Date(),      
          }, {
            token: 'session_token_3',
            exp_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            userId: 3,
            createdAt: new Date(),
            updatedAt: new Date(),     
          }, {
            token: 'session_token_11',
            exp_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            userId: 1,
            createdAt: new Date(),
            updatedAt: new Date(),     
          }, {
            token: 'session_token_31',
            exp_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            userId: 3,
            createdAt: new Date(),
            updatedAt: new Date(),     
          }
        ], 
        {}
    );
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Sessions', null, {});
  }
};
