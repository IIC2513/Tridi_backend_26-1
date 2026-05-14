'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
        'Files', 
        [
          {
            modelId: 1,
            name: '',
            route: '',
            size: 1500,
            type: '',
            extension: '',
            createdAt: new Date(),
            updatedAt: new Date(),
          }, {
            modelId: 2,
            name: '',
            route: '',
            size: 1500,
            type: '',
            extension: '',
            createdAt: new Date(),
            updatedAt: new Date(),   
          }, {
            modelId: 2,
            name: '',
            route: '',
            size: 1,
            type: '',
            extension: '',
            createdAt: new Date(),
            updatedAt: new Date(),  
          }, {
            modelId: 3,
            name: '',
            route: '',
            size: 1500,
            type: '',
            extension: '',
            createdAt: new Date(),
            updatedAt: new Date(),  
          }
        ], 
        {}
    );
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Files', null, {});
  }
};
