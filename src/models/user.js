'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {

    static associate(models) {
      User.hasMany(models.ModelTridi, {
        foreignKey: 'creatorId',
        as: 'creations'
      });

      User.hasMany(models.Session, {
        foreignKey: 'userId',
        as: 'sessions'
      });

      User.hasOne(models.Stats, {
        foreignKey: 'userId',
        as: 'stats'
      });

    }
  }
  User.init({
    username: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
    },
    email: {
        type:DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: {
            isEmail: true
        }
    },
    password: {
        allowNull: true,
        type: DataTypes.STRING
    },
    role: {
        defaultValue: 'user',
        type:DataTypes.STRING,
    },
    image: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
        validate: {
            isUrl: true
        }},
    tridicoins: {
        type: DataTypes.INTEGER,
        validate: {
            min: 0
        }
    },
    seller: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};