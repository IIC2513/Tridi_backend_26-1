'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
        'Users', 
        [
          {
            username: 'MartinFemish10',
            email: 'martinfem@tridi.cl',
            password: '',
            role: 'user',
            image: '',
            externalId: null,
            seller: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          }, {
            username: 'LuisEsperanza',
            email: 'luise101@drawik.cl',
            password: '',
            role: 'user',
            image: null,
            externalId: null,
            seller: true,
            createdAt: new Date(),
            updatedAt: new Date(),         
          }, {
            username: 'JuanQueen2',
            email: 'juaa444n@jessica.cl',
            password: '',
            role: 'user',
            image: '',
            externalId: null,
            seller: false,
            createdAt: new Date(),
            updatedAt: new Date(),      
          }
        ], 
        {}
    );
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', null, {});
  }
};
