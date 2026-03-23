import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TransactionList } from '../../components/transactions/TransactionList';
import type { AnyTransaction } from '../../components/transactions/TransactionList';
import type { Investment } from '@financial-planner/types';

// ── TransactionModal mock ──────────────────────────────────────────────────────

vi.mock('@/components/transactions/TransactionModal', () => ({
  TransactionModal: ({
    transaction,
    onSave,
    onCancel,
  }: {
    transaction: Partial<AnyTransaction>;
    onSave: (tx: Partial<AnyTransaction>) => void;
    onCancel: () => void;
  }) => (
    <div data-testid="transaction-modal">
      <button data-testid="modal-save" onClick={() => onSave(transaction)}>
        Save
      </button>
      <button data-testid="modal-cancel" onClick={onCancel}>
        Cancel
      </button>
    </div>
  ),
}));

afterEach(() => vi.clearAllMocks());

// ── Fixtures ───────────────────────────────────────────────────────────────────

const investments: Investment[] = [
  { id: 10, name: 'Nifty 50', assetClass: 'Equity', annualReturn: 12, returnType: 'basic', variableReturns: [] },
];

const recurringTx: AnyTransaction = {
  id: 1, investmentId: 10, amount: 5000,
  startDate: '2024-01-01', durationYears: 10, frequency: 'Monthly', stepUpPercent: 5,
};

const oneTimeTx: AnyTransaction = {
  id: 2, investmentId: 10, amount: 100000, date: '2024-06-15',
};

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('TransactionList — empty state', () => {
  it('shows empty message when no transactions for SIP', () => {
    render(
      <TransactionList title="SIPs" type="sip" transactions={[]} investments={[]}
        onAdd={vi.fn()} onUpdate={vi.fn()} onRemove={vi.fn()} />
    );
    expect(screen.getByText('No sips yet.')).toBeInTheDocument();
  });

  it('shows empty message when no transactions for lumpsum', () => {
    render(
      <TransactionList title="Lumpsums" type="lumpsum" transactions={[]} investments={[]}
        onAdd={vi.fn()} onUpdate={vi.fn()} onRemove={vi.fn()} />
    );
    expect(screen.getByText('No lumpsums yet.')).toBeInTheDocument();
  });

  it('renders the Add button', () => {
    render(
      <TransactionList title="SIPs" type="sip" transactions={[]} investments={[]}
        onAdd={vi.fn()} onUpdate={vi.fn()} onRemove={vi.fn()} />
    );
    expect(screen.getByTestId('add-sip-button')).toBeInTheDocument();
  });
});

describe('TransactionList — transaction rows', () => {
  it('renders a row for each transaction', () => {
    render(
      <TransactionList title="SIPs" type="sip" transactions={[recurringTx]} investments={investments}
        onAdd={vi.fn()} onUpdate={vi.fn()} onRemove={vi.fn()} />
    );
    expect(screen.getByTestId('tx-item-1')).toBeInTheDocument();
  });

  it('shows the formatted amount', () => {
    render(
      <TransactionList title="SIPs" type="sip" transactions={[recurringTx]} investments={investments}
        onAdd={vi.fn()} onUpdate={vi.fn()} onRemove={vi.fn()} />
    );
    expect(screen.getByText(/₹5,000/)).toBeInTheDocument();
  });

  it('shows investment name in the row', () => {
    render(
      <TransactionList title="SIPs" type="sip" transactions={[recurringTx]} investments={investments}
        onAdd={vi.fn()} onUpdate={vi.fn()} onRemove={vi.fn()} />
    );
    expect(screen.getByText('Nifty 50')).toBeInTheDocument();
  });

  it('shows "Unknown" when investment is not found', () => {
    render(
      <TransactionList title="SIPs" type="sip"
        transactions={[{ ...recurringTx, investmentId: 999 }]}
        investments={investments}
        onAdd={vi.fn()} onUpdate={vi.fn()} onRemove={vi.fn()} />
    );
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('shows frequency for recurring types', () => {
    render(
      <TransactionList title="SIPs" type="sip" transactions={[recurringTx]} investments={investments}
        onAdd={vi.fn()} onUpdate={vi.fn()} onRemove={vi.fn()} />
    );
    expect(screen.getByText(/Monthly/)).toBeInTheDocument();
  });

  it('does not show frequency for one-time type', () => {
    render(
      <TransactionList title="Lumpsums" type="lumpsum" transactions={[oneTimeTx]} investments={investments}
        onAdd={vi.fn()} onUpdate={vi.fn()} onRemove={vi.fn()} />
    );
    expect(screen.queryByText(/Monthly/)).not.toBeInTheDocument();
  });

  it('shows date for one-time transactions', () => {
    render(
      <TransactionList title="Lumpsums" type="lumpsum" transactions={[oneTimeTx]} investments={investments}
        onAdd={vi.fn()} onUpdate={vi.fn()} onRemove={vi.fn()} />
    );
    expect(screen.getByText('2024-06-15')).toBeInTheDocument();
  });

  it('shows "into" for contribution types', () => {
    render(
      <TransactionList title="SIPs" type="sip" transactions={[recurringTx]} investments={investments}
        onAdd={vi.fn()} onUpdate={vi.fn()} onRemove={vi.fn()} />
    );
    expect(screen.getByText(/into/)).toBeInTheDocument();
  });

  it('shows "from" for withdrawal types', () => {
    render(
      <TransactionList title="SWPs" type="swp" transactions={[recurringTx]} investments={investments}
        onAdd={vi.fn()} onUpdate={vi.fn()} onRemove={vi.fn()} />
    );
    expect(screen.getByText(/from/)).toBeInTheDocument();
  });
});

describe('TransactionList — Add modal', () => {
  it('modal is closed on initial render', () => {
    render(
      <TransactionList title="SIPs" type="sip" transactions={[]} investments={investments}
        onAdd={vi.fn()} onUpdate={vi.fn()} onRemove={vi.fn()} />
    );
    expect(screen.queryByTestId('transaction-modal')).not.toBeInTheDocument();
  });

  it('clicking Add opens the modal', () => {
    render(
      <TransactionList title="SIPs" type="sip" transactions={[]} investments={investments}
        onAdd={vi.fn()} onUpdate={vi.fn()} onRemove={vi.fn()} />
    );
    fireEvent.click(screen.getByTestId('add-sip-button'));
    expect(screen.getByTestId('transaction-modal')).toBeInTheDocument();
  });

  it('saving from Add modal calls onAdd (no id in payload)', () => {
    const onAdd = vi.fn();
    render(
      <TransactionList title="SIPs" type="sip" transactions={[]} investments={investments}
        onAdd={onAdd} onUpdate={vi.fn()} onRemove={vi.fn()} />
    );
    fireEvent.click(screen.getByTestId('add-sip-button'));
    fireEvent.click(screen.getByTestId('modal-save'));
    expect(onAdd).toHaveBeenCalledOnce();
  });

  it('saving closes the modal', () => {
    render(
      <TransactionList title="SIPs" type="sip" transactions={[]} investments={investments}
        onAdd={vi.fn()} onUpdate={vi.fn()} onRemove={vi.fn()} />
    );
    fireEvent.click(screen.getByTestId('add-sip-button'));
    fireEvent.click(screen.getByTestId('modal-save'));
    expect(screen.queryByTestId('transaction-modal')).not.toBeInTheDocument();
  });

  it('cancelling closes the modal without calling onAdd', () => {
    const onAdd = vi.fn();
    render(
      <TransactionList title="SIPs" type="sip" transactions={[]} investments={investments}
        onAdd={onAdd} onUpdate={vi.fn()} onRemove={vi.fn()} />
    );
    fireEvent.click(screen.getByTestId('add-sip-button'));
    fireEvent.click(screen.getByTestId('modal-cancel'));
    expect(screen.queryByTestId('transaction-modal')).not.toBeInTheDocument();
    expect(onAdd).not.toHaveBeenCalled();
  });
});

describe('TransactionList — Edit modal', () => {
  it('clicking the edit icon opens the modal', () => {
    render(
      <TransactionList title="SIPs" type="sip" transactions={[recurringTx]} investments={investments}
        onAdd={vi.fn()} onUpdate={vi.fn()} onRemove={vi.fn()} />
    );
    const row = screen.getByTestId('tx-item-1');
    fireEvent.click(row.querySelectorAll('button')[0]!); // edit button
    expect(screen.getByTestId('transaction-modal')).toBeInTheDocument();
  });

  it('saving from Edit modal (tx has id) calls onUpdate, not onAdd', () => {
    const onAdd = vi.fn();
    const onUpdate = vi.fn();
    render(
      <TransactionList title="SIPs" type="sip" transactions={[recurringTx]} investments={investments}
        onAdd={onAdd} onUpdate={onUpdate} onRemove={vi.fn()} />
    );
    const row = screen.getByTestId('tx-item-1');
    fireEvent.click(row.querySelectorAll('button')[0]!);
    fireEvent.click(screen.getByTestId('modal-save'));
    expect(onUpdate).toHaveBeenCalledOnce();
    expect(onAdd).not.toHaveBeenCalled();
  });
});

describe('TransactionList — Remove', () => {
  it('clicking the remove icon calls onRemove with the transaction id', () => {
    const onRemove = vi.fn();
    render(
      <TransactionList title="SIPs" type="sip" transactions={[recurringTx]} investments={investments}
        onAdd={vi.fn()} onUpdate={vi.fn()} onRemove={onRemove} />
    );
    const row = screen.getByTestId('tx-item-1');
    fireEvent.click(row.querySelectorAll('button')[1]!); // remove button
    expect(onRemove).toHaveBeenCalledWith(1);
  });
});
