// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockExchangeCodeForSession = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { exchangeCodeForSession: mockExchangeCodeForSession },
  })),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: vi.fn(() => []),
    set: vi.fn(),
  }),
}));

const mockRedirect = vi.fn((url: string) => ({ type: 'redirect', url }));
vi.mock('next/server', () => ({
  NextResponse: { redirect: (url: URL) => mockRedirect(url.toString()) },
}));

// ── Helper ────────────────────────────────────────────────────────────────────

function makeRequest(params: Record<string, string>) {
  const url = new URL('https://example.com/auth/callback');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return { url: url.toString() } as Request;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /auth/callback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env['NEXT_PUBLIC_SUPABASE_URL'] = 'https://test.supabase.co';
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] = 'test-anon-key';
  });

  it('redirects to /dashboard on successful code exchange', async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: null });
    const { GET } = await import('../../app/auth/callback/route');
    await GET(makeRequest({ code: 'valid-code' }) as never);
    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('valid-code');
    expect(mockRedirect).toHaveBeenCalledWith('https://example.com/dashboard');
  });

  it('redirects to /login with error when exchange fails', async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: { message: 'invalid code' } });
    const { GET } = await import('../../app/auth/callback/route');
    await GET(makeRequest({ code: 'bad-code' }) as never);
    expect(mockRedirect).toHaveBeenCalledWith(
      'https://example.com/login?error=auth_callback_error'
    );
  });

  it('redirects to /login with error when no code is present', async () => {
    const { GET } = await import('../../app/auth/callback/route');
    await GET(makeRequest({}) as never);
    expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
    expect(mockRedirect).toHaveBeenCalledWith(
      'https://example.com/login?error=auth_callback_error'
    );
  });

  it('respects a custom "next" param for the redirect destination', async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: null });
    const { GET } = await import('../../app/auth/callback/route');
    await GET(makeRequest({ code: 'valid-code', next: '/settings' }) as never);
    expect(mockRedirect).toHaveBeenCalledWith('https://example.com/settings');
  });
});
