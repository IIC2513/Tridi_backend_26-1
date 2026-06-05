'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up (queryInterface, Sequelize) {
        await queryInterface.bulkInsert('Cards', [
            { userId: 1, brand: 'visa', last4: '4201', expMonth: 12, expYear: 2030, token: 'mocktok_ok', createdAt: new Date(), updatedAt: new Date() },
            { userId: 1, brand: 'visa', last4: '6767', expMonth: 12, expYear: 2050, token: 'mocktok_declined', createdAt: new Date(), updatedAt: new Date() },
        ]);
    },

    async down (queryInterface, Sequelize) {
        await queryInterface.bulkDelete('Cards', { token: ['totallyrealtoken_accepted', 'totallyrealtoken_declined'] });
      },
};
