const express = require('express');
const router = express.Router();
const { Cart, CartItem, ModelTridi, File, User } = require('../models');
const authMiddleware = require('../helpers/middlawares/authMiddlaware');


router.use(authMiddleware);

const itemInclude = [
    {
        model: ModelTridi,
        include: [
            { model: File, as: 'files' },
            { model: User, as: 'creator', attributes: ['id', 'username', 'image'] },
        ],
    },
];

async function getOrCreateCart(userId) {
    const [cart] = await Cart.findOrCreate({
        where: { userId },
        defaults: { userId },
    });
    return cart;
}

// GET /cart, retorna carrito con precios (subtotal)
router.get('/', async (req, res) => {
    try {
        const cart = await getOrCreateCart(req.user.id);
        const items = await CartItem.findAll({
            where: { cartId: cart.id },
            include: itemInclude,
            order: [['createdAt', 'ASC']],
        });
        const subtotal = items.reduce((sum, item) => {
            return sum + (item.ModelTridi ? Number(item.ModelTridi.price) : 0);
        }, 0);
        res.status(200).json({ data: { id: cart.id, items, subtotal } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /cart/items  agrega item al carrito
router.post('/items', async (req, res) => {
    try {
        const { modelId } = req.body;
        if (!modelId) {
            return res.status(400).json({ error: 'modelId is required.' });
        }
        const model = await ModelTridi.findByPk(modelId);
        if (!model) {
            return res.status(404).json({ error: '3D Model not found :(' });
        }

        const cart = await getOrCreateCart(req.user.id);
        const existing = await CartItem.findOne({ where: { cartId: cart.id, modelId } });
        if (existing) {
            const item = await CartItem.findByPk(existing.id, { include: itemInclude });
            return res.status(200).json({ data: item, message: 'Already in cart.' });
        }
        const created = await CartItem.create({ cartId: cart.id, modelId });
        const item = await CartItem.findByPk(created.id, { include: itemInclude });
        res.status(201).json({ data: item });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /cart/items/:id eliminar item del carrito
router.delete('/items/:id', async (req, res) => {
    try {
        const cart = await getOrCreateCart(req.user.id);
        const item = await CartItem.findOne({
            where: { id: req.params.id, cartId: cart.id },
        });
        if (!item) return res.status(404).json({ error: 'Cart item not found.' });

        await item.destroy();
        res.status(200).json({ data: { id: Number(req.params.id) } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;