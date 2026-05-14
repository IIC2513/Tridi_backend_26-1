const jwt = require('jsonwebtoken');
const dayjs = require('dayjs');
const { Session } = require('../models');

function createSessionToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

async function createSession(user) {
    return await Session.create({
        userId: user.id,
        token: createSessionToken(user.id),
        exp_date: dayjs().add(1, 'hour').toDate()
    });
}

module.exports = { createSessionToken, createSession };
