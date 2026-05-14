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
            tridicoins: 2500,
            seller: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          }, {
            username: 'LuisEsperanza',
            email: 'luise101@drawik.cl',
            password: '',
            role: 'user',
            image: null,
            tridicoins: 5600,
            seller: true,
            createdAt: new Date(),
            updatedAt: new Date(),         
          }, {
            username: 'JuanQueen2',
            email: 'juaa444n@jessica.cl',
            password: '',
            role: 'user',
            image: '',
            tridicoins: 3400,
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
