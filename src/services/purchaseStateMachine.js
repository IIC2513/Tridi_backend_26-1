// EL AUTÓMATA DE LAS COMPRAS
const TRANSITIONS = {
    pending: ['paid', 'failed', 'cancelled'],
    failed: ['pending', 'cancelled'], // pending por retry
    paid: ['completed', 'refunded'],
    completed: ['refunded'], // qf
    cancelled: [], // qf
    refunded: [] //qf
}

const canTransition = (from, to) => TRANSITIONS[from]?.includes(to) ?? false;
module.exports = { TRANSITIONS, canTransition };