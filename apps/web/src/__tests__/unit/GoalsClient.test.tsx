import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GoalsClient } from '../../app/(dashboard)/goals/GoalsClient';
import { usePlannerStore } from '../../store/plannerStore';

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

describe('GoalsClient — All Profiles guard', () => {
  it('shows guard message when All Profiles is active', () => {
    usePlannerStore.getState().setActiveProfile('all');
    render(<GoalsClient />);
    expect(screen.getByText('Select an individual profile to manage goals.')).toBeInTheDocument();
  });

  it('does not render the Add Goal button when All Profiles is active', () => {
    usePlannerStore.getState().setActiveProfile('all');
    render(<GoalsClient />);
    expect(screen.queryByTestId('add-goal-button')).not.toBeInTheDocument();
  });
});

describe('GoalsClient — empty state', () => {
  it('shows "No goals defined yet." when no goals exist', () => {
    render(<GoalsClient />);
    expect(screen.getByText('No goals defined yet.')).toBeInTheDocument();
  });

  it('renders the Add Goal button', () => {
    render(<GoalsClient />);
    expect(screen.getByTestId('add-goal-button')).toBeInTheDocument();
  });
});

describe('GoalsClient — Add Goal modal', () => {
  it('modal is hidden on initial render', () => {
    render(<GoalsClient />);
    expect(screen.queryByTestId('goal-name-input')).not.toBeInTheDocument();
  });

  it('clicking Add Goal opens the modal', () => {
    render(<GoalsClient />);
    fireEvent.click(screen.getByTestId('add-goal-button'));
    expect(screen.getByTestId('goal-name-input')).toBeInTheDocument();
  });

  it('modal title is "Add Goal" for a new goal', () => {
    render(<GoalsClient />);
    fireEvent.click(screen.getByTestId('add-goal-button'));
    expect(screen.getByRole('heading', { name: /Add Goal/ })).toBeInTheDocument();
  });

  it('default target year is current year + 5', () => {
    render(<GoalsClient />);
    fireEvent.click(screen.getByTestId('add-goal-button'));
    const expected = String(new Date().getFullYear() + 5);
    expect(screen.getByTestId('goal-year-input')).toHaveValue(
      new Date().getFullYear() + 5
    );
  });

  it('shows "Add investments first." in the withdrawals section when no investments', () => {
    render(<GoalsClient />);
    fireEvent.click(screen.getByTestId('add-goal-button'));
    expect(screen.getByText('Add investments first.')).toBeInTheDocument();
  });

  it('shows withdrawal input for each investment', () => {
    addInvestment('Nifty 50');
    addInvestment('Gold ETF');
    render(<GoalsClient />);
    fireEvent.click(screen.getByTestId('add-goal-button'));
    expect(screen.getByText('Nifty 50')).toBeInTheDocument();
    expect(screen.getByText('Gold ETF')).toBeInTheDocument();
  });

  it('saving a new goal adds it to the store', () => {
    render(<GoalsClient />);
    fireEvent.click(screen.getByTestId('add-goal-button'));
    fireEvent.change(screen.getByTestId('goal-name-input'), { target: { value: 'House' } });
    fireEvent.click(screen.getByTestId('save-goal-button'));
    expect(usePlannerStore.getState().profiles[0]!.goals).toHaveLength(1);
    expect(usePlannerStore.getState().profiles[0]!.goals[0]!.name).toBe('House');
  });

  it('saving closes the modal', () => {
    render(<GoalsClient />);
    fireEvent.click(screen.getByTestId('add-goal-button'));
    fireEvent.click(screen.getByTestId('save-goal-button'));
    expect(screen.queryByTestId('goal-name-input')).not.toBeInTheDocument();
  });

  it('cancelling closes the modal without saving', () => {
    render(<GoalsClient />);
    fireEvent.click(screen.getByTestId('add-goal-button'));
    fireEvent.change(screen.getByTestId('goal-name-input'), { target: { value: 'Car' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByTestId('goal-name-input')).not.toBeInTheDocument();
    expect(usePlannerStore.getState().profiles[0]!.goals).toHaveLength(0);
  });

  it('X button closes the modal', () => {
    render(<GoalsClient />);
    fireEvent.click(screen.getByTestId('add-goal-button'));
    // X button has no accessible name — it's the only button with an svg X icon
    const allButtons = screen.getAllByRole('button');
    const xBtn = allButtons.find((b) => b.querySelector('svg.lucide-x'));
    fireEvent.click(xBtn!);
    expect(screen.queryByTestId('goal-name-input')).not.toBeInTheDocument();
  });
});

describe('GoalsClient — Edit Goal modal', () => {
  const seedGoal = () => {
    usePlannerStore.getState().addGoal(1, {
      name: 'Retirement',
      year: 2045,
      withdrawals: [],
    });
  };

  it('clicking the edit icon opens the modal in edit mode', () => {
    seedGoal();
    render(<GoalsClient />);
    const goalId = usePlannerStore.getState().profiles[0]!.goals[0]!.id;
    // Edit button is inside the goal card
    const goalCard = screen.getByTestId(`goal-${goalId}`);
    const editBtn = goalCard.querySelectorAll('button')[0]!;
    fireEvent.click(editBtn);
    expect(screen.getByText('Edit Goal')).toBeInTheDocument();
  });

  it('edit modal pre-fills the goal name', () => {
    seedGoal();
    render(<GoalsClient />);
    const goalId = usePlannerStore.getState().profiles[0]!.goals[0]!.id;
    const goalCard = screen.getByTestId(`goal-${goalId}`);
    fireEvent.click(goalCard.querySelectorAll('button')[0]!);
    expect(screen.getByTestId('goal-name-input')).toHaveValue('Retirement');
  });

  it('edit modal pre-fills the target year', () => {
    seedGoal();
    render(<GoalsClient />);
    const goalId = usePlannerStore.getState().profiles[0]!.goals[0]!.id;
    const goalCard = screen.getByTestId(`goal-${goalId}`);
    fireEvent.click(goalCard.querySelectorAll('button')[0]!);
    expect(screen.getByTestId('goal-year-input')).toHaveValue(2045);
  });

  it('saving an edit updates the goal in the store (count stays at 1)', () => {
    seedGoal();
    render(<GoalsClient />);
    const goalId = usePlannerStore.getState().profiles[0]!.goals[0]!.id;
    const goalCard = screen.getByTestId(`goal-${goalId}`);
    fireEvent.click(goalCard.querySelectorAll('button')[0]!);
    fireEvent.change(screen.getByTestId('goal-name-input'), { target: { value: 'Early Retirement' } });
    fireEvent.click(screen.getByTestId('save-goal-button'));
    const goals = usePlannerStore.getState().profiles[0]!.goals;
    expect(goals).toHaveLength(1);
    expect(goals[0]!.name).toBe('Early Retirement');
  });
});

describe('GoalsClient — Remove Goal', () => {
  it('clicking the remove icon deletes the goal from the store', () => {
    usePlannerStore.getState().addGoal(1, { name: 'Vacation', year: 2026, withdrawals: [] });
    render(<GoalsClient />);
    const goalId = usePlannerStore.getState().profiles[0]!.goals[0]!.id;
    const goalCard = screen.getByTestId(`goal-${goalId}`);
    const removeBtn = goalCard.querySelectorAll('button')[1]!;
    fireEvent.click(removeBtn);
    expect(usePlannerStore.getState().profiles[0]!.goals).toHaveLength(0);
  });

  it('goal card disappears from UI after removal', () => {
    usePlannerStore.getState().addGoal(1, { name: 'Vacation', year: 2026, withdrawals: [] });
    render(<GoalsClient />);
    const goalId = usePlannerStore.getState().profiles[0]!.goals[0]!.id;
    const goalCard = screen.getByTestId(`goal-${goalId}`);
    fireEvent.click(goalCard.querySelectorAll('button')[1]!);
    expect(screen.queryByText('Vacation')).not.toBeInTheDocument();
  });
});

describe('GoalsClient — Goal card display', () => {
  it('renders goal name and target year', () => {
    usePlannerStore.getState().addGoal(1, { name: 'House', year: 2030, withdrawals: [] });
    render(<GoalsClient />);
    expect(screen.getByText('House')).toBeInTheDocument();
    expect(screen.getByText('Target year: 2030')).toBeInTheDocument();
  });

  it('shows withdrawal details with investment name', () => {
    addInvestment('Nifty 50');
    const invId = usePlannerStore.getState().profiles[0]!.investments[0]!.id;
    usePlannerStore.getState().addGoal(1, {
      name: 'House',
      year: 2030,
      withdrawals: [{ investmentId: invId, amount: 500000 }],
    });
    render(<GoalsClient />);
    expect(screen.getByText(/₹5,00,000/)).toBeInTheDocument();
    expect(screen.getByText('Nifty 50')).toBeInTheDocument();
  });

  it('shows "Unknown" when referenced investment no longer exists', () => {
    usePlannerStore.getState().addGoal(1, {
      name: 'Car',
      year: 2027,
      withdrawals: [{ investmentId: 9999, amount: 100000 }],
    });
    render(<GoalsClient />);
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('does not show the withdrawal list when all amounts are zero', () => {
    addInvestment('Nifty 50');
    const invId = usePlannerStore.getState().profiles[0]!.investments[0]!.id;
    usePlannerStore.getState().addGoal(1, {
      name: 'Misc',
      year: 2028,
      withdrawals: [{ investmentId: invId, amount: 0 }],
    });
    render(<GoalsClient />);
    // The <ul> list should not be present
    expect(screen.queryByText(/₹/)).not.toBeInTheDocument();
  });
});

describe('GoalsClient — withdrawal allocation in modal', () => {
  it('entering an amount for an investment records it in the withdrawal list', () => {
    addInvestment('Nifty 50');
    const invId = usePlannerStore.getState().profiles[0]!.investments[0]!.id;
    render(<GoalsClient />);
    fireEvent.click(screen.getByTestId('add-goal-button'));
    fireEvent.change(screen.getByTestId('goal-name-input'), { target: { value: 'House' } });
    // Find the amount input for the investment (placeholder="Amount")
    const amountInput = screen.getByPlaceholderText('Amount');
    fireEvent.change(amountInput, { target: { value: '250000' } });
    fireEvent.click(screen.getByTestId('save-goal-button'));
    const savedGoal = usePlannerStore.getState().profiles[0]!.goals[0]!;
    expect(savedGoal.withdrawals).toContainEqual({ investmentId: invId, amount: 250000 });
  });

  it('updating an existing withdrawal replaces its amount', () => {
    addInvestment('Nifty 50');
    const invId = usePlannerStore.getState().profiles[0]!.investments[0]!.id;
    usePlannerStore.getState().addGoal(1, {
      name: 'House',
      year: 2030,
      withdrawals: [{ investmentId: invId, amount: 100000 }],
    });
    const goalId = usePlannerStore.getState().profiles[0]!.goals[0]!.id;
    render(<GoalsClient />);
    const goalCard = screen.getByTestId(`goal-${goalId}`);
    fireEvent.click(goalCard.querySelectorAll('button')[0]!); // edit
    const amountInput = screen.getByPlaceholderText('Amount');
    fireEvent.change(amountInput, { target: { value: '200000' } });
    fireEvent.click(screen.getByTestId('save-goal-button'));
    const savedGoal = usePlannerStore.getState().profiles[0]!.goals[0]!;
    expect(savedGoal.withdrawals).toHaveLength(1);
    expect(savedGoal.withdrawals[0]!.amount).toBe(200000);
  });
});
