import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RebalancingClient } from '../../app/(dashboard)/rebalancing/RebalancingClient';
import { usePlannerStore } from '@financial-planner/store';

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

const addInvestment = (name: string) =>
  usePlannerStore.getState().addInvestment(1, {
    name,
    assetClass: 'Equity',
    annualReturn: 12,
    returnType: 'basic',
    variableReturns: [],
  });

beforeEach(resetStore);

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('RebalancingClient — All Profiles guard', () => {
  it('shows guard message when All Profiles is active', () => {
    usePlannerStore.getState().setActiveProfile('all');
    render(<RebalancingClient />);
    expect(
      screen.getByText('Select an individual profile to manage rebalancing.')
    ).toBeInTheDocument();
  });

  it('does not render the Add Event button when All Profiles is active', () => {
    usePlannerStore.getState().setActiveProfile('all');
    render(<RebalancingClient />);
    expect(screen.queryByTestId('add-rebalancing-button')).not.toBeInTheDocument();
  });
});

describe('RebalancingClient — empty state', () => {
  it('shows "No rebalancing events yet." when none exist', () => {
    render(<RebalancingClient />);
    expect(screen.getByText('No rebalancing events yet.')).toBeInTheDocument();
  });

  it('renders the Add Event button', () => {
    render(<RebalancingClient />);
    expect(screen.getByTestId('add-rebalancing-button')).toBeInTheDocument();
  });
});

describe('RebalancingClient — Add modal', () => {
  it('modal is hidden on initial render', () => {
    render(<RebalancingClient />);
    expect(screen.queryByTestId('rebalancing-amount-input')).not.toBeInTheDocument();
  });

  it('clicking Add Event opens the modal', () => {
    render(<RebalancingClient />);
    fireEvent.click(screen.getByTestId('add-rebalancing-button'));
    expect(screen.getByTestId('rebalancing-amount-input')).toBeInTheDocument();
  });

  it('modal title is "New Rebalancing Event" for a new entry', () => {
    render(<RebalancingClient />);
    fireEvent.click(screen.getByTestId('add-rebalancing-button'));
    expect(screen.getByRole('heading', { name: /New Rebalancing Event/ })).toBeInTheDocument();
  });

  it('default amount is 10000', () => {
    render(<RebalancingClient />);
    fireEvent.click(screen.getByTestId('add-rebalancing-button'));
    expect(screen.getByTestId('rebalancing-amount-input')).toHaveValue(10000);
  });

  it('default date is today', () => {
    render(<RebalancingClient />);
    fireEvent.click(screen.getByTestId('add-rebalancing-button'));
    const today = new Date().toISOString().split('T')[0];
    const dateInput = screen.getByDisplayValue(today!);
    expect(dateInput).toBeInTheDocument();
  });

  it('From and To dropdowns list profile investments', () => {
    addInvestment('Nifty 50');
    addInvestment('Gold ETF');
    render(<RebalancingClient />);
    fireEvent.click(screen.getByTestId('add-rebalancing-button'));
    expect(screen.getAllByText('Nifty 50')).toHaveLength(2); // one per dropdown
    expect(screen.getAllByText('Gold ETF')).toHaveLength(2);
  });

  it('saving adds the event to the store', () => {
    render(<RebalancingClient />);
    fireEvent.click(screen.getByTestId('add-rebalancing-button'));
    fireEvent.click(screen.getByTestId('save-rebalancing-button'));
    expect(usePlannerStore.getState().profiles[0]!.rebalancingEvents).toHaveLength(1);
  });

  it('saving closes the modal', () => {
    render(<RebalancingClient />);
    fireEvent.click(screen.getByTestId('add-rebalancing-button'));
    fireEvent.click(screen.getByTestId('save-rebalancing-button'));
    expect(screen.queryByTestId('rebalancing-amount-input')).not.toBeInTheDocument();
  });

  it('Cancel closes the modal without saving', () => {
    render(<RebalancingClient />);
    fireEvent.click(screen.getByTestId('add-rebalancing-button'));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByTestId('rebalancing-amount-input')).not.toBeInTheDocument();
    expect(usePlannerStore.getState().profiles[0]!.rebalancingEvents).toHaveLength(0);
  });

  it('X button closes the modal', () => {
    render(<RebalancingClient />);
    fireEvent.click(screen.getByTestId('add-rebalancing-button'));
    const xBtn = screen.getAllByRole('button').find((b) => b.querySelector('svg.lucide-x'));
    fireEvent.click(xBtn!);
    expect(screen.queryByTestId('rebalancing-amount-input')).not.toBeInTheDocument();
  });

  it('changing amount is saved to the store', () => {
    render(<RebalancingClient />);
    fireEvent.click(screen.getByTestId('add-rebalancing-button'));
    fireEvent.change(screen.getByTestId('rebalancing-amount-input'), { target: { value: '25000' } });
    fireEvent.click(screen.getByTestId('save-rebalancing-button'));
    expect(usePlannerStore.getState().profiles[0]!.rebalancingEvents[0]!.amount).toBe(25000);
  });

  it('selecting From investment is saved to the store', () => {
    addInvestment('Nifty 50');
    const invId = usePlannerStore.getState().profiles[0]!.investments[0]!.id;
    render(<RebalancingClient />);
    fireEvent.click(screen.getByTestId('add-rebalancing-button'));
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0]!, { target: { value: String(invId) } });
    fireEvent.click(screen.getByTestId('save-rebalancing-button'));
    expect(usePlannerStore.getState().profiles[0]!.rebalancingEvents[0]!.fromInvestmentId).toBe(invId);
  });

  it('selecting To investment is saved to the store', () => {
    addInvestment('Nifty 50');
    const invId = usePlannerStore.getState().profiles[0]!.investments[0]!.id;
    render(<RebalancingClient />);
    fireEvent.click(screen.getByTestId('add-rebalancing-button'));
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1]!, { target: { value: String(invId) } });
    fireEvent.click(screen.getByTestId('save-rebalancing-button'));
    expect(usePlannerStore.getState().profiles[0]!.rebalancingEvents[0]!.toInvestmentId).toBe(invId);
  });
});

describe('RebalancingClient — Edit modal', () => {
  const seedEvent = () => {
    addInvestment('Nifty 50');
    addInvestment('Gold ETF');
    const [inv1, inv2] = usePlannerStore.getState().profiles[0]!.investments;
    usePlannerStore.getState().addRebalancingEvent(1, {
      date: '2025-03-01',
      amount: 50000,
      fromInvestmentId: inv1!.id,
      toInvestmentId: inv2!.id,
    });
  };

  it('clicking Edit opens the modal in edit mode', () => {
    seedEvent();
    render(<RebalancingClient />);
    const eventId = usePlannerStore.getState().profiles[0]!.rebalancingEvents[0]!.id;
    const card = screen.getByTestId(`rebalancing-${eventId}`);
    fireEvent.click(card.querySelectorAll('button')[0]!);
    expect(screen.getByRole('heading', { name: /Edit Rebalancing Event/ })).toBeInTheDocument();
  });

  it('edit modal pre-fills amount', () => {
    seedEvent();
    render(<RebalancingClient />);
    const eventId = usePlannerStore.getState().profiles[0]!.rebalancingEvents[0]!.id;
    const card = screen.getByTestId(`rebalancing-${eventId}`);
    fireEvent.click(card.querySelectorAll('button')[0]!);
    expect(screen.getByTestId('rebalancing-amount-input')).toHaveValue(50000);
  });

  it('saving an edit updates the store (count stays at 1)', () => {
    seedEvent();
    render(<RebalancingClient />);
    const eventId = usePlannerStore.getState().profiles[0]!.rebalancingEvents[0]!.id;
    const card = screen.getByTestId(`rebalancing-${eventId}`);
    fireEvent.click(card.querySelectorAll('button')[0]!);
    fireEvent.change(screen.getByTestId('rebalancing-amount-input'), { target: { value: '75000' } });
    fireEvent.click(screen.getByTestId('save-rebalancing-button'));
    const events = usePlannerStore.getState().profiles[0]!.rebalancingEvents;
    expect(events).toHaveLength(1);
    expect(events[0]!.amount).toBe(75000);
  });
});

describe('RebalancingClient — Remove', () => {
  it('clicking the remove icon deletes the event from the store', () => {
    usePlannerStore.getState().addRebalancingEvent(1, {
      date: '2025-01-01', amount: 10000, fromInvestmentId: 0, toInvestmentId: 0,
    });
    render(<RebalancingClient />);
    const eventId = usePlannerStore.getState().profiles[0]!.rebalancingEvents[0]!.id;
    const card = screen.getByTestId(`rebalancing-${eventId}`);
    fireEvent.click(card.querySelectorAll('button')[1]!);
    expect(usePlannerStore.getState().profiles[0]!.rebalancingEvents).toHaveLength(0);
  });

  it('event card disappears from UI after removal', () => {
    usePlannerStore.getState().addRebalancingEvent(1, {
      date: '2025-01-01', amount: 10000, fromInvestmentId: 0, toInvestmentId: 0,
    });
    render(<RebalancingClient />);
    const eventId = usePlannerStore.getState().profiles[0]!.rebalancingEvents[0]!.id;
    const card = screen.getByTestId(`rebalancing-${eventId}`);
    fireEvent.click(card.querySelectorAll('button')[1]!);
    expect(screen.queryByTestId(`rebalancing-${eventId}`)).not.toBeInTheDocument();
  });
});

describe('RebalancingClient — event card display', () => {
  it('shows amount and date on the card', () => {
    usePlannerStore.getState().addRebalancingEvent(1, {
      date: '2025-06-15', amount: 30000, fromInvestmentId: 0, toInvestmentId: 0,
    });
    render(<RebalancingClient />);
    expect(screen.getByText(/₹30,000 on 2025-06-15/)).toBeInTheDocument();
  });

  it('shows from and to investment names', () => {
    addInvestment('Nifty 50');
    addInvestment('Gold ETF');
    const [inv1, inv2] = usePlannerStore.getState().profiles[0]!.investments;
    usePlannerStore.getState().addRebalancingEvent(1, {
      date: '2025-01-01', amount: 10000,
      fromInvestmentId: inv1!.id, toInvestmentId: inv2!.id,
    });
    render(<RebalancingClient />);
    expect(screen.getByText('Nifty 50')).toBeInTheDocument();
    expect(screen.getByText('Gold ETF')).toBeInTheDocument();
  });

  it('shows "Unknown" for both when investment ids are not found', () => {
    usePlannerStore.getState().addRebalancingEvent(1, {
      date: '2025-01-01', amount: 10000, fromInvestmentId: 9991, toInvestmentId: 9992,
    });
    render(<RebalancingClient />);
    const unknowns = screen.getAllByText('Unknown');
    expect(unknowns).toHaveLength(2);
  });
});
