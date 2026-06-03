'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PurchaseItem extends Model {
    static associate(models) {
      PurchaseItem.belongsTo(models.Purchase, { foreignKey: 'purchaseId' });
      PurchaseItem.belongsTo(models.ModelTridi, { foreignKey: 'modelId' });
    }
  }
  PurchaseItem.init({
    purchaseId: { type: DataTypes.INTEGER, allowNull: false },
    modelId: { type: DataTypes.INTEGER, allowNull: false },
    unitPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  }, {
    sequelize,
    modelName: 'PurchaseItem',
  });
  return PurchaseItem;
};