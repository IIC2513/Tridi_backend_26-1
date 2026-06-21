'use strict';
const {encrypt} = require('../helpers/handleBcrypt');
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

      User.hasMany(models.Request, {
        foreignKey: 'userId',
        as: 'requests'
      });

      User.hasMany(models.Comment, {
        foreignKey: 'userId',
        as: 'comments'
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
        type: DataTypes.STRING,
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
    externalId: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true
    },
    seller: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
  }, {
    sequelize,
    modelName: 'User',
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) {
                user.password = await encrypt(user.password);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password') && user.password) {
                user.password = await encrypt(user.password);
            }
        },
        afterCreate: async (user, options) => {
            const { Stats } = sequelize.models;

            await Stats.create(
            {
                userId: user.id
            },
            {
                transaction: options.transaction
            });
        }
    },
    defaultScope: {
        attributes: { exclude: ['password'] },
    },
    scopes: {
      withPassword: {
        attributes: {},
      },
    },
  });
  return User;
};
