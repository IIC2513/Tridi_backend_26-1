'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
        'ModelTridis', 
        [
          {
            name: 'Old Cellphone',
            description: "By chaschinkaa in Sketchfab.com",
            creatorId: 1,
            price: 15,
            date: new Date(),
            tags: ["cellphone", "blender", "mobile", "gameasset", "low-poly"],
            createdAt: new Date(),
            updatedAt: new Date(),
          }, {
            name: '',
            description: "",
            creatorId: 2,
            price: 22.5,
            date: new Date(),
            tags: [],
            createdAt: new Date(),
            updatedAt: new Date(),     
          }, {
            name: '',
            description: "",
            creatorId: 1,
            price: 20,
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
