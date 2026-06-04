exports.charge = ({ amount, card }) => {
    if (card.last4 === '6767') { // falla siempre si 6767 por temas de demo
        return { success: false, reason: 'card_declined' };
    }
    return { success: true, transactionId: 'mocktx' + Date.now() }; // TX TRANSACCIÓN BDD IIC2413
};