'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Purchase extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Purchase.belongsTo(models.User, { foreignKey: 'buyerId' });
      Purchase.hasMany(models.PurchaseItem, { foreignKey: 'purchaseId' });
    }
  }
  Purchase.init({
    buyerId: { type: DataTypes.INTEGER, allowNull: false },
    date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    total: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    status: {
      type: DataTypes.ENUM('pending', 'paid', 'completed', 'failed', 'cancelled', 'refunded'),
      allowNull: false, defaultValue: 'pending',
    },
  }, {
    sequelize,
    modelName: 'Purchase',
  });
  return Purchase;
};