'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
        'Stats', 
        [
          {
            c_sales: 5,
            c_purchases: 3,
            reputation: 3,
            userId: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          }, {
            c_sales: 3,
            c_purchases: 5,
            reputation: 2,
            userId: 2,
            createdAt: new Date(),
            updatedAt: new Date(),       
          }, {
            c_sales: 0,
            c_purchases: 12,
            reputation: 2,
            userId: 3,
            createdAt: new Date(),
            updatedAt: new Date(),    
          }
        ], 
        {}
    );
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Stats', null, {});
  }
};
