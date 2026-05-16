'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('Users', 'role', {
        type: Sequelize.STRING,
        defaultValue: 'user',
    });

    await queryInterface.changeColumn('Users', 'image', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
    });

    await queryInterface.changeColumn('Users', 'seller', {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    });

    await queryInterface.changeColumn('Users', 'password', {
        allowNull: true,
        type: Sequelize.STRING
    });

    await queryInterface.changeColumn('ModelTridis', 'description', {
        allowNull: true,
        defaultValue: null,
        type: Sequelize.TEXT
    });

    await queryInterface.changeColumn('ModelTridis', 'price', {
        type: Sequelize.FLOAT,
        defaultValue: 0,
        allowNull: false
    });

    await queryInterface.changeColumn('Files', 'size', {
        type: Sequelize.FLOAT,
        allowNull: false
    });

    await queryInterface.changeColumn('Files', 'type', {
        type: Sequelize.STRING,
        allowNull: false
    });

    await queryInterface.changeColumn('Files', 'extension', {
        type: Sequelize.STRING,
        allowNull: false
    });
  },

  async down (queryInterface, Sequelize) {

    await queryInterface.changeColumn('Users', 'role', {
        type: Sequelize.STRING,
    });

    await queryInterface.changeColumn('Users', 'image', {
        type: Sequelize.STRING,
        allowNull: true,
    });

    await queryInterface.changeColumn('Users', 'seller', {
        type: Sequelize.BOOLEAN,
    });

    await queryInterface.changeColumn('Users', 'password', {
        allowNull: false,
        type: Sequelize.STRING
    });

    await queryInterface.changeColumn('ModelTridis', 'description', {
        type: Sequelize.TEXT
    });

    await queryInterface.changeColumn('ModelTridis', 'price', {
        type: Sequelize.INTEGER
    });

    await queryInterface.changeColumn('Files', 'size', {
        type: Sequelize.INTEGER
    });

    await queryInterface.changeColumn('Files', 'type', {
        type: Sequelize.STRING,
    });

    await queryInterface.changeColumn('Files', 'extension', {
        type: Sequelize.STRING,
    });   
  }
};
