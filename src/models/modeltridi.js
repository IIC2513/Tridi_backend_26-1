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
        type: DataTypes.TEXT
    },
    creatorId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    price: {
        type: DataTypes.INTEGER,
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