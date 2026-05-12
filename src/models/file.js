'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class File extends Model {

    static associate(models) {
      File.belongsTo(models.ModelTridi, {
        foreignKey: 'modelId',
        as: 'model'
      });
    }
  }
  File.init({
    modelId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    name: {
        allowNull: false,
        type: DataTypes.STRING
    },
    route: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isUrl: true
        }
    },
    size: {
        type: DataTypes.INTEGER,
        validate: {
            min: 0
        }
    },
    type: {
        type: DataTypes.STRING
    },
    extension: {
        type: DataTypes.STRING
    }
  }, {
    sequelize,
    modelName: 'File',
  });
  return File;
};