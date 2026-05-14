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
    route: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isUrl: true
        }
    },
    size: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validate: {
            min: 0
        }
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    extension: {
        type: DataTypes.STRING,
        allowNull: false
    }
  }, {
    sequelize,
    modelName: 'File',
  });
  return File;
};