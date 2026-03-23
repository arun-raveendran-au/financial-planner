import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DiversificationChart } from '../../components/charts/DiversificationChart';
import type { Investment, YearData } from '@financial-planner/types';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: ({ data }: { data: { name: string }[] }) => (
    <div data-testid="pie">
      {data.map((d) => (
        <span key={d.name}>{d.name}</span>
      ))}
    </div>
  ),
  Cell: () => null,
  Tooltip: () => null,
}));

const makeYearData = (investmentValues: Record<number, number>): YearData => ({
  year: 2024,
  opening: 0,
  invested: 0,
  withdrawn: 0,
  growth: 0,
  closing: Object.values(investmentValues).reduce((a, b) => a + b, 0),
  investments: Object.fromEntries(
    Object.entries(investmentValues).map(([id, closing]) => [
      id,
      { closing, invested: 0, withdrawn: 0, growth: 0 },
    ])
  ),
});

const makeInvestment = (id: number, assetClass: string): Investment => ({
  id,
  name: `Fund ${id}`,
  assetClass,
  annualReturn: 12,
  returnType: 'basic',
  variableReturns: [],
});

describe('DiversificationChart', () => {
  it('shows empty state when there are no investments', () => {
    const yearData = makeYearData({});
    render(
      <DiversificationChart
        investments={[]}
        yearlyData={[yearData]}
        yearOffset={0}
        startYear={2024}
      />
    );
    expect(screen.getByText('No data for this year')).toBeInTheDocument();
  });

  it('shows empty state when all investment values are zero', () => {
    const inv = makeInvestment(1, 'Equity');
    const yearData = makeYearData({ 1: 0 });
    render(
      <DiversificationChart
        investments={[inv]}
        yearlyData={[yearData]}
        yearOffset={0}
        startYear={2024}
      />
    );
    expect(screen.getByText('No data for this year')).toBeInTheDocument();
  });

  it('renders pie chart when investments have value', () => {
    const inv = makeInvestment(1, 'Equity');
    const yearData = makeYearData({ 1: 100_000 });
    render(
      <DiversificationChart
        investments={[inv]}
        yearlyData={[yearData]}
        yearOffset={0}
        startYear={2024}
      />
    );
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  it('groups investments by asset class', () => {
    const investments = [
      makeInvestment(1, 'Equity'),
      makeInvestment(2, 'Equity'),
      makeInvestment(3, 'Debt'),
    ];
    const yearData = makeYearData({ 1: 60_000, 2: 40_000, 3: 50_000 });
    render(
      <DiversificationChart
        investments={investments}
        yearlyData={[yearData]}
        yearOffset={0}
        startYear={2024}
      />
    );
    // Equity and Debt should appear as groups (not individual fund names)
    const equityItems = screen.getAllByText('Equity');
    const debtItems = screen.getAllByText('Debt');
    expect(equityItems.length).toBeGreaterThan(0);
    expect(debtItems.length).toBeGreaterThan(0);
  });

  it('shows correct display year in heading', () => {
    const inv = makeInvestment(1, 'Equity');
    const yearData = makeYearData({ 1: 100_000 });
    render(
      <DiversificationChart
        investments={[inv]}
        yearlyData={[yearData]}
        yearOffset={0}
        startYear={2026}
      />
    );
    expect(screen.getByText(/Asset allocation in 2026/)).toBeInTheDocument();
  });

  it('uses the correct year from yearOffset', () => {
    const inv = makeInvestment(1, 'Equity');
    const yearData0 = makeYearData({ 1: 50_000 });
    const yearData5 = makeYearData({ 1: 100_000 });
    render(
      <DiversificationChart
        investments={[inv]}
        yearlyData={[yearData0, yearData0, yearData0, yearData0, yearData0, yearData5]}
        yearOffset={5}
        startYear={2024}
      />
    );
    expect(screen.getByText(/Asset allocation in 2029/)).toBeInTheDocument();
  });

  it('shows empty state when yearOffset points to undefined yearData', () => {
    const inv = makeInvestment(1, 'Equity');
    const yearData = makeYearData({ 1: 100_000 });
    render(
      <DiversificationChart
        investments={[inv]}
        yearlyData={[yearData]}
        yearOffset={99}
        startYear={2024}
      />
    );
    expect(screen.getByText('No data for this year')).toBeInTheDocument();
  });

  it('renders the heading', () => {
    render(
      <DiversificationChart
        investments={[]}
        yearlyData={[makeYearData({})]}
        yearOffset={0}
        startYear={2024}
      />
    );
    expect(screen.getByText('Diversification')).toBeInTheDocument();
  });
});
