import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InvestmentsClient } from '../../app/(dashboard)/investments/InvestmentsClient';
import { usePlannerStore } from '../../store/plannerStore';
import type { Investment } from '@financial-planner/types';

// ── Child component mocks ──────────────────────────────────────────────────────

vi.mock('@/components/investments/InvestmentCard', () => ({
  InvestmentCard: ({
    investment,
    onEdit,
    onRemove,
  }: {
    investment: Investment;
    onEdit: (inv: Investment) => void;
    onRemove: (id: number) => void;
  }) => (
    <div data-testid={`investment-card-${investment.id}`}>
      <span>{investment.name}</span>
      <button data-testid={`edit-btn-${investment.id}`} onClick={() => onEdit(investment)}>
        Edit
      </button>
      <button data-testid={`remove-btn-${investment.id}`} onClick={() => onRemove(investment.id)}>
        Remove
      </button>
    </div>
  ),
}));

vi.mock('@/components/investments/InvestmentModal', () => ({
  InvestmentModal: ({
    investment,
    onSave,
    onCancel,
  }: {
    investment: Partial<Investment>;
    onSave: (inv: Partial<Investment>) => void;
    onCancel: () => void;
  }) => (
    <div data-testid="investment-modal">
      <span data-testid="modal-investment-name">{investment.name}</span>
      <button data-testid="mock-modal-save" onClick={() => onSave(investment)}>
        Save
      </button>
      <button data-testid="mock-modal-cancel" onClick={onCancel}>
        Cancel
      </button>
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
    globalSettings: { timelineYears: 10, startYear: 2024 },
  });

beforeEach(resetStore);

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('InvestmentsClient — All Profiles guard', () => {
  it('shows "select a profile" message when All Profiles is active', () => {
    usePlannerStore.getState().setActiveProfile('all');
    render(<InvestmentsClient />);
    expect(screen.getByText('Select an individual profile to manage investments.')).toBeInTheDocument();
  });

  it('does not render the Add Investment button when All Profiles is active', () => {
    usePlannerStore.getState().setActiveProfile('all');
    render(<InvestmentsClient />);
    expect(screen.queryByTestId('add-investment-button')).not.toBeInTheDocument();
  });
});

describe('InvestmentsClient — empty state', () => {
  it('shows "No investments yet" when profile has no investments', () => {
    render(<InvestmentsClient />);
    expect(screen.getByText('No investments yet')).toBeInTheDocument();
  });

  it('renders the Add Investment button', () => {
    render(<InvestmentsClient />);
    expect(screen.getByTestId('add-investment-button')).toBeInTheDocument();
  });
});

describe('InvestmentsClient — investment cards', () => {
  it('renders a card for each investment', () => {
    usePlannerStore.getState().addInvestment(1, {
      name: 'Nifty 50', assetClass: 'Equity', annualReturn: 12, returnType: 'basic', variableReturns: [],
    });
    usePlannerStore.getState().addInvestment(1, {
      name: 'Gold ETF', assetClass: 'Gold', annualReturn: 8, returnType: 'basic', variableReturns: [],
    });
    render(<InvestmentsClient />);
    expect(screen.getByText('Nifty 50')).toBeInTheDocument();
    expect(screen.getByText('Gold ETF')).toBeInTheDocument();
  });

  it('does not show the empty state when investments exist', () => {
    usePlannerStore.getState().addInvestment(1, {
      name: 'Nifty 50', assetClass: 'Equity', annualReturn: 12, returnType: 'basic', variableReturns: [],
    });
    render(<InvestmentsClient />);
    expect(screen.queryByText('No investments yet')).not.toBeInTheDocument();
  });
});

describe('InvestmentsClient — Add Investment modal', () => {
  it('modal is hidden on initial render', () => {
    render(<InvestmentsClient />);
    expect(screen.queryByTestId('investment-modal')).not.toBeInTheDocument();
  });

  it('clicking Add Investment opens the modal', () => {
    render(<InvestmentsClient />);
    fireEvent.click(screen.getByTestId('add-investment-button'));
    expect(screen.getByTestId('investment-modal')).toBeInTheDocument();
  });

  it('modal pre-fills name as "Investment 1" when no investments exist', () => {
    render(<InvestmentsClient />);
    fireEvent.click(screen.getByTestId('add-investment-button'));
    expect(screen.getByTestId('modal-investment-name')).toHaveTextContent('Investment 1');
  });

  it('modal pre-fills name as "Investment 2" when one already exists', () => {
    usePlannerStore.getState().addInvestment(1, {
      name: 'Existing', assetClass: 'Equity', annualReturn: 12, returnType: 'basic', variableReturns: [],
    });
    render(<InvestmentsClient />);
    fireEvent.click(screen.getByTestId('add-investment-button'));
    expect(screen.getByTestId('modal-investment-name')).toHaveTextContent('Investment 2');
  });

  it('saving an add-modal creates a new investment in the store', () => {
    render(<InvestmentsClient />);
    fireEvent.click(screen.getByTestId('add-investment-button'));
    fireEvent.click(screen.getByTestId('mock-modal-save'));
    expect(usePlannerStore.getState().profiles[0]!.investments).toHaveLength(1);
  });

  it('saving closes the modal', () => {
    render(<InvestmentsClient />);
    fireEvent.click(screen.getByTestId('add-investment-button'));
    fireEvent.click(screen.getByTestId('mock-modal-save'));
    expect(screen.queryByTestId('investment-modal')).not.toBeInTheDocument();
  });

  it('cancelling closes the modal without saving', () => {
    render(<InvestmentsClient />);
    fireEvent.click(screen.getByTestId('add-investment-button'));
    fireEvent.click(screen.getByTestId('mock-modal-cancel'));
    expect(screen.queryByTestId('investment-modal')).not.toBeInTheDocument();
    expect(usePlannerStore.getState().profiles[0]!.investments).toHaveLength(0);
  });
});

describe('InvestmentsClient — Edit Investment modal', () => {
  it('clicking Edit on a card opens the modal in edit mode', () => {
    usePlannerStore.getState().addInvestment(1, {
      name: 'Nifty 50', assetClass: 'Equity', annualReturn: 12, returnType: 'basic', variableReturns: [],
    });
    const invId = usePlannerStore.getState().profiles[0]!.investments[0]!.id;
    render(<InvestmentsClient />);
    fireEvent.click(screen.getByTestId(`edit-btn-${invId}`));
    expect(screen.getByTestId('investment-modal')).toBeInTheDocument();
    expect(screen.getByTestId('modal-investment-name')).toHaveTextContent('Nifty 50');
  });

  it('saving an edit-modal calls updateInvestment (investment count stays the same)', () => {
    usePlannerStore.getState().addInvestment(1, {
      name: 'Nifty 50', assetClass: 'Equity', annualReturn: 12, returnType: 'basic', variableReturns: [],
    });
    const invId = usePlannerStore.getState().profiles[0]!.investments[0]!.id;
    render(<InvestmentsClient />);
    fireEvent.click(screen.getByTestId(`edit-btn-${invId}`));
    fireEvent.click(screen.getByTestId('mock-modal-save'));
    // updateInvestment replaces, so count stays at 1
    expect(usePlannerStore.getState().profiles[0]!.investments).toHaveLength(1);
    expect(screen.queryByTestId('investment-modal')).not.toBeInTheDocument();
  });
});

describe('InvestmentsClient — Remove Investment', () => {
  it('clicking Remove on a card removes the investment from the store', () => {
    usePlannerStore.getState().addInvestment(1, {
      name: 'Nifty 50', assetClass: 'Equity', annualReturn: 12, returnType: 'basic', variableReturns: [],
    });
    const invId = usePlannerStore.getState().profiles[0]!.investments[0]!.id;
    render(<InvestmentsClient />);
    fireEvent.click(screen.getByTestId(`remove-btn-${invId}`));
    expect(usePlannerStore.getState().profiles[0]!.investments).toHaveLength(0);
  });

  it('card disappears from UI after removal', () => {
    usePlannerStore.getState().addInvestment(1, {
      name: 'Nifty 50', assetClass: 'Equity', annualReturn: 12, returnType: 'basic', variableReturns: [],
    });
    const invId = usePlannerStore.getState().profiles[0]!.investments[0]!.id;
    render(<InvestmentsClient />);
    fireEvent.click(screen.getByTestId(`remove-btn-${invId}`));
    expect(screen.queryByText('Nifty 50')).not.toBeInTheDocument();
  });
});

describe('InvestmentsClient — year slider', () => {
  it('shows the correct year label', () => {
    render(<InvestmentsClient />);
    // Default yearOffset = timelineYears (10), startYear = 2024 → 2034
    expect(screen.getByText('2034')).toBeInTheDocument();
  });

  it('changing the slider updates the year label', () => {
    render(<InvestmentsClient />);
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '3' } });
    expect(screen.getByText('2027')).toBeInTheDocument();
  });
});
