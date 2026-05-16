'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('Users', 'externalId', {
        type: Sequelize.STRING,
        unique: true,
        allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn('Users', 'externalId', {
        type: Sequelize.UUID,
        unique: true,
        allowNull: true
    });
  }
};
