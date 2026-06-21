const mockCompare = jest.fn();
const mockFindOne = jest.fn();
const mockFindOrCreate = jest.fn();
const mockGetUser = jest.fn();

jest.mock('../helpers/handleBcrypt', () => ({
  compare: mockCompare,
}));

jest.mock('../models', () => ({
  User: {
    findOne: mockFindOne,
    findOrCreate: mockFindOrCreate,
  },
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}));

const { login } = require('../helpers/loginStrategy');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('login (routing)', () => {
  test('routes to normalLogin when no providerToken', async () => {
    // Missing email → 400 from normalLogin
    const [user, error] = await login({});

    expect(error.status).toBe(400);
    expect(error.message).toBe('Email and password are required');
    expect(user).toBeNull();
    expect(mockFindOne).not.toHaveBeenCalled();
  });

  test('routes to loginWithSupaBase when providerToken is present', async () => {
    mockGetUser.mockResolvedValue({ error: new Error('token expired') });

    const [user, error] = await login({ providerToken: 'bad-token' });

    expect(error).toBeDefined();
    expect(error.message).toBe('token expired');
    expect(user).toBeNull();
    expect(mockFindOne).not.toHaveBeenCalled();
  });
});

describe('normalLogin (via login without providerToken)', () => {
  test('returns 400 when email is missing', async () => {
    const [user, error] = await login({ password: 'hunter2' });

    expect(error.status).toBe(400);
    expect(error.message).toBe('Email and password are required');
    expect(user).toBeNull();
  });

  test('returns 400 when password is missing', async () => {
    const [user, error] = await login({ email: 'a@b.com' });

    expect(error.status).toBe(400);
    expect(user).toBeNull();
  });
});

describe('loginWithSupaBase (via login with providerToken)', () => {
  test('returns error when supabase.auth.getUser fails', async () => {
    const supabaseError = { message: 'invalid token', status: 401 };
    mockGetUser.mockResolvedValue({ data: null, error: supabaseError });

    const [user, error] = await login({ providerToken: 'expired' });

    expect(error).toBe(supabaseError);
    expect(user).toBeNull();
    expect(mockFindOrCreate).not.toHaveBeenCalled();
  });

  test('returns user when supabase.auth.getUser succeeds', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'supa-123',
          email: 'supa@example.com',
          user_metadata: { username: 'supauser', avatar_url: 'https://img.com/me.png' },
        },
      },
      error: null,
    });

    const dbUser = { id: 99, email: 'supa@example.com', username: 'supauser', externalId: 'supa-123' };
    mockFindOrCreate.mockResolvedValue([dbUser]);

    const [user, error] = await login({ providerToken: 'valid' });

    expect(error).toBeNull();
    expect(user).toBe(dbUser);
    expect(mockFindOrCreate).toHaveBeenCalledWith({
      where: { email: 'supa@example.com' },
      defaults: {
        username: 'supauser',
        email: 'supa@example.com',
        image: 'https://img.com/me.png',
        role: 'user',
        seller: false,
        externalId: 'supa-123',
      },
    });
  });

  test('falls back to email prefix as username when no metadata names', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'supa-456',
          email: 'fallback@example.com',
          user_metadata: {},
        },
      },
      error: null,
    });

    const dbUser = { id: 100, email: 'fallback@example.com', username: 'fallback' };
    mockFindOrCreate.mockResolvedValue([dbUser]);

    const [user, error] = await login({ providerToken: 'valid-2' });

    expect(error).toBeNull();
    expect(user).toBe(dbUser);
    expect(mockFindOrCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        defaults: expect.objectContaining({ username: 'fallback' }),
      }),
    );
  });
});
