'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Card extends Model {
        static associate(models) {
            Card.belongsTo(models.User, { foreignKey: 'userId' });
        }
    }
    Card.init({
        userId: { type: DataTypes.INTEGER, allowNull: false },
        brand: { type: DataTypes.STRING, allowNull: false },    
        last4: { type: DataTypes.STRING(4), allowNull: false },    
        expMonth: { type: DataTypes.INTEGER, allowNull: false },
        expYear: { type: DataTypes.INTEGER, allowNull: false },
        token: { type: DataTypes.STRING, allowNull: false },
    }, {
        sequelize,
        modelName: 'Card',
    });
    return Card;
};