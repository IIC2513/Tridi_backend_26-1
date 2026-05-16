'use strict';

require('dotenv').config();
const bcrypt = require('bcrypt');

const salt_rounds = parseInt(process.env.SALT_ROUNDS);

const salt = bcrypt.genSaltSync(salt_rounds);

const password_1 = 'password123';
const password_2 = 'artist111';
const password_3 = 'jessicamodel12';

const hash_1 = bcrypt.hashSync(password_1, salt);
const hash_2 = bcrypt.hashSync(password_2, salt);
const hash_3 = bcrypt.hashSync(password_3, salt);

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
        'Users', 
        [
          {
            username: 'user123',
            email: 'user123@tridi.cl',
            password: hash_1,
            role: 'user',
            image: '/profile_pictures/icon1.jpg',
            externalId: null,
            seller: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          }, {
            username: 'artist1',
            email: 'artist1@drawik.cl',
            password: hash_2,
            role: 'user',
            image: null,
            externalId: null,
            seller: true,
            createdAt: new Date(),
            updatedAt: new Date(),         
          }, {
            username: 'model2',
            email: 'model2@jessica.cl',
            password: hash_3,
            role: 'user',
            image: '/profile_pictures/icon2.jpg',
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
