'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('CartItems', 'CartItems_cartId_fkey');
    await queryInterface.addConstraint('CartItems', {
      fields: ['cartId'],
      type: 'foreign key',
      name: 'CartItems_cartId_fkey',
      references: { table: 'Carts', field: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('CartItems', 'CartItems_cartId_fkey');
    await queryInterface.addConstraint('CartItems', {
      fields: ['cartId'],
      type: 'foreign key',
      name: 'CartItems_cartId_fkey',
      references: { table: 'Carts', field: 'id' },
      onDelete: 'NO ACTION',
      onUpdate: 'NO ACTION',
    });
  },
};