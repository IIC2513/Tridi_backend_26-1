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

      ModelTridi.hasMany(models.Comment, {
        foreignKey: 'modelId',
        as: 'comments'
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
          type: process.env.NODE_ENV === 'test'
              ? DataTypes.JSON
              : DataTypes.ARRAY(DataTypes.STRING),
          allowNull: false,
          defaultValue: [],
      },
  }, {
    sequelize,
    modelName: 'ModelTridi',
  });
  return ModelTridi;
};
