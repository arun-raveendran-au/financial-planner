/**
 * Tests for AuthContext — verifies session state lifecycle, loading flag,
 * and signOut delegation to Supabase.
 */
import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';

// ─── Mock Supabase ────────────────────────────────────────────────────────────

const mockUnsubscribe = jest.fn();
const mockOnAuthStateChange = jest.fn().mockReturnValue({
  data: { subscription: { unsubscribe: mockUnsubscribe } },
});
const mockGetSession = jest.fn();
const mockSignOut = jest.fn().mockResolvedValue({});

jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
      signOut: () => mockSignOut(),
    },
  },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AuthContext — initial state', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null } });
  });

  it('starts with loading=true and no session', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.loading).toBe(true);
    expect(result.current.session).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it('sets loading=false after getSession resolves', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.session).toBeNull();
  });

  it('exposes the user from the restored session', async () => {
    const fakeUser = { id: 'user-1', email: 'test@example.com' };
    const fakeSession = { user: fakeUser, access_token: 'tok' };
    mockGetSession.mockResolvedValue({ data: { session: fakeSession } });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user?.email).toBe('test@example.com');
  });
});

describe('AuthContext — onAuthStateChange', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null } });
  });

  it('registers an auth state listener on mount', async () => {
    renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(mockOnAuthStateChange).toHaveBeenCalledTimes(1));
  });

  it('updates session when auth state changes', async () => {
    let capturedCallback: (event: string, session: unknown) => void = () => {};
    mockOnAuthStateChange.mockImplementation((cb: typeof capturedCallback) => {
      capturedCallback = cb;
      return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    const newSession = { user: { id: 'u2', email: 'new@example.com' }, access_token: 'tok2' };
    act(() => capturedCallback('SIGNED_IN', newSession));

    expect(result.current.session).toEqual(newSession);
    expect(result.current.user?.email).toBe('new@example.com');
  });

  it('unsubscribes on unmount', async () => {
    const { unmount } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(mockOnAuthStateChange).toHaveBeenCalledTimes(1));
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });
});

describe('AuthContext — signOut', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null } });
  });

  it('delegates to supabase.auth.signOut', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.signOut(); });
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });
});
