const app = require('../app.js');
const {
  sequelize, User,
} = require('../models');

const BASE = '/login';

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

describe('POST /login', () => {
  test('200: logs in with valid credentials and does not return the password', async () => {
    await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'hunter2',
    });

    const res = await api('POST', BASE, {
      email: 'test@example.com',
      password: 'hunter2',
    });

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.password).toBeUndefined();
    expect(res.body.session).toBeDefined();
    expect(res.body.session.token).toBeDefined();
  });

  test('401: rejects login with a wrong password', async () => {
    await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'hunter2',
    });

    const res = await api('POST', BASE, {
      email: 'test@example.com',
      password: 'wrongpassword',
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.message).toBe('Invalid email or password');
  });
});
