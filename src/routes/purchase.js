const express = require('express');
const router = express.Router();
const { Purchase, PurchaseItem, Cart, CartItem, ModelTridi, Card } = require('../models');
const { canTransition } = require('../services/purchaseStateMachine');
const mock = require('../services/paymentMock');


/**
 * @swagger
 * components:
 *   schemas:
 *     Purchase:
 *       type: object
 *       description: Compra generada por un usuario a partir de los ítems de su carrito.
 *       properties:
 *         id:
 *           type: integer
 *           description: Identificador único de la compra.
 *           example: 1
 *         buyerId:
 *           type: integer
 *           description: ID del usuario que realizó la compra.
 *           example: 42
 *         date:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación de la compra.
 *           example: "2026-06-04T18:30:00.000Z"
 *         total:
 *           type: number
 *           format: double
 *           description: Monto total de la compra (suma de los precios de los modelos).
 *           example: 19990.00
 *         status:
 *           type: string
 *           description: Estado actual de la compra.
 *           enum: [pending, paid, completed, failed, cancelled, refunded]
 *           default: pending
 *           example: pending
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     PurchaseItem:
 *       type: object
 *       description: Ítem individual de una compra (un modelo 3D adquirido), con el precio congelado al momento de la compra.
 *       properties:
 *         id:
 *           type: integer
 *           description: Identificador único del ítem.
 *           example: 10
 *         purchaseId:
 *           type: integer
 *           description: ID de la compra a la que pertenece el ítem.
 *           example: 1
 *         modelId:
 *           type: integer
 *           description: ID del modelo 3D comprado.
 *           example: 7
 *         unitPrice:
 *           type: number
 *           format: double
 *           description: Precio del modelo al momento de la compra.
 *           example: 9990.00
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
/**
 * @openapi
 * /purchases:
 *   post:
 *     summary: Crear una compra a partir del carrito
 *     tags: [Purchases]
 *     description: Toma los ítems del carrito del usuario, calcula el total y crea una compra en estado pending. El carrito no se vacía aquí, sino al pagar.
 *     responses:
 *       201:
 *         description: Compra creada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: integer, example: 1 }
 *                 buyerId: { type: integer, example: 42 }
 *                 date: { type: string, format: date-time }
 *                 total: { type: number, example: 19990.00 }
 *                 status: { type: string, enum: [pending, paid, completed, failed, cancelled, refunded], example: pending }
 *                 createdAt: { type: string, format: date-time }
 *                 updatedAt: { type: string, format: date-time }
 *       422:
 *         description: El carrito está vacío
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: string, example: cart is empty. }
 */
router.post('/', async (req, res) => {
    const buyerId = req.user.id;
    const cart = await Cart.findOne({ where: { userId: buyerId } });
    const items = cart ? await CartItem.findAll({ where: { cartId: cart.id }, include: [{ model: ModelTridi }] }) : [];
    if (items.length === 0) {
        return res.status(422).json({ error: 'cart is empty.' }); // 422 unprocessable content (sintáxis bien pero lógica mal)
    }
    const total = items.reduce((s, i) => s + Number(i.ModelTridi.price), 0);
    const purchase = await Purchase.create({ buyerId, total, status: 'pending' });
    await PurchaseItem.bulkCreate(items.map(i => ({
        purchaseId: purchase.id,
        modelId: i.modelId,
        unitPrice: i.ModelTridi.price,
    })));
    res.status(201).json(purchase)
});


/**
 * @openapi
 * /purchases:
 *   get:
 *     summary: Listar las compras del usuario
 *     tags: [Purchases]
 *     responses:
 *       200:
 *         description: Listado de compras del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id: { type: integer, example: 1 }
 *                   buyerId: { type: integer, example: 42 }
 *                   date: { type: string, format: date-time }
 *                   total: { type: number, example: 19990.00 }
 *                   status: { type: string, enum: [pending, paid, completed, failed, cancelled, refunded], example: pending }
 *                   createdAt: { type: string, format: date-time }
 *                   updatedAt: { type: string, format: date-time }
 */

router.get('/', async (req, res) => {
    res.json(await Purchase.findAll({ where: { buyerId: req.user.id } }));
});


/**
 * @openapi
 * /purchases/{id}:
 *   get:
 *     summary: Obtener una compra por ID
 *     tags: [Purchases]
 *     description: Devuelve una compra del usuario, incluyendo sus ítems (PurchaseItems).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Compra encontrada, con sus ítems incluidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: integer, example: 1 }
 *                 buyerId: { type: integer, example: 42 }
 *                 date: { type: string, format: date-time }
 *                 total: { type: number, example: 19990.00 }
 *                 status: { type: string, enum: [pending, paid, completed, failed, cancelled, refunded], example: pending }
 *                 createdAt: { type: string, format: date-time }
 *                 updatedAt: { type: string, format: date-time }
 *                 PurchaseItems:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: integer, example: 10 }
 *                       purchaseId: { type: integer, example: 1 }
 *                       modelId: { type: integer, example: 7 }
 *                       unitPrice: { type: number, example: 9990.00 }
 *                       createdAt: { type: string, format: date-time }
 *                       updatedAt: { type: string, format: date-time }
 *       403:
 *         description: La compra pertenece a otro usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: string, example: Forbidden }
 *       404:
 *         description: No existe una compra con ese ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: string, example: Purchase not found }
 */
router.get('/:id', async (req, res) => {
    const purchase = await Purchase.findByPk(req.params.id, { include: PurchaseItem });
    if (!purchase) {
        return res.status(404).json({ error: 'Purchase not found' });
    }
    if (purchase.buyerId !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    res.json(purchase);
});


/**
 * @openapi
 * /purchases/{id}/status:
 *   patch:
 *     summary: Cambiar el estado de una compra
 *     tags: [Purchases]
 *     description: Actualiza el estado de la compra validando la transición con la máquina de estados (canTransition).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [pending, paid, completed, failed, cancelled, refunded], example: completed }
 *     responses:
 *       200:
 *         description: Estado actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: integer, example: 1 }
 *                 buyerId: { type: integer, example: 42 }
 *                 date: { type: string, format: date-time }
 *                 total: { type: number, example: 19990.00 }
 *                 status: { type: string, enum: [pending, paid, completed, failed, cancelled, refunded], example: completed }
 *                 createdAt: { type: string, format: date-time }
 *                 updatedAt: { type: string, format: date-time }
 *       403:
 *         description: La compra pertenece a otro usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: string, example: Forbidden }
 *       404:
 *         description: No existe una compra con ese ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: string, example: Purchase not found }
 *       409:
 *         description: Transición de estado inválida desde el estado actual
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: string, example: "Invalid transition: pending → refunded" }
 */
router.patch('/:id/status', async (req, res) => {
    const { status: target } = req.body;
    const purchase = await Purchase.findByPk(req.params.id);
    if (!purchase) {
        return res.status(404).json({ error: "Purchase not found" });
    }
    if (purchase.buyerId !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    if (!canTransition(purchase.status, target)) {
        return res.status(409).json({ error: `Invalid transition: ${purchase.status} → ${target}` });
        // error 409 incompatibilidad con el ESTADO del server, wa cine
    }
    await purchase.update({ status: target });
    res.json(purchase);
});


/**
 * @openapi
 * /purchases/{id}/pay:
 *   post:
 *     summary: Pagar una compra
 *     tags: [Purchases]
 *     description: Cobra el total de la compra con la tarjeta indicada usando el proveedor de pago mock. Si tiene éxito la compra pasa a paid y se vacía el carrito; si falla pasa a failed.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cardId]
 *             properties:
 *               cardId: { type: integer, example: 3 }
 *     responses:
 *       200:
 *         description: Pago exitoso, la compra queda en estado paid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 purchase:
 *                   type: object
 *                   properties:
 *                     id: { type: integer, example: 1 }
 *                     buyerId: { type: integer, example: 42 }
 *                     date: { type: string, format: date-time }
 *                     total: { type: number, example: 19990.00 }
 *                     status: { type: string, enum: [pending, paid, completed, failed, cancelled, refunded], example: paid }
 *                     createdAt: { type: string, format: date-time }
 *                     updatedAt: { type: string, format: date-time }
 *                 transactionId: { type: string, example: txn_a1b2c3 }
 *       402:
 *         description: El pago fue rechazado, la compra pasa a failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: string, example: Payment failed }
 *                 reason: { type: string, example: insufficient_funds }
 *                 purchase:
 *                   type: object
 *                   properties:
 *                     id: { type: integer, example: 1 }
 *                     buyerId: { type: integer, example: 42 }
 *                     date: { type: string, format: date-time }
 *                     total: { type: number, example: 19990.00 }
 *                     status: { type: string, enum: [pending, paid, completed, failed, cancelled, refunded], example: failed }
 *                     createdAt: { type: string, format: date-time }
 *                     updatedAt: { type: string, format: date-time }
 *       403:
 *         description: La compra pertenece a otro usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: string, example: Forbidden }
 *       404:
 *         description: No existe la compra, o la tarjeta no existe / no pertenece al usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: string, enum: [Purchase not found., Card not found.], example: Card not found. }
 *       409:
 *         description: La compra no está en un estado pagable (solo pending o failed lo permiten)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: string, example: Cannot pay a paid purchase }
 */
router.post('/:id/pay', async (req, res) => {
    const purchase = await Purchase.findByPk(req.params.id);
    if (!purchase) {
        return res.status(404).json({ error: 'Purchase not found.' });
    }
    if (purchase.buyerId !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    if (!['pending', 'failed'].includes(purchase.status)) {
        return res.status(409).json({ error: `Cannot pay a ${purchase.status} purchase` });
    }
    
    const card = await Card.findOne({ where: { id: req.body.cardId, userId: req.user.id } });
    if (!card) {
        return res.status(404).json({ error: 'Card not found.' });
    }
    const result = mock.charge({ amount: purchase.total, card });

    if (result.success) {
        await purchase.update({ status: 'paid' });
        const cart = await Cart.findOne({ where: { userId: purchase.buyerId } });
        if (cart) {
            await CartItem.destroy({ where: { cartId: cart.id } });
        }
        return res.json({ purchase, transactionId: result.transactionId });
    }
    if (purchase.status === 'pending') {
        await purchase.update({ status: 'failed' });
    }
    res.status(402).json({ error: 'Payment failed', reason: result.reason, purchase });
});

module.exports = router;