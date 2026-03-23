import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TransactionModal } from '../../components/transactions/TransactionModal';
import type { Investment } from '@financial-planner/types';

const investments: Investment[] = [
  { id: 1, name: 'Nifty 50', assetClass: 'Equity', annualReturn: 12, returnType: 'basic', variableReturns: [] },
  { id: 2, name: 'Gold ETF', assetClass: 'Gold', annualReturn: 8, returnType: 'basic', variableReturns: [] },
];

const noop = vi.fn();
afterEach(() => vi.clearAllMocks());

describe('TransactionModal — SIP (recurring contribution)', () => {
  it('renders the modal', () => {
    render(<TransactionModal type="sip" transaction={{}} investments={investments} onSave={noop} onCancel={noop} />);
    expect(screen.getByTestId('transaction-modal')).toBeInTheDocument();
  });

  it('shows "Add Recurring Contribution (SIP)" title', () => {
    render(<TransactionModal type="sip" transaction={{}} investments={investments} onSave={noop} onCancel={noop} />);
    expect(screen.getByText(/Add Recurring Contribution \(SIP\)/)).toBeInTheDocument();
  });

  it('shows "Edit" in title for existing transaction', () => {
    render(<TransactionModal type="sip" transaction={{ id: 99 }} investments={investments} onSave={noop} onCancel={noop} />);
    expect(screen.getByText(/Edit Recurring Contribution/)).toBeInTheDocument();
  });

  it('shows Duration and Frequency fields (recurring only)', () => {
    render(<TransactionModal type="sip" transaction={{}} investments={investments} onSave={noop} onCancel={noop} />);
    expect(screen.getByText('Duration (Years)')).toBeInTheDocument();
    expect(screen.getByText('Frequency')).toBeInTheDocument();
  });

  it('shows Annual Step-up field for recurring types', () => {
    render(<TransactionModal type="sip" transaction={{}} investments={investments} onSave={noop} onCancel={noop} />);
    expect(screen.getByText('Annual Step-up (%)')).toBeInTheDocument();
  });

  it('date label is "Start Date" for recurring', () => {
    render(<TransactionModal type="sip" transaction={{}} investments={investments} onSave={noop} onCancel={noop} />);
    expect(screen.getByText('Start Date')).toBeInTheDocument();
  });

  it('lists all investments in the dropdown', () => {
    render(<TransactionModal type="sip" transaction={{}} investments={investments} onSave={noop} onCancel={noop} />);
    expect(screen.getByText('Nifty 50')).toBeInTheDocument();
    expect(screen.getByText('Gold ETF')).toBeInTheDocument();
  });

  it('calls onSave when Save is clicked', () => {
    const onSave = vi.fn();
    render(<TransactionModal type="sip" transaction={{}} investments={investments} onSave={onSave} onCancel={noop} />);
    fireEvent.click(screen.getByTestId('save-tx-button'));
    expect(onSave).toHaveBeenCalledOnce();
  });

  it('calls onCancel when Cancel is clicked', () => {
    const onCancel = vi.fn();
    render(<TransactionModal type="sip" transaction={{}} investments={investments} onSave={noop} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('updating amount is reflected in onSave payload', () => {
    const onSave = vi.fn();
    render(<TransactionModal type="sip" transaction={{}} investments={investments} onSave={onSave} onCancel={noop} />);
    fireEvent.change(screen.getByTestId('tx-amount-input'), { target: { value: '5000' } });
    fireEvent.click(screen.getByTestId('save-tx-button'));
    expect(onSave.mock.calls[0][0]).toMatchObject({ amount: 5000 });
  });
});

describe('TransactionModal — Lumpsum (one-time contribution)', () => {
  it('shows correct title', () => {
    render(<TransactionModal type="lumpsum" transaction={{}} investments={investments} onSave={noop} onCancel={noop} />);
    expect(screen.getByText(/Add One-Time Contribution/)).toBeInTheDocument();
  });

  it('does NOT show Duration/Frequency fields', () => {
    render(<TransactionModal type="lumpsum" transaction={{}} investments={investments} onSave={noop} onCancel={noop} />);
    expect(screen.queryByText('Duration (Years)')).not.toBeInTheDocument();
    expect(screen.queryByText('Frequency')).not.toBeInTheDocument();
  });

  it('date label is "Date" (not Start Date) for one-time', () => {
    render(<TransactionModal type="lumpsum" transaction={{}} investments={investments} onSave={noop} onCancel={noop} />);
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.queryByText('Start Date')).not.toBeInTheDocument();
  });
});

describe('TransactionModal — SWP (recurring withdrawal)', () => {
  it('shows correct title', () => {
    render(<TransactionModal type="swp" transaction={{}} investments={investments} onSave={noop} onCancel={noop} />);
    expect(screen.getByText(/Add Recurring Withdrawal \(SWP\)/)).toBeInTheDocument();
  });

  it('shows recurring fields', () => {
    render(<TransactionModal type="swp" transaction={{}} investments={investments} onSave={noop} onCancel={noop} />);
    expect(screen.getByText('Duration (Years)')).toBeInTheDocument();
    expect(screen.getByText('Annual Step-up (%)')).toBeInTheDocument();
  });
});

describe('TransactionModal — One-time Withdrawal', () => {
  it('shows correct title', () => {
    render(<TransactionModal type="oneTimeWithdrawal" transaction={{}} investments={investments} onSave={noop} onCancel={noop} />);
    expect(screen.getByText(/Add One-Time Withdrawal/)).toBeInTheDocument();
  });

  it('does NOT show recurring fields', () => {
    render(<TransactionModal type="oneTimeWithdrawal" transaction={{}} investments={investments} onSave={noop} onCancel={noop} />);
    expect(screen.queryByText('Duration (Years)')).not.toBeInTheDocument();
    expect(screen.queryByText('Annual Step-up (%)')).not.toBeInTheDocument();
  });
});
