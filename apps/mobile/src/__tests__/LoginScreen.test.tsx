/**
 * Tests for the Login screen — form validation, Supabase call, error display.
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../app/(auth)/login';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockSignInWithPassword = jest.fn();

jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
    },
  },
}));

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('LoginScreen — rendering', () => {
  it('renders the title and input fields', () => {
    const { getByTestId, getByText } = render(<LoginScreen />);
    expect(getByTestId('email-input')).toBeTruthy();
    expect(getByTestId('password-input')).toBeTruthy();
    expect(getByText('Financial Planner')).toBeTruthy();
    expect(getByText('Sign In')).toBeTruthy();
  });

  it('does not show an error message initially', () => {
    const { queryByTestId } = render(<LoginScreen />);
    expect(queryByTestId('error-message')).toBeNull();
  });
});

describe('LoginScreen — validation', () => {
  it('shows an error when email is empty', async () => {
    const { getByTestId } = render(<LoginScreen />);
    fireEvent.press(getByTestId('login-button'));
    await waitFor(() => {
      expect(getByTestId('error-message')).toBeTruthy();
    });
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it('shows an error when password is empty', async () => {
    const { getByTestId } = render(<LoginScreen />);
    fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
    fireEvent.press(getByTestId('login-button'));
    await waitFor(() => {
      expect(getByTestId('error-message')).toBeTruthy();
    });
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });
});

describe('LoginScreen — submission', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls signInWithPassword with trimmed email and password', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null });
    const { getByTestId } = render(<LoginScreen />);

    fireEvent.changeText(getByTestId('email-input'), '  user@test.com  ');
    fireEvent.changeText(getByTestId('password-input'), 'secret123');
    fireEvent.press(getByTestId('login-button'));

    await waitFor(() => expect(mockSignInWithPassword).toHaveBeenCalledTimes(1));
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'user@test.com',
      password: 'secret123',
    });
  });

  it('displays the error message returned by Supabase', async () => {
    mockSignInWithPassword.mockResolvedValue({
      error: { message: 'Invalid login credentials' },
    });
    const { getByTestId } = render(<LoginScreen />);

    fireEvent.changeText(getByTestId('email-input'), 'bad@user.com');
    fireEvent.changeText(getByTestId('password-input'), 'wrongpass');
    fireEvent.press(getByTestId('login-button'));

    await waitFor(() => {
      expect(getByTestId('error-message')).toBeTruthy();
    });
  });

  it('does not display an error on successful sign-in', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null });
    const { getByTestId, queryByTestId } = render(<LoginScreen />);

    fireEvent.changeText(getByTestId('email-input'), 'user@test.com');
    fireEvent.changeText(getByTestId('password-input'), 'correct');
    fireEvent.press(getByTestId('login-button'));

    await waitFor(() => expect(mockSignInWithPassword).toHaveBeenCalled());
    expect(queryByTestId('error-message')).toBeNull();
  });
});
