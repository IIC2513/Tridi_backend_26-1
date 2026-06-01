'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PurchaseItem extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
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