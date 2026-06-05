let mockUser;
jest.mock('../helpers/middlawares/authMiddlaware.js', () => (req, _res, next) => {
  req.user = mockUser;
  next();
});

const app = require('../app.js');
const {
  sequelize, User, Cart, CartItem, ModelTridi, File,
} = require('../models');

const BASE = '/cart';

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
  await sequelize.sync({ force: true });
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

beforeEach(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  if (server) await new Promise((r) => server.close(r));
  await sequelize.close();
});

describe('GET /cart', () => {
  test('returns empty cart with subtotal 0 for new user', async () => {
    const user = await User.create({ username: 'u', email: 'u@t.com', password: 'x' });
    mockUser = { id: user.id };

    const res = await api('GET', BASE);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toEqual([]);
    expect(res.body.data.subtotal).toBe(0);
  });

  test('returns cart with items and correct subtotal', async () => {
    const user = await User.create({ username: 'u', email: 'u@t.com', password: 'x' });
    mockUser = { id: user.id };

    const m1 = await ModelTridi.create({ name: 'A', price: 100, creatorId: user.id });
    const m2 = await ModelTridi.create({ name: 'B', price: 200, creatorId: user.id });

    const cart = await Cart.create({ userId: user.id });
    await CartItem.create({ cartId: cart.id, modelId: m1.id });
    await CartItem.create({ cartId: cart.id, modelId: m2.id });

    const res = await api('GET', BASE);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(2);
    expect(res.body.data.subtotal).toBe(300);
    expect(res.body.data.items[0].ModelTridi.name).toBe('A');
    expect(res.body.data.items[1].ModelTridi.name).toBe('B');
  });

  test('cart is auto-created on first access', async () => {
    const user = await User.create({ username: 'u', email: 'u@t.com', password: 'x' });
    mockUser = { id: user.id };

    // No Cart exists yet
    expect(await Cart.findOne({ where: { userId: user.id } })).toBeNull();

    const res = await api('GET', BASE);

    expect(res.status).toBe(200);
    // Cart should now exist
    const cart = await Cart.findOne({ where: { userId: user.id } });
    expect(cart).not.toBeNull();
  });
});

describe('POST /cart/items', () => {
  test('201: adds item to cart', async () => {
    const creator = await User.create({ username: 'c', email: 'c@t.com', password: 'x' });
    const user = await User.create({ username: 'u', email: 'u@t.com', password: 'x' });
    const model = await ModelTridi.create({ name: 'Cube', price: 150, creatorId: creator.id });
    mockUser = { id: user.id };

    const res = await api('POST', `${BASE}/items`, { modelId: model.id });

    expect(res.status).toBe(201);
    expect(res.body.data.modelId).toBe(model.id);
    expect(res.body.data.ModelTridi.name).toBe('Cube');
  });

  test('200: returns existing item when already in cart', async () => {
    const creator = await User.create({ username: 'c', email: 'c@t.com', password: 'x' });
    const user = await User.create({ username: 'u', email: 'u@t.com', password: 'x' });
    const model = await ModelTridi.create({ name: 'Cube', price: 150, creatorId: creator.id });
    mockUser = { id: user.id };

    // First add
    await api('POST', `${BASE}/items`, { modelId: model.id });

    // Second add — already there
    const res = await api('POST', `${BASE}/items`, { modelId: model.id });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Already in cart.');

    // Still only one item
    const cart = await Cart.findOne({ where: { userId: user.id } });
    const items = await CartItem.findAll({ where: { cartId: cart.id } });
    expect(items).toHaveLength(1);
  });

  test('400: missing modelId', async () => {
    const user = await User.create({ username: 'u', email: 'u@t.com', password: 'x' });
    mockUser = { id: user.id };

    const res = await api('POST', `${BASE}/items`, {});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('modelId is required.');
  });

  test('404: model does not exist', async () => {
    const user = await User.create({ username: 'u', email: 'u@t.com', password: 'x' });
    mockUser = { id: user.id };

    const res = await api('POST', `${BASE}/items`, { modelId: 99999 });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('3D Model not found :(');
  });
});

describe('DELETE /cart/items/:id', () => {
  test('200: removes item from cart', async () => {
    const creator = await User.create({ username: 'c', email: 'c@t.com', password: 'x' });
    const user = await User.create({ username: 'u', email: 'u@t.com', password: 'x' });
    const model = await ModelTridi.create({ name: 'Cube', price: 150, creatorId: creator.id });
    mockUser = { id: user.id };

    const cart = await Cart.create({ userId: user.id });
    const item = await CartItem.create({ cartId: cart.id, modelId: model.id });

    const res = await api('DELETE', `${BASE}/items/${item.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(item.id);

    const gone = await CartItem.findByPk(item.id);
    expect(gone).toBeNull();
  });

  test('404: cart item not found', async () => {
    const user = await User.create({ username: 'u', email: 'u@t.com', password: 'x' });
    mockUser = { id: user.id };

    const res = await api('DELETE', `${BASE}/items/99999`);
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Cart item not found.');
  });

  test('404: cart item belongs to another user', async () => {
    const owner = await User.create({ username: 'o', email: 'o@t.com', password: 'x' });
    const other = await User.create({ username: 'x', email: 'x@t.com', password: 'x' });
    const model = await ModelTridi.create({ name: 'Cube', price: 150, creatorId: owner.id });

    const cart = await Cart.create({ userId: owner.id });
    const item = await CartItem.create({ cartId: cart.id, modelId: model.id });

    mockUser = { id: other.id };
    const res = await api('DELETE', `${BASE}/items/${item.id}`);
    expect(res.status).toBe(404);

    // Item still exists
    const still = await CartItem.findByPk(item.id);
    expect(still).not.toBeNull();
  });
});
