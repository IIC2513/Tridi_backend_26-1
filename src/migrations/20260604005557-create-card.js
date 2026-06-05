'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
      await queryInterface.createTable('Cards', {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
          userId: { type: Sequelize.INTEGER, allowNull: false },
          brand: { type: Sequelize.STRING, allowNull: false },
          last4: { type: Sequelize.STRING(4), allowNull: false },
          expMonth: { type: Sequelize.INTEGER, allowNull: false },
          expYear: { type: Sequelize.INTEGER, allowNull: false },
          token: { type: Sequelize.STRING, allowNull: false },
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false },
      });
  },

  async down (queryInterface, Sequelize) {
      await queryInterface.dropTable('Cards');
  }
};
