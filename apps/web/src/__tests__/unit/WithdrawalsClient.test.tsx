import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WithdrawalsClient } from '../../app/(dashboard)/withdrawals/WithdrawalsClient';
import { usePlannerStore } from '../../store/plannerStore';
import type { AnyTransaction, TxType } from '../../components/transactions/TransactionList';

// ── TransactionList mock ───────────────────────────────────────────────────────

vi.mock('@/components/transactions/TransactionList', () => ({
  TransactionList: ({
    title,
    type,
    transactions,
    onAdd,
    onRemove,
  }: {
    title: string;
    type: TxType;
    transactions: AnyTransaction[];
    onAdd: (tx: Omit<AnyTransaction, 'id'>) => void;
    onRemove: (id: number) => void;
  }) => (
    <div data-testid={`list-${type}`}>
      <span data-testid={`title-${type}`}>{title}</span>
      <span data-testid={`count-${type}`}>{transactions.length}</span>
      <button
        data-testid={`add-${type}`}
        onClick={() =>
          onAdd({ investmentId: 0, amount: 5000, startDate: '2024-01-01', durationYears: 5, frequency: 'Monthly', stepUpPercent: 0 })
        }
      >
        Add
      </button>
      {transactions.map((tx) => (
        <button key={tx.id} data-testid={`remove-${type}-${tx.id}`} onClick={() => onRemove(tx.id)}>
          Remove
        </button>
      ))}
    </div>
  ),
}));

// ── Store helpers ──────────────────────────────────────────────────────────────

const resetStore = () =>
  usePlannerStore.setState({
    profiles: [
      {
        id: 1,
        name: 'My Portfolio',
        investments: [],
        sips: [],
        lumpsums: [],
        swps: [],
        oneTimeWithdrawals: [],
        goals: [],
        rebalancingEvents: [],
      },
    ],
    activeProfileId: 1,
    globalSettings: { timelineYears: 30, startYear: 2024 },
  });

beforeEach(resetStore);

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('WithdrawalsClient — All Profiles guard', () => {
  it('shows guard message when All Profiles is active', () => {
    usePlannerStore.getState().setActiveProfile('all');
    render(<WithdrawalsClient />);
    expect(
      screen.getByText('Select an individual profile to manage withdrawals.')
    ).toBeInTheDocument();
  });

  it('does not render any transaction list when All Profiles is active', () => {
    usePlannerStore.getState().setActiveProfile('all');
    render(<WithdrawalsClient />);
    expect(screen.queryByTestId('list-swp')).not.toBeInTheDocument();
    expect(screen.queryByTestId('list-oneTimeWithdrawal')).not.toBeInTheDocument();
  });
});

describe('WithdrawalsClient — renders', () => {
  it('shows the Withdrawals heading', () => {
    render(<WithdrawalsClient />);
    expect(screen.getByRole('heading', { name: 'Withdrawals' })).toBeInTheDocument();
  });

  it('renders both TransactionLists', () => {
    render(<WithdrawalsClient />);
    expect(screen.getByTestId('list-swp')).toBeInTheDocument();
    expect(screen.getByTestId('list-oneTimeWithdrawal')).toBeInTheDocument();
  });

  it('passes correct title to SWP list', () => {
    render(<WithdrawalsClient />);
    expect(screen.getByTestId('title-swp')).toHaveTextContent('Recurring Withdrawals (SWPs)');
  });

  it('passes correct title to one-time withdrawal list', () => {
    render(<WithdrawalsClient />);
    expect(screen.getByTestId('title-oneTimeWithdrawal')).toHaveTextContent('One-Time Withdrawals');
  });

  it('passes empty arrays initially', () => {
    render(<WithdrawalsClient />);
    expect(screen.getByTestId('count-swp')).toHaveTextContent('0');
    expect(screen.getByTestId('count-oneTimeWithdrawal')).toHaveTextContent('0');
  });
});

describe('WithdrawalsClient — SWP callbacks', () => {
  it('onAdd for SWP calls addSwp on the store', () => {
    render(<WithdrawalsClient />);
    fireEvent.click(screen.getByTestId('add-swp'));
    expect(usePlannerStore.getState().profiles[0]!.swps).toHaveLength(1);
  });

  it('onRemove for SWP calls removeSwp on the store', () => {
    usePlannerStore.getState().addSwp(1, {
      investmentId: 0, amount: 5000, startDate: '2024-01-01',
      durationYears: 5, frequency: 'Monthly', stepUpPercent: 0,
    });
    const swpId = usePlannerStore.getState().profiles[0]!.swps[0]!.id;
    render(<WithdrawalsClient />);
    fireEvent.click(screen.getByTestId(`remove-swp-${swpId}`));
    expect(usePlannerStore.getState().profiles[0]!.swps).toHaveLength(0);
  });

  it('SWP list count updates after add', () => {
    render(<WithdrawalsClient />);
    fireEvent.click(screen.getByTestId('add-swp'));
    expect(screen.getByTestId('count-swp')).toHaveTextContent('1');
  });
});

describe('WithdrawalsClient — One-Time Withdrawal callbacks', () => {
  it('onAdd for one-time withdrawal calls addOneTimeWithdrawal on the store', () => {
    render(<WithdrawalsClient />);
    fireEvent.click(screen.getByTestId('add-oneTimeWithdrawal'));
    expect(usePlannerStore.getState().profiles[0]!.oneTimeWithdrawals).toHaveLength(1);
  });

  it('onRemove for one-time withdrawal calls removeOneTimeWithdrawal on the store', () => {
    usePlannerStore.getState().addOneTimeWithdrawal(1, {
      investmentId: 0, amount: 50000, date: '2025-01-01',
    });
    const wId = usePlannerStore.getState().profiles[0]!.oneTimeWithdrawals[0]!.id;
    render(<WithdrawalsClient />);
    fireEvent.click(screen.getByTestId(`remove-oneTimeWithdrawal-${wId}`));
    expect(usePlannerStore.getState().profiles[0]!.oneTimeWithdrawals).toHaveLength(0);
  });
});
