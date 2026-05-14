'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ModelTridi extends Model {

    static associate(models) {
      ModelTridi.belongsTo(models.User, {
        foreignKey: 'creatorId',
        as: 'creator'
      });

      ModelTridi.hasMany(models.File, {
        foreignKey: 'modelId',
        as: 'files'
      });
    }
  }
  ModelTridi.init({
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        allowNull: true,
        defaultValue: null,
        type: DataTypes.TEXT
    },
    creatorId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    price: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
        allowNull: false,
        validate: {
            min: 0
        }
    },
    date: {
        type: DataTypes.DATE,
    },
    tags: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
    },
  }, {
    sequelize,
    modelName: 'ModelTridi',
  });
  return ModelTridi;
};