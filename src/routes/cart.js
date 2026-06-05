const express = require('express');
const router = express.Router();
const { Cart, CartItem, ModelTridi, File, User } = require('../models');
const authMiddleware = require('../helpers/middlawares/authMiddlaware');


router.use(authMiddleware);

/**
 * @openapi
 * components:
 *   schemas:
 *     CartItem:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 5 }
 *         cartId: { type: integer, example: 1 }
 *         modelId: { type: integer, example: 12 }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     Cart:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 1 }
 *         userId: { type: integer, example: 3 }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 */

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

/**
 * @openapi
 * /cart:
 *   get:
 *     summary: Obtener el carrito del usuario
 *     tags: [Cart]
 *     responses:
 *       200:
 *         description: Tu carrito con los items y el subtotal ya calculado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: { type: integer, example: 1 }
 *                     subtotal: { type: number, example: 49.97 }
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: integer, example: 5 }
 *                           cartId: { type: integer, example: 1 }
 *                           modelId: { type: integer, example: 12 }
 *                           createdAt: { type: string, format: date-time }
 *                           ModelTridi:
 *                             type: object
 *                             properties:
 *                               id: { type: integer, example: 12 }
 *                               price: { type: number, example: 19.99 }
 *                               files:
 *                                 type: array
 *                                 items: { type: object }
 *                               creator:
 *                                 type: object
 *                                 properties:
 *                                   id: { type: integer, example: 3 }
 *                                   username: { type: string, example: Yadran Eterovic }
 *                                   image: { type: string }
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: Internal server error }
 */
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

/**
 * @openapi
 * /cart/items:
 *   post:
 *     summary: Agregar un modelo al carrito
 *     tags: [Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [modelId]
 *             properties:
 *               modelId: { type: integer, example: 12 }
 *     responses:
 *       201:
 *         description: Modelo agregado al carrito
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: { type: integer, example: 5 }
 *                     cartId: { type: integer, example: 1 }
 *                     modelId: { type: integer, example: 12 }
 *                     createdAt: { type: string, format: date-time }
 *                     ModelTridi:
 *                       type: object
 *                       properties:
 *                         id: { type: integer, example: 12 }
 *                         price: { type: number, example: 19.99 }
 *                         files:
 *                           type: array
 *                           items: { type: object }
 *                         creator:
 *                           type: object
 *                           properties:
 *                             id: { type: integer, example: 3 }
 *                             username: { type: string, example: johndoe }
 *                             image: { type: string }
 *       200:
 *         description: El modelo ya estaba en el carrito
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: object }
 *                 message: { type: string, example: Already in cart. }
 *       400:
 *         description: modelId is required.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { modelId is required. }
 *       404:
 *         description: 3D Model not found :(
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { 3D Model not found :( }
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: Internal server error }
 */
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

/**
 * @openapi
 * /cart/items/{id}:
 *   delete:
 *     summary: Sacar un item del carrito
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Item eliminado, imprime el id eliminado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: { type: integer, example: 5 }
 *       404:
 *         description: Cart item not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { Cart item not found. }
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { Internal server error }
 */
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