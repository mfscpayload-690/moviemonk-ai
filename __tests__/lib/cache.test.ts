jest.mock('redis', () => {
  const store: Record<string, { value: string; ex?: number }> = {};
  return {
    createClient: () => ({
      connect: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
      get: jest.fn((key: string) => Promise.resolve(store[key]?.value || null)),
      set: jest.fn((key: string, value: string, opts?: { EX?: number }) => {
        store[key] = { value, ex: opts?.EX };
        return Promise.resolve('OK');
      })
    })
  };
});

process.env.REDIS_URL = 'redis://localhost:6379';

// Dynamic import after mock
let cacheModule: typeof import('../../lib/cache');

beforeAll(async () => {
  cacheModule = await import('../../lib/cache');
});

describe('lib/cache', () => {
  it('setCache stores and getCache retrieves', async () => {
    await cacheModule.setCache('test-key', { foo: 'bar' }, 60);
    const result = await cacheModule.getCache('test-key');
    expect(result).toEqual({ foo: 'bar' });
  });

  it('withCacheKey generates stable key', () => {
    const k1 = cacheModule.withCacheKey('prefix', { a: 1, b: 2 });
    const k2 = cacheModule.withCacheKey('prefix', { b: 2, a: 1 });
    expect(k1).toBe(k2);
  });
});
