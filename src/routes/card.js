const express = require('express');
const router = express.Router();
const { Card } = require('../models');
const authMiddleware = require('../helpers/middlawares/authMiddlaware');

router.use(authMiddleware);

/**
 * @openapi
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     Card:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 1 }
 *         brand: { type: string, enum: [visa, mastercard, amex, card], example: visa }
 *         last4: { type: string, example: "6767" }
 *         expMonth: { type: integer, example: 8 }
 *         expYear: { type: integer, example: 2030' }
 *         userId: { type: integer, example: 3 }
 *         createdAt: { type: string, format: date-time }
 */
function detectBrand(number) {
    if (number.startsWith('4')) return 'visa';
    if (/^5[1-5]/.test(number)) return 'mastercard';
    if (/^3[47]/.test(number)) return 'amex';
    return 'card';
} // aquí me ayudo el tío


/**
 * @openapi
 * /cards:
 *   get:
 *     summary: Muestra las tarjetas guardadas del usuario autenticado
 *     tags: [Cards]
 *     responses:
 *       200:
 *         description: Tarjetas perteneciente al usuario, de más vieja a nueva
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: integer, example: 1 }
 *                       brand: { type: string, example: visa }
 *                       last4: { type: string, example: "6767" }
 *                       expMonth: { type: integer, example: 8 }
 *                       expYear: { type: integer, example: 2030 }
 *                       userId: { type: integer, example: 3 }
 *                       createdAt: { type: string, format: date-time }
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { Internal server error }
 */
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




/**
 * @openapi
 * /cards:
 *   post:
 *     summary: Guarda tarjeta para el usuario autenticado
 *     tags: [Cards]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [number, expMonth, expYear]
 *             properties:
 *               number:
 *                 type: string
 *                 description: 13-19 dígitos, los espacios se borran solos (tal vez sería bueno 
 *                  agregar automáticamente).
 *                 example: "6792 0082 8392 0067"
 *               expMonth: { type: integer, min: 1, max: 12, example: 8 }
 *               expYear: { type: integer, min: 2000, max: 2099, example: 2027 }
 *     responses:
 *       201:
 *         description: Se creó existosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: { type: integer, example: 1 }
 *                     brand: { type: string, example: visa }
 *                     last4: { type: string, example: "4242" }
 *                     expMonth: { type: integer, example: 8 }
 *                     expYear: { type: integer, example: 2027 }
 *       400:
 *         description: falta alguno de los campos number, expMonth and expYear
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: number, expMonth and expYear are required }
 *       422:
 *         description: Número, mes o año de tarjeta inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: invalid card number. }
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: Internal server error }
 */
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


/**
 * @openapi
 * /cards/{id}:
 *   delete:
 *     summary: Borra una tarjeta del usuario auténticado
 *     tags: [Cards]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Tarjeta borrada, imprime la id
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: { type: integer, example: 1 }
 *       404:
 *         description: Card not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: Card not found. }
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: Internal server error }
 */
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