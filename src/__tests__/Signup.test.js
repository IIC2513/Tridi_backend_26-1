const app = require('../app.js');
const {
  sequelize, User,
} = require('../models');

const BASE = '/signup';

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

describe('POST /signup', () => {
  test('201: creates a new user, strips password, and returns a session', async () => {
    const res = await api('POST', BASE, {
      username: 'newuser',
      email: 'new@example.com',
      password: 'hunter2',
    });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.username).toBe('newuser');
    expect(res.body.user.email).toBe('new@example.com');
    expect(res.body.user.password).toBeUndefined();
    expect(res.body.session).toBeDefined();
    expect(res.body.session.token).toBeDefined();
  });

  test('200: returns existing user without session when email is already taken', async () => {
    await User.create({
      username: 'existing',
      email: 'dup@example.com',
      password: 'hunter2',
    });

    const res = await api('POST', BASE, {
      username: 'othername',
      email: 'dup@example.com',
      password: 'irrelevant',
    });

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe('dup@example.com');
    expect(res.body.user.username).toBe('existing'); // original, not overwritten
    expect(res.body.user.password).toBeUndefined();
    expect(res.body.session).toBeUndefined();
  });

  test('400: returns error when required fields are missing', async () => {
    const cases = [
      { email: 'a@b.com', password: 'x' },           // no username
      { username: 'u', password: 'x' },                // no email
      { username: 'u', email: 'a@b.com' },             // no password
      {},                                               // nothing
    ];

    for (const body of cases) {
      const res = await api('POST', BASE, body);
      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('Email, username and password are required');
    }
  });
});
