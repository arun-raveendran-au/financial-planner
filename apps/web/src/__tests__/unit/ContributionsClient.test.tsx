import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContributionsClient } from '../../app/(dashboard)/contributions/ContributionsClient';
import { usePlannerStore } from '@financial-planner/store';
import type { AnyTransaction, TxType } from '../../components/transactions/TransactionList';

// ── TransactionList mock ───────────────────────────────────────────────────────
// Renders a minimal shell that exposes the props we want to assert on,
// and buttons that fire the onAdd / onRemove callbacks.

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

describe('ContributionsClient — All Profiles guard', () => {
  it('shows guard message when All Profiles is active', () => {
    usePlannerStore.getState().setActiveProfile('all');
    render(<ContributionsClient />);
    expect(
      screen.getByText('Select an individual profile to manage contributions.')
    ).toBeInTheDocument();
  });

  it('does not render any transaction list when All Profiles is active', () => {
    usePlannerStore.getState().setActiveProfile('all');
    render(<ContributionsClient />);
    expect(screen.queryByTestId('list-sip')).not.toBeInTheDocument();
    expect(screen.queryByTestId('list-lumpsum')).not.toBeInTheDocument();
  });
});

describe('ContributionsClient — renders', () => {
  it('shows the Contributions heading', () => {
    render(<ContributionsClient />);
    expect(screen.getByRole('heading', { name: 'Contributions' })).toBeInTheDocument();
  });

  it('renders both TransactionLists', () => {
    render(<ContributionsClient />);
    expect(screen.getByTestId('list-sip')).toBeInTheDocument();
    expect(screen.getByTestId('list-lumpsum')).toBeInTheDocument();
  });

  it('passes correct title to SIP list', () => {
    render(<ContributionsClient />);
    expect(screen.getByTestId('title-sip')).toHaveTextContent('Recurring Contributions (SIPs)');
  });

  it('passes correct title to Lumpsum list', () => {
    render(<ContributionsClient />);
    expect(screen.getByTestId('title-lumpsum')).toHaveTextContent('One-Time Contributions (Lumpsums)');
  });

  it('passes empty arrays initially', () => {
    render(<ContributionsClient />);
    expect(screen.getByTestId('count-sip')).toHaveTextContent('0');
    expect(screen.getByTestId('count-lumpsum')).toHaveTextContent('0');
  });
});

describe('ContributionsClient — SIP callbacks', () => {
  it('onAdd for SIP calls addSip on the store', () => {
    render(<ContributionsClient />);
    fireEvent.click(screen.getByTestId('add-sip'));
    expect(usePlannerStore.getState().profiles[0]!.sips).toHaveLength(1);
  });

  it('onRemove for SIP calls removeSip on the store', () => {
    usePlannerStore.getState().addSip(1, {
      investmentId: 0, amount: 5000, startDate: '2024-01-01',
      durationYears: 5, frequency: 'Monthly', stepUpPercent: 0,
    });
    const sipId = usePlannerStore.getState().profiles[0]!.sips[0]!.id;
    render(<ContributionsClient />);
    fireEvent.click(screen.getByTestId(`remove-sip-${sipId}`));
    expect(usePlannerStore.getState().profiles[0]!.sips).toHaveLength(0);
  });

  it('SIP list count updates after add', () => {
    render(<ContributionsClient />);
    fireEvent.click(screen.getByTestId('add-sip'));
    expect(screen.getByTestId('count-sip')).toHaveTextContent('1');
  });
});

describe('ContributionsClient — Lumpsum callbacks', () => {
  it('onAdd for Lumpsum calls addLumpsum on the store', () => {
    render(<ContributionsClient />);
    fireEvent.click(screen.getByTestId('add-lumpsum'));
    expect(usePlannerStore.getState().profiles[0]!.lumpsums).toHaveLength(1);
  });

  it('onRemove for Lumpsum calls removeLumpsum on the store', () => {
    usePlannerStore.getState().addLumpsum(1, {
      investmentId: 0, amount: 100000, date: '2024-06-01',
    });
    const lumpsumId = usePlannerStore.getState().profiles[0]!.lumpsums[0]!.id;
    render(<ContributionsClient />);
    fireEvent.click(screen.getByTestId(`remove-lumpsum-${lumpsumId}`));
    expect(usePlannerStore.getState().profiles[0]!.lumpsums).toHaveLength(0);
  });
});
