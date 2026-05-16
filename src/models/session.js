'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Session extends Model {
    
    static associate(models) {
      Session.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  }
  Session.init({
    token: {
        allowNull: false,
        type: DataTypes.STRING
    },
    exp_date: {
        type: DataTypes.DATE
    },
    userId: {
        allowNull: false,
        type: DataTypes.INTEGER
    }
  }, {
    sequelize,
    modelName: 'Session',
  });
  return Session;
};