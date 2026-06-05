let mockUser;
jest.mock('../helpers/middlawares/authMiddlaware.js', () => (req, _res, next) => {
  req.user = mockUser;
  next();
});

const app = require('../app.js');
const {
  sequelize, User, Card,
} = require('../models');

const BASE = '/cards';

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

describe('GET /cards', () => {
  test('returns cards belonging to the authenticated user', async () => {
    const user = await User.create({ username: 'u', email: 'u@t.com', password: 'x' });
    mockUser = { id: user.id };

    await Card.create({ userId: user.id, brand: 'visa', last4: '4242', expMonth: 12, expYear: 2030, token: 'tok_a' });
    await Card.create({ userId: user.id, brand: 'mastercard', last4: '5678', expMonth: 6, expYear: 2028, token: 'tok_b' });

    const res = await api('GET', BASE);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].brand).toBe('visa');
    expect(res.body.data[1].brand).toBe('mastercard');
    expect(res.body.data[0].last4).toBe('4242');
  });

  test('returns empty array when user has no cards', async () => {
    const user = await User.create({ username: 'u', email: 'u@t.com', password: 'x' });
    mockUser = { id: user.id };

    const res = await api('GET', BASE);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

describe('POST /cards', () => {
  test('201: creates a card with valid data', async () => {
    const user = await User.create({ username: 'u', email: 'u@t.com', password: 'x' });
    mockUser = { id: user.id };

    const res = await api('POST', BASE, {
      number: '4242424242424242',
      expMonth: 12,
      expYear: 2030,
    });

    expect(res.status).toBe(201);
    expect(res.body.data.brand).toBe('visa');
    expect(res.body.data.last4).toBe('4242');
    expect(res.body.data.expMonth).toBe(12);
    expect(res.body.data.expYear).toBe(2030);
  });

  test('detects mastercard brand', async () => {
    const user = await User.create({ username: 'u', email: 'u@t.com', password: 'x' });
    mockUser = { id: user.id };

    const res = await api('POST', BASE, {
      number: '5555555555554444',
      expMonth: 8,
      expYear: 2027,
    });

    expect(res.status).toBe(201);
    expect(res.body.data.brand).toBe('mastercard');
    expect(res.body.data.last4).toBe('4444');
  });

  test('detects amex brand', async () => {
    const user = await User.create({ username: 'u', email: 'u@t.com', password: 'x' });
    mockUser = { id: user.id };

    const res = await api('POST', BASE, {
      number: '378282246310005',
      expMonth: 12,
      expYear: 2030,
    });

    expect(res.status).toBe(201);
    expect(res.body.data.brand).toBe('amex');
    expect(res.body.data.last4).toBe('0005');
  });

  test('400: missing fields', async () => {
    const user = await User.create({ username: 'u', email: 'u@t.com', password: 'x' });
    mockUser = { id: user.id };

    const cases = [
      { expMonth: 1, expYear: 2030 },            // no number
      { number: '4'.repeat(16), expYear: 2030 },  // no expMonth
      { number: '4'.repeat(16), expMonth: 1 },    // no expYear
      {},                                          // nothing
    ];

    for (const body of cases) {
      const res = await api('POST', BASE, body);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('number, expMonth and expYear are required.');
    }
  });

  test('422: invalid card number (too short)', async () => {
    const user = await User.create({ username: 'u', email: 'u@t.com', password: 'x' });
    mockUser = { id: user.id };

    const res = await api('POST', BASE, { number: '123', expMonth: 1, expYear: 2030 });
    expect(res.status).toBe(422);
    expect(res.body.error).toBe('invalid card number.');
  });

  test('422: invalid expiry month', async () => {
    const user = await User.create({ username: 'u', email: 'u@t.com', password: 'x' });
    mockUser = { id: user.id };

    for (const month of [13, -1, 2.5]) {
      const res = await api('POST', BASE, { number: '4'.repeat(16), expMonth: month, expYear: 2030 });
      expect(res.status).toBe(422);
      expect(res.body.error).toBe('invalid expiry month.');
    }
  });

  test('422: invalid expiry year', async () => {
    const user = await User.create({ username: 'u', email: 'u@t.com', password: 'x' });
    mockUser = { id: user.id };

    for (const year of [1999, 2100, 200]) {
      const res = await api('POST', BASE, { number: '4'.repeat(16), expMonth: 1, expYear: year });
      expect(res.status).toBe(422);
      expect(res.body.error).toBe('invalid expiry year.');
    }
  });

  test('422: card has expired', async () => {
    const user = await User.create({ username: 'u', email: 'u@t.com', password: 'x' });
    mockUser = { id: user.id };

    const res = await api('POST', BASE, { number: '4'.repeat(16), expMonth: 1, expYear: 2020 });
    expect(res.status).toBe(422);
    expect(res.body.error).toBe('card has expired.');
  });
});

describe('DELETE /cards/:id', () => {
  test('200: deletes own card', async () => {
    const user = await User.create({ username: 'u', email: 'u@t.com', password: 'x' });
    mockUser = { id: user.id };

    const card = await Card.create({
      userId: user.id, brand: 'visa', last4: '4242', expMonth: 12, expYear: 2030, token: 'tok',
    });

    const res = await api('DELETE', `${BASE}/${card.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(card.id);

    const gone = await Card.findByPk(card.id);
    expect(gone).toBeNull();
  });

  test('404: card does not exist', async () => {
    const user = await User.create({ username: 'u', email: 'u@t.com', password: 'x' });
    mockUser = { id: user.id };

    const res = await api('DELETE', `${BASE}/99999`);
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Card not found.');
  });

  test('404: card belongs to another user', async () => {
    const owner = await User.create({ username: 'owner', email: 'o@t.com', password: 'x' });
    const other = await User.create({ username: 'other', email: 'x@t.com', password: 'x' });

    const card = await Card.create({
      userId: owner.id, brand: 'visa', last4: '4242', expMonth: 12, expYear: 2030, token: 'tok',
    });

    mockUser = { id: other.id };
    const res = await api('DELETE', `${BASE}/${card.id}`);
    expect(res.status).toBe(404);

    // Card still exists
    const still = await Card.findByPk(card.id);
    expect(still).not.toBeNull();
  });
});
