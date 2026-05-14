'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
        'Files', 
        [
          {
            modelId: 1,
            route: '',
            size: 3,
            extension: 'gbl',
            createdAt: new Date(),
            updatedAt: new Date(),
          }, {
            modelId: 2,
            route: '',
            size: 1,
            extension: '',
            createdAt: new Date(),
            updatedAt: new Date(),   
          }, {
            modelId: 2,
            route: '',
            size: 1,
            extension: '',
            createdAt: new Date(),
            updatedAt: new Date(),  
          }, {
            modelId: 3,
            route: '',
            size: 1,
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
