'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
        'ModelTridis', 
        [
          {
            name: '',
            description: "",
            creatorId: 1,
            price: 1500,
            date: new Date(),
            tags: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          }, {
            name: '',
            description: "",
            creatorId: 2,
            price: 5500,
            date: new Date(),
            tags: [],
            createdAt: new Date(),
            updatedAt: new Date(),     
          }, {
            name: '',
            description: "",
            creatorId: 1,
            price: 2000,
            date: new Date(),
            tags: [],
            createdAt: new Date(),
            updatedAt: new Date(),    
          }
        ], 
        {}
    );
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('ModelTridis', null, {});
  }
};
