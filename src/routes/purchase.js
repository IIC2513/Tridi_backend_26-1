const express = require('express');
const router = express.Router();
const { Purchase, PurchaseItem, Cart, CartItem, ModelTridi, Card, File, User, Stats } = require('../models');
const { canTransition } = require('../services/purchaseStateMachine');
const mock = require('../services/paymentMock');


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
    await CartItem.destroy({ where: { cartId: cart.id } });
    res.status(201).json(purchase)
});


router.get('/', async (req, res) => {
    res.json(await Purchase.findAll({ where: { buyerId: req.user.id } }));
});

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
        await purchase.update({ status: 'completed' });
        return res.json({ purchase, transactionId: result.transactionId });
    }
    if (purchase.status === 'pending') {
        await purchase.update({ status: 'failed' });
    }
    res.status(402).json({ error: 'Payment failed', reason: result.reason, purchase });
});

router.get('/items/by/:buyerId', async (req, res) => {
    if (Number(req.params.buyerId) !== req.user.id && req.user.role !== 'admin')
        return res.status(403).json({error: "Forbidden"});

    const purchased = await Purchase.findAll({
        where: {
            buyerId: Number(req.params.buyerId),
            status: 'completed'
        },
        include: [
            {
                model: PurchaseItem,
                include: [
                    {
                        model: ModelTridi,
                        include: [
                            {
                                model: User,
                                as: 'creator',
                                attributes: ['username']
                            },
                            {
                                model: File,
                                as: 'files'
                            }
                        ]
                    }
                ]
            }
        ]
    });

    const extractedModels = purchased.flatMap(
        purchase => purchase.PurchaseItems.map(item => item.ModelTridi)
    );

    return res.json(extractedModels);
});

router.put('/:id', async (req, res) => {
    try {
        const purchase = await Purchase.findByPk(req.params.id);
        if (!purchase) {
            return res.status(404).json({ error: 'Purchase not found.' });
        }
        if (purchase.buyerId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const { total, status } = req.body;
        const updates = {};

        if (total !== undefined) {
            const n = Number(total);
            if (isNaN(n) || n < 0) {
                return res.status(422).json({ error: 'Total must be a non-negative number.' });
            }
            updates.total = n;
        }
        if (status !== undefined) {
            if (!canTransition(purchase.status, status)) {
                return res.status(409).json({ error: `Invalid transition: ${purchase.status} → ${status}` });
            }
            updates.status = status === 'paid' ? 'completed' : status;
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update.' });
        }

        await purchase.update(updates);
        res.json(purchase);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const purchase = await Purchase.findByPk(req.params.id);
        if (!purchase) {
            return res.status(404).json({ error: 'Purchase not found.' });
        }
        if (purchase.buyerId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        await purchase.destroy();
        res.status(200).json({ success: 'Purchase successfully deleted.' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.patch('/:id/status', async (req, res) => {
    const { status: target } = req.body;

    const purchase = await Purchase.findByPk(req.params.id, {
        include: [
            {
                model: PurchaseItem,
                include: [
                    {
                        model: ModelTridi
                    }
                ]
            }
        ]
    });

    if (!purchase) {
        return res.status(404).json({ error: "Purchase not found" });
    }
    if (purchase.buyerId !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    if (!canTransition(purchase.status, target)) {
        return res.status(409).json({ error: `Invalid transition: ${purchase.status} → ${target}` });
    }

    if (target === 'completed' && purchase.status !== 'completed') {

        const stats = await Stats.findOne({
            where: { userId: req.user.id }
        });

        if (!stats) {
            return res.status(404).json({ error: 'Stats not found.' });
        }

        const itemsCount = purchase.PurchaseItems.length;

        await stats.update({
            c_purchases: stats.c_purchases + itemsCount
        });

        const salesPerCreator = {};

        for (const item of purchase.PurchaseItems) {
            const creatorId = item.ModelTridi.creatorId;

            salesPerCreator[creatorId] =
                (salesPerCreator[creatorId] || 0) + 1;
        }

        for (const [creatorId, count] of Object.entries(salesPerCreator)) {

            const stats = await Stats.findOne({
                where: {
                    userId: creatorId
                }
            });

            if (stats) {
                await stats.update({
                    c_sales: stats.c_sales + count
                });
            }
        }
    }

    const effectiveStatus = target === 'paid' ? 'completed' : target;
    await purchase.update({ status: effectiveStatus });
    res.json(purchase);
});

module.exports = router;
