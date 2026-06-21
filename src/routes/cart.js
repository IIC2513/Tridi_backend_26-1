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

router.post('/items', async (req, res) => {
  try {
    const { modelId } = req.body;
    if (!modelId) {
      return res.status(400).json({ error: 'modelId is required.' });
    }
    const model = await ModelTridi.findByPk(modelId, { include: itemInclude[0].include });
    if (!model) {
      return res.status(404).json({ error: '3D Model not found :(' });
    }
    const cart = await getOrCreateCart(req.user.id);
    const existing = await CartItem.findOne({ where: { cartId: cart.id, modelId } });
    if (existing) {
      return res.status(200).json({
        data: { id: existing.id, cartId: cart.id, modelId, createdAt: existing.createdAt, ModelTridi: model },
        message: 'Already in cart.',
      });
    }
    const created = await CartItem.create({ cartId: cart.id, modelId });
    res.status(201).json({
      data: { id: created.id, cartId: cart.id, modelId, createdAt: created.createdAt, ModelTridi: model },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/items/:id', async (req, res) => {
  try {
    const cart = await Cart.findOne({ where: { userId: req.user.id } });
    if (cart) {
      await CartItem.destroy({ where: { id: req.params.id, cartId: cart.id } });
    }
    res.status(200).json({ data: { id: Number(req.params.id) } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;