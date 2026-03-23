import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InvestmentCard } from '../../components/investments/InvestmentCard';
import type { Investment, YearData } from '@financial-planner/types';

const baseInvestment: Investment = {
  id: 1,
  name: 'Nifty 50 Index',
  assetClass: 'Equity',
  annualReturn: 12,
  returnType: 'basic',
  variableReturns: [],
};

const makeYearData = (overrides = {}): YearData => ({
  year: 2024,
  opening: 0,
  invested: 120_000,
  withdrawn: 10_000,
  growth: 15_000,
  closing: 125_000,
  investments: {
    1: { closing: 125_000, invested: 120_000, withdrawn: 10_000, growth: 15_000 },
  },
  ...overrides,
});

afterEach(() => vi.clearAllMocks());

describe('InvestmentCard', () => {
  it('renders the investment name', () => {
    render(
      <InvestmentCard
        investment={baseInvestment}
        yearData={makeYearData()}
        color="#6366f1"
        onEdit={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    expect(screen.getByText('Nifty 50 Index')).toBeInTheDocument();
  });

  it('renders the asset class badge', () => {
    render(
      <InvestmentCard
        investment={baseInvestment}
        yearData={makeYearData()}
        color="#6366f1"
        onEdit={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    expect(screen.getByText('Equity')).toBeInTheDocument();
  });

  it('shows "Unclassified" when assetClass is empty', () => {
    render(
      <InvestmentCard
        investment={{ ...baseInvestment, assetClass: '' }}
        yearData={makeYearData()}
        color="#6366f1"
        onEdit={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    expect(screen.getByText('Unclassified')).toBeInTheDocument();
  });

  it('renders closing portfolio value', () => {
    render(
      <InvestmentCard
        investment={baseInvestment}
        yearData={makeYearData()}
        color="#6366f1"
        onEdit={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    expect(screen.getByText('₹1,25,000')).toBeInTheDocument();
  });

  it('shows zero portfolio value when yearData is undefined', () => {
    render(
      <InvestmentCard
        investment={baseInvestment}
        yearData={undefined}
        color="#6366f1"
        onEdit={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    expect(screen.getByText('₹0')).toBeInTheDocument();
  });

  it('calls onEdit with investment when edit button is clicked', () => {
    const onEdit = vi.fn();
    render(
      <InvestmentCard
        investment={baseInvestment}
        yearData={makeYearData()}
        color="#6366f1"
        onEdit={onEdit}
        onRemove={vi.fn()}
      />
    );
    fireEvent.click(screen.getByTestId('edit-investment-1'));
    expect(onEdit).toHaveBeenCalledWith(baseInvestment);
  });

  it('calls onRemove with investment id when remove button is clicked', () => {
    const onRemove = vi.fn();
    render(
      <InvestmentCard
        investment={baseInvestment}
        yearData={makeYearData()}
        color="#6366f1"
        onEdit={vi.fn()}
        onRemove={onRemove}
      />
    );
    fireEvent.click(screen.getByTestId('remove-investment-1'));
    expect(onRemove).toHaveBeenCalledWith(1);
  });

  it('shows "X% p.a." badge for basic return type', () => {
    render(
      <InvestmentCard
        investment={baseInvestment}
        yearData={makeYearData()}
        color="#6366f1"
        onEdit={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    expect(screen.getByText('12% p.a.')).toBeInTheDocument();
  });

  it('shows "Variable return" badge for advanced return type', () => {
    render(
      <InvestmentCard
        investment={{ ...baseInvestment, returnType: 'advanced' }}
        yearData={makeYearData()}
        color="#6366f1"
        onEdit={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    expect(screen.getByText('Variable return')).toBeInTheDocument();
  });

  it('net change is positive when growth + invested > withdrawn', () => {
    render(
      <InvestmentCard
        investment={baseInvestment}
        yearData={makeYearData()}
        color="#6366f1"
        onEdit={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    // growth(15000) + invested(120000) - withdrawn(10000) = 125000
    expect(screen.getByText(/\+₹1,25,000/)).toBeInTheDocument();
  });
});
