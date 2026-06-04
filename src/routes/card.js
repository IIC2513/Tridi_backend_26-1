const express = require('express');
const router = express.Router();
const { Card } = require('../models');
const authMiddleware = require('../helpers/middlawares/authMiddlaware');

router.use(authMiddleware);


function detectBrand(number) {
    if (number.startsWith('4')) return 'visa';
    if (/^5[1-5]/.test(number)) return 'mastercard';
    if (/^3[47]/.test(number)) return 'amex';
    return 'card';
} // aquí me ayudo el tío

router.get('/', async (req, res) => {
    try {
        const cards = await Card.findAll({
            where: { userId: req.user.id },
            attributes: ['id', 'brand', 'last4', 'expMonth', 'expYear', 'createdAt', 'userId'],
            order: [['createdAt', 'ASC']],
        });
        res.json({ data: cards });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/', async (req, res) => {
    try {
        const { number, expMonth, expYear } = req.body;
        if (!number || !expMonth || !expYear) {
            return res.status(400).json({ error: 'number, expMonth and expYear are required.' });
        }
        const digits = String(number).replace(/\s+/g, '');
        if (!/^\d{13,19}$/.test(digits)) { // 13-19 digitos consecutivous
            return res.status(422).json({ error: 'invalid card number.' });
        }

        const month = Number(expMonth);
        const year = Number(expYear);

        if (!Number.isInteger(month) || month < 1 || month > 12) {
            return res.status(422).json({ error: 'invalid expiry month.' });
        }
        if (!Number.isInteger(year) || year < 2000 || year > 2099) {
            return res.status(422).json({ error: 'invalid expiry year.' });
        }

        const now = new Date();
        const curYear = now.getFullYear();
        const curMonth = now.getMonth() + 1;
        if (year < curYear || (year === curYear && month < curMonth)) {
            return res.status(422).json({ error: 'card has expired.' });
        }
        const card = await Card.create({
            userId: req.user.id,
            brand: detectBrand(digits),
            last4: digits.slice(-4),
            expMonth: Number(expMonth),
            expYear: Number(expYear),
            token: 'totallyrealtoken' + Math.random().toString(36).slice(2, 12),
        });
        res.status(201).json({
            data: {
                id: card.id,
                brand: card.brand,
                last4: card.last4,
                expMonth: card.expMonth,
                expYear: card.expYear,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const card = await Card.findOne({ where: { id: req.params.id, userId: req.user.id } });
        if (!card) return res.status(404).json({ error: 'Card not found.' });
        await card.destroy();
        res.json({ data: { id: Number(req.params.id) } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;