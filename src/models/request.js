'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Request extends Model {

    static associate(models) {
      Request.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  }
  Request.init({
    type: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    content: DataTypes.TEXT,
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
      allowNull: false, 
      defaultValue: 'pending',
    },
    userId: {
        allowNull: false,
        type: DataTypes.INTEGER
    }
  }, {
    sequelize,
    modelName: 'Request',
  });
  return Request;
};