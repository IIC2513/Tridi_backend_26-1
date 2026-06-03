function charge({ amount, token }) {
  if (token === 'tok_fail') {
    return { success: false, reason: 'card_declined' };
  }
  return { success: true, transactionId: `mock_${Date.now()}` };
}
module.exports = { charge };