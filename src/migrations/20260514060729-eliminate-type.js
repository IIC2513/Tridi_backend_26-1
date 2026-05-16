'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Files', 'type');
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.addColumn('Files', 'type', {
        type: Sequelize.STRING,
        allowNull: false
    });
  }
};
