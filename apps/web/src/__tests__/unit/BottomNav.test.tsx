import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BottomNav } from '../../components/layout/BottomNav';

const mockUsePathname = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

beforeEach(() => {
  mockUsePathname.mockReturnValue('/dashboard');
});

afterEach(() => vi.clearAllMocks());

describe('BottomNav', () => {
  it('renders all navigation links', () => {
    render(<BottomNav />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Investments')).toBeInTheDocument();
    expect(screen.getByText('Contribute')).toBeInTheDocument();
    expect(screen.getByText('Withdraw')).toBeInTheDocument();
    expect(screen.getByText('Goals')).toBeInTheDocument();
    expect(screen.getByText('Rebalance')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders 7 navigation links', () => {
    render(<BottomNav />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(7);
  });

  it('Dashboard link points to /dashboard', () => {
    render(<BottomNav />);
    expect(screen.getByText('Dashboard').closest('a')).toHaveAttribute('href', '/dashboard');
  });

  it('Investments link points to /investments', () => {
    render(<BottomNav />);
    expect(screen.getByText('Investments').closest('a')).toHaveAttribute('href', '/investments');
  });

  it('Contribute link points to /contributions', () => {
    render(<BottomNav />);
    expect(screen.getByText('Contribute').closest('a')).toHaveAttribute('href', '/contributions');
  });

  it('Withdraw link points to /withdrawals', () => {
    render(<BottomNav />);
    expect(screen.getByText('Withdraw').closest('a')).toHaveAttribute('href', '/withdrawals');
  });

  it('Goals link points to /goals', () => {
    render(<BottomNav />);
    expect(screen.getByText('Goals').closest('a')).toHaveAttribute('href', '/goals');
  });

  it('Rebalance link points to /rebalancing', () => {
    render(<BottomNav />);
    expect(screen.getByText('Rebalance').closest('a')).toHaveAttribute('href', '/rebalancing');
  });

  it('Settings link points to /settings', () => {
    render(<BottomNav />);
    expect(screen.getByText('Settings').closest('a')).toHaveAttribute('href', '/settings');
  });

  it('active link has indigo text class for current route', () => {
    mockUsePathname.mockReturnValue('/investments');
    render(<BottomNav />);
    const investmentsLink = screen.getByText('Investments').closest('a');
    expect(investmentsLink).toHaveClass('text-indigo-600');
  });

  it('inactive links have gray text class', () => {
    mockUsePathname.mockReturnValue('/dashboard');
    render(<BottomNav />);
    const investmentsLink = screen.getByText('Investments').closest('a');
    expect(investmentsLink).toHaveClass('text-gray-500');
  });

  it('marks a nested route as active (e.g. /investments/123)', () => {
    mockUsePathname.mockReturnValue('/investments/123');
    render(<BottomNav />);
    const investmentsLink = screen.getByText('Investments').closest('a');
    expect(investmentsLink).toHaveClass('text-indigo-600');
  });
});
