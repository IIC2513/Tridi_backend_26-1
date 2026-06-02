'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CartItem extends Model {
    static associate(models) {
      CartItem.belongsTo(models.Cart, { foreignKey: 'cartId' });
      CartItem.belongsTo(models.ModelTridi, { foreignKey: 'modelId' });
    }
  }
  CartItem.init({
    cartId: { type: DataTypes.INTEGER, allowNull: false },
    modelId: { type: DataTypes.INTEGER, allowNull: false }
  }, {
    sequelize,
    modelName: 'CartItem',
  });
  return CartItem;
};