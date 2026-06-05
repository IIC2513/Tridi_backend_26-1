let mockUser;
jest.mock('../helpers/middlawares/authMiddlaware.js', () => (req, res, next) => {
  if (!mockUser) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }
  req.user = mockUser;
  next();
});

const app = require('../app.js');
const {
  sequelize, User,
} = require('../models');

const BASE = '/users';

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
  mockUser = null;
});

afterAll(async () => {
  if (server) await new Promise((r) => server.close(r));
  await sequelize.close();
});

describe('GET /users', () => {
  test('401: rejects request without authentication', async () => {
    const res = await api('GET', BASE);

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  test('200: returns all users with stats when authenticated', async () => {
    const u1 = await User.create({ username: 'alice', email: 'a@t.com', password: 'x' });
    const u2 = await User.create({ username: 'bob', email: 'b@t.com', password: 'x' });
    const u3 = await User.create({ username: 'carol', email: 'c@t.com', password: 'x' });
    mockUser = { id: u1.id };

    const res = await api('GET', BASE);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);

    const usernames = res.body.data.map((u) => u.username).sort();
    expect(usernames).toEqual(['alice', 'bob', 'carol']);

    // Each user should have stats included (auto-created after user creation)
    for (const u of res.body.data) {
      expect(u.stats).toBeDefined();
      expect(u.stats.c_sales).toBeDefined();
      expect(u.stats.c_purchases).toBeDefined();
      expect(u.stats.reputation).toBeDefined();
      expect(u.password).toBeUndefined();
    }
  });
});
