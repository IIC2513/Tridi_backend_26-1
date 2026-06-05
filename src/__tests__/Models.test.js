const app = require('../app.js');
const {
  sequelize, User, ModelTridi, File,
} = require('../models');

const BASE = '/models';

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

async function seedModels() {
  const creator = await User.create({
    username: 'creator',
    email: 'creator@example.com',
    password: 'x',
  });

  const models = [];
  for (let i = 1; i <= 3; i++) {
    const model = await ModelTridi.create({
      name: `Model ${i}`,
      price: i * 100,
      creatorId: creator.id,
    });
    models.push(model);
  }
  return { creator, models };
}

describe('GET /models', () => {
  test('returns all models with creatorId not null', async () => {
    const { models } = await seedModels();

    const res = await api('GET', BASE);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);

    // Each model should have creator included
    for (const m of res.body.data) {
      expect(m.creator).toBeDefined();
      expect(m.creator.username).toBe('creator');
    }

    // All seeded ids should be present
    const ids = res.body.data.map((m) => m.id).sort();
    expect(ids).toEqual(models.map((m) => m.id).sort());
  });
});

describe('GET /models/:id', () => {
  test('returns each model individually by id', async () => {
    const { models } = await seedModels();

    for (const expected of models) {
      const res = await api('GET', `${BASE}/${expected.id}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(expected.id);
      expect(res.body.data.name).toBe(expected.name);
      expect(res.body.data.creator).toBeDefined();
      expect(res.body.data.creator.username).toBe('creator');
    }
  });

  test('returns 404 when model does not exist', async () => {
    const res = await api('GET', `${BASE}/99999`);
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('3D Model not found.');
  });
});
