'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
        'Files', 
        [
          {
            modelId: 1,
            route: '/models/cellphone.glb',
            size: 3.76,
            extension: 'glb',
            createdAt: new Date(),
            updatedAt: new Date(),
          }, {
            modelId: 2,
            route: '/models/shiba.glb',
            size: 1.88,
            extension: 'glb',
            createdAt: new Date(),
            updatedAt: new Date(),   
          }, {
            modelId: 2,
            route: '/models/Shiba.usdz',
            size: 0.376,
            extension: 'usdz',
            createdAt: new Date(),
            updatedAt: new Date(),  
          }, {
            modelId: 3,
            route: '/models/low-poly_truck_car_drifter.glb',
            size: 1.34,
            extension: 'glb',
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
