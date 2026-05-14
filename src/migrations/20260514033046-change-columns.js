'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {

    await queryInterface.removeColumn('Users', 'tridicoins');
    await queryInterface.removeColumn('Files', 'name');

    await queryInterface.addColumn('Users', 'externalId', {
        type: Sequelize.UUID,
        unique: true,
        allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {

    await queryInterface.removeColumn('Users', 'externalId');

    await queryInterface.addColumn('Files', 'name', {
        allowNull: false,
        type: Sequelize.STRING
    });

    await queryInterface.addColumn('Users', 'tridicoins', {
        type: Sequelize.INTEGER,
    });
  }
};
