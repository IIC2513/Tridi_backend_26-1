'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Comment extends Model {

    static associate(models) {
      Comment.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });

      Comment.belongsTo(models.ModelTridi, {
        foreignKey: 'modelId',
        as: 'model'
      });
    }
  }
  Comment.init({
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    modelId: {
        allowNull: false,
        type: DataTypes.INTEGER
    },
    userId: {
        allowNull: false,
        type: DataTypes.INTEGER
    }
  }, {
    sequelize,
    modelName: 'Comment',
  });
  return Comment;
};