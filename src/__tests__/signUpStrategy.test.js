const mockFindOrCreate = jest.fn();
const mockGetUser = jest.fn();

jest.mock('../models', () => ({
  User: {
    findOrCreate: mockFindOrCreate,
  },
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}));

const { signUp } = require('../helpers/signUpStrategy');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('signUp (routing)', () => {
  test('routes to normalSignUp when no providerToken', async () => {
    mockFindOrCreate.mockResolvedValue([{ id: 1, email: 'a@b.com' }, true]);

    const [user, created, error] = await signUp({
      email: 'a@b.com', username: 'u', password: 'x',
    });

    expect(error).toBeNull();
    expect(user).toBeDefined();
    expect(created).toBe(true);
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  test('routes to signUpWithSupaBase when providerToken is present', async () => {
    mockGetUser.mockResolvedValue({ error: new Error('bad token') });

    const [user, created, error] = await signUp({ providerToken: 'bad' });

    expect(error).toBeDefined();
    expect(error.message).toBe('bad token');
    expect(user).toBeNull();
    expect(mockFindOrCreate).not.toHaveBeenCalled();
  });
});

describe('normalSignUp (via signUp without providerToken)', () => {
  test('returns 400 when email is missing', async () => {
    const [user, created, error] = await signUp({ username: 'u', password: 'x' });

    expect(error.status).toBe(400);
    expect(error.message).toBe('Email, username and password are required');
    expect(user).toBeNull();
    expect(created).toBeNull();
  });

  test('returns 400 when username is missing', async () => {
    const [user, created, error] = await signUp({ email: 'a@b.com', password: 'x' });

    expect(error.status).toBe(400);
    expect(user).toBeNull();
  });

  test('returns 400 when password is missing', async () => {
    const [user, created, error] = await signUp({ email: 'a@b.com', username: 'u' });

    expect(error.status).toBe(400);
    expect(user).toBeNull();
  });

  test('returns user and created=true for a new user', async () => {
    const dbUser = { id: 1, email: 'new@b.com', username: 'newuser' };
    mockFindOrCreate.mockResolvedValue([dbUser, true]);

    const [user, created, error] = await signUp({
      email: 'new@b.com', username: 'newuser', password: 'x',
    });

    expect(error).toBeNull();
    expect(user).toBe(dbUser);
    expect(created).toBe(true);
    expect(mockFindOrCreate).toHaveBeenCalledWith({
      where: { email: 'new@b.com' },
      defaults: {
        username: 'newuser',
        email: 'new@b.com',
        password: 'x',
        image: null,
        role: 'user',
        seller: false,
      },
    });
  });

  test('returns user and created=false for an existing email', async () => {
    const dbUser = { id: 1, email: 'dup@b.com', username: 'original' };
    mockFindOrCreate.mockResolvedValue([dbUser, false]);

    const [user, created, error] = await signUp({
      email: 'dup@b.com', username: 'other', password: 'x',
    });

    expect(error).toBeNull();
    expect(user).toBe(dbUser);
    expect(created).toBe(false);
  });

  test('passes image when provided', async () => {
    mockFindOrCreate.mockResolvedValue([{ id: 2 }, true]);

    await signUp({ email: 'a@b.com', username: 'u', password: 'x', image: 'https://img.com/pic.png' });

    expect(mockFindOrCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        defaults: expect.objectContaining({ image: 'https://img.com/pic.png' }),
      }),
    );
  });
});

describe('signUpWithSupaBase (via signUp with providerToken)', () => {
  test('returns error when supabase.auth.getUser fails', async () => {
    const supabaseError = { message: 'invalid token', status: 401 };
    mockGetUser.mockResolvedValue({ data: null, error: supabaseError });

    const [user, created, error] = await signUp({ providerToken: 'expired' });

    expect(error).toBe(supabaseError);
    expect(user).toBeNull();
    expect(created).toBeNull();
    expect(mockFindOrCreate).not.toHaveBeenCalled();
  });

  test('returns user when supabase succeeds', async () => {
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

    const dbUser = { id: 99, email: 'supa@example.com' };
    mockFindOrCreate.mockResolvedValue([dbUser, true]);

    const [user, created, error] = await signUp({ providerToken: 'valid' });

    expect(error).toBeNull();
    expect(user).toBe(dbUser);
    expect(created).toBe(true);
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

  test('falls back to email prefix when no metadata names', async () => {
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

    mockFindOrCreate.mockResolvedValue([{ id: 100 }, true]);

    await signUp({ providerToken: 'valid' });

    expect(mockFindOrCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        defaults: expect.objectContaining({ username: 'fallback' }),
      }),
    );
  });
});
