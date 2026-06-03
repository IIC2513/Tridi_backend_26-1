const { Purchase, PurchaseItem, CartItem } = require('../models');
const { canTransition } = require('../services/purchaseStateMachine');
const mock = require('../services/paymentMock');

async function create(req, res) {
    const buyerId = req.user.id;
    const items = await CartItem.findAll({ where: { userId: buyerId} });
    if (items.length === 0) {
        return res.status(422).json({ error: 'cart is empty.' }); // 422 unprocessable content (sintáxis bien pero lógica mal)
    }

    const total = items.reduce((s, i) => s + Number(i.price) * i.quantity, 0); // mm funsional mm λλλ
    const purchase = await Purchase.create({ buyerId, total, status: 'pending' });
    await PurchaseItem.bulkCreate(items.map(i => ({
        purchase: purchase.id, modelId: i.modelId, quantity: i.quantity, price: i.price,
    })));
}

async function index(req, res) {
  res.json(await Purchase.findAll({ where: { buyerId: req.user.id } }));
}
async function show(req, res) {
  const purchase = await Purchase.findByPk(req.params.id, { include: PurchaseItem });
  if (!purchase) {
    return res.status(404).json({ error: 'Purchase not found' });
  }
  if (purchase.buyerId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json(purchase);
}

async function transition(req, res) {
    const { status: target } = req.body;
    const purchase = await Purchase.findByPk(req.params.id);
    if (!purchase) {
        return res.status(404).json({ error: "Purchase not found" });
    }
}