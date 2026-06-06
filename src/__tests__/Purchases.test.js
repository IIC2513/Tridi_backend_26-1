let mockUser;
jest.mock('../helpers/middlawares/authMiddlaware.js', () => (req, _res, next) => {
  req.user = mockUser;
  next();
});
jest.mock('../services/paymentMock.js', () => ({ charge: jest.fn() }));

const app = require('../app.js');
const mock = require('../services/paymentMock.js');
const {
  sequelize, User, Cart, CartItem, ModelTridi, Purchase, PurchaseItem, Card,
} = require('../models');

const BASE = '/purchases';

let server, baseUrl;
async function api(method, path, body) {
  const res = await fetch(baseUrl + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch {}
  return { status: res.status, body: data };
}

beforeAll(async () => {
  try {
    await sequelize.sync({ force: true });
  } catch (e) {
    console.error('SYNC FAILED:', e.parent?.message || e.message);
    throw e;
  }
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});
beforeEach(async () => {
  await sequelize.sync({ force: true });
  mock.charge.mockReset();
});
afterAll(async () => {
  if (server) await new Promise((r) => server.close(r));
  await sequelize.close();
});

async function seedBuyer() {
  const buyer = await User.create({ username: `buyer${Date.now()}`, email: `b${Date.now()}@t.com`, password: 'x' });
  const model = await ModelTridi.create({ name: 'Cube', price: 1500 });
  const cart = await Cart.create({ userId: buyer.id });
  await CartItem.create({ cartId: cart.id, modelId: model.id });
  const card = await Card.create({
    userId: buyer.id,
    brand: 'visa',
    last4: '6700',
    expMonth: 12,
    expYear: 2030,
    token: 'tok_incognito',
  });
  return { buyer, model, cart, card };
}

describe('POST /purchases', () => {
  test('422 cuando el carro esta vacío', async () => {
    const buyer = await User.create({ username: 'eb', email: 'eb@t.com', password: 'x' });
    await Cart.create({ userId: buyer.id });
    mockUser = { id: buyer.id };

    const res = await api('POST', BASE);
    expect(res.status).toBe(422);
  });

  test('201 crea una compra pendiente con items y vacía el carrito', async () => {
    const { buyer, cart } = await seedBuyer();
    mockUser = { id: buyer.id };

    const res = await api('POST', BASE);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('pending');
    expect(Number(res.body.total)).toBe(1500);

    const items = await PurchaseItem.findAll({ where: { purchaseId: res.body.id } });
    expect(items).toHaveLength(1);
    expect(Number(items[0].unitPrice)).toBe(1500);

    const remaining = await CartItem.findAll({ where: { cartId: cart.id } });
    expect(remaining).toHaveLength(0);
  });
});

describe('GET /purchases', () => {
  test('retorna las compras del usuario actual y sólo del usuario actual', async () => {
    const a = await User.create({ username: 'eb', email: 'eb@t.com', password: 'x' });
    const b = await User.create({ username: 'yadran', email: 'b@t.com', password: 'x' });
    await Purchase.create({ buyerId: a.id, total: 100, status: 'pending' });
    await Purchase.create({ buyerId: b.id, total: 200, status: 'pending' });
    mockUser = { id: a.id };

    const res = await api('GET', BASE);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].buyerId).toBe(a.id);
  });
});

describe('GET /purchases/:id', () => {
  test('404 cuando no se encuentra', async () => {
    const u = await User.create({ username: 'eb', email: 'u@t.com', password: 'x' });
    mockUser = { id: u.id };
    const res = await api('GET', `${BASE}/999999`);
    expect(res.status).toBe(404);
  });

  test('403 cuando es de alguien más', async () => {
    const owner = await User.create({ username: 'eb', email: 'eb@t.com', password: 'x' });
    const other = await User.create({ username: 'yadran', email: 'x@t.com', password: 'x' });
    const p = await Purchase.create({ buyerId: owner.id, total: 100, status: 'pending' });
    mockUser = { id: other.id };
    const res = await api('GET', `${BASE}/${p.id}`);
    expect(res.status).toBe(403);
  });

  test('200 para el dueño', async () => {
    const owner = await User.create({ username: 'eb', email: 'eb@t.com', password: 'x' });
    const p = await Purchase.create({ buyerId: owner.id, total: 100, status: 'pending' });
    mockUser = { id: owner.id };
    const res = await api('GET', `${BASE}/${p.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(p.id);
    expect(Array.isArray(res.body.PurchaseItems)).toBe(true);
  });
});

describe('PATCH /purchases/:id/status', () => {
  test('409 o transición inválida', async () => {
    const owner = await User.create({ username: 'eb', email: 'o@t.com', password: 'x' });
    const p = await Purchase.create({ buyerId: owner.id, total: 100, status: 'pending' });
    mockUser = { id: owner.id };
    const res = await api('PATCH', `${BASE}/${p.id}/status`, { status: 'shipped' });
    expect(res.status).toBe(409);
  });

  test('200 en transición válida', async () => {
    const owner = await User.create({ username: 'eb', email: 'o@t.com', password: 'x' });
    const p = await Purchase.create({ buyerId: owner.id, total: 100, status: 'pending' });
    mockUser = { id: owner.id };
    const res = await api('PATCH', `${BASE}/${p.id}/status`, { status: 'cancelled' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('cancelled');
  });
});

describe('POST /purchases/:id/pay', () => {
  test('200 hace el cobro y transiciona a pagado', async () => {
    const { buyer, card } = await seedBuyer();
    const p = await Purchase.create({ buyerId: buyer.id, total: 1500, status: 'pending' });
    mockUser = { id: buyer.id };
    mock.charge.mockReturnValue({ success: true, transactionId: 'tx_123' });

    const res = await api('POST', `${BASE}/${p.id}/pay`, { cardId: card.id });

    expect(res.status).toBe(200);
    expect(res.body.transactionId).toBe('tx_123');
    expect(res.body.purchase.status).toBe('paid');
    expect(mock.charge).toHaveBeenCalled();
  });

  test('402 marca compra como pendiente si la tarjeta lo rechaza', async () => {
    const { buyer, card } = await seedBuyer();
    const p = await Purchase.create({ buyerId: buyer.id, total: 1500, status: 'pending' });
    mockUser = { id: buyer.id };
    mock.charge.mockReturnValue({ success: false, reason: 'insufficient_funds' });

    const res = await api('POST', `${BASE}/${p.id}/pay`, { cardId: card.id });

    expect(res.status).toBe(402);
    expect(res.body.reason).toBe('insufficient_funds');
    await p.reload();
    expect(p.status).toBe('failed');
  });

  test('409 si la compra ya está pagada', async () => {
    const { buyer, card } = await seedBuyer();
    const p = await Purchase.create({ buyerId: buyer.id, total: 1500, status: 'paid' });
    mockUser = { id: buyer.id };

    const res = await api('POST', `${BASE}/${p.id}/pay`, { cardId: card.id });

    expect(res.status).toBe(409);
    expect(mock.charge).not.toHaveBeenCalled();
  });

  test('404 cuando la tarjeta no es del usuario', async () => {
    const { buyer } = await seedBuyer();
    const p = await Purchase.create({ buyerId: buyer.id, total: 1500, status: 'pending' });
    mockUser = { id: buyer.id };

    const res = await api('POST', `${BASE}/${p.id}/pay`, { cardId: 999999 });
    expect(res.status).toBe(404);
  });
});