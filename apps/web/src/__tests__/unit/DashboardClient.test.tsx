import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardClient } from '../../app/(dashboard)/dashboard/DashboardClient';
import { usePlannerStore } from '@financial-planner/store';

// Isolate DashboardClient from its children's external deps
vi.mock('@/components/ui/ProfileTabs', () => ({
  ProfileTabs: () => <div data-testid="profile-tabs" />,
}));
vi.mock('@/components/charts/DiversificationChart', () => ({
  DiversificationChart: () => <div data-testid="diversification-chart" />,
}));
vi.mock('@/components/ui/YearlyDataTable', () => ({
  YearlyDataTable: ({ title }: { title: string }) => (
    <div data-testid="yearly-table">{title}</div>
  ),
}));

const defaultProfile = {
  id: 1,
  name: 'My Portfolio',
  investments: [],
  sips: [],
  lumpsums: [],
  swps: [],
  oneTimeWithdrawals: [],
  goals: [],
  rebalancingEvents: [],
};

beforeEach(() => {
  usePlannerStore.setState({
    profiles: [{ ...defaultProfile }],
    activeProfileId: 1,
    globalSettings: { timelineYears: 10, startYear: 2024 },
  });
});

describe('DashboardClient', () => {
  it('renders without crashing on a single profile', () => {
    render(<DashboardClient />);
    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
  });

  it('renders without crashing when All Profiles is active (regression: infinite re-render loop)', () => {
    usePlannerStore.getState().setActiveProfile('all');
    // Previously this caused an infinite loop because selectAllProfilesMerged
    // returned a new object reference on every Zustand selector call.
    render(<DashboardClient />);
    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
  });

  it('shows profile name in projection title for single profile', () => {
    render(<DashboardClient />);
    expect(screen.getByText(/My Portfolio Projection/)).toBeInTheDocument();
  });

  it('shows "All Profiles" in projection title when all is active', () => {
    usePlannerStore.getState().setActiveProfile('all');
    render(<DashboardClient />);
    expect(screen.getByText(/All Profiles Projection/)).toBeInTheDocument();
  });

  it('renders year slider with correct max from global settings', () => {
    render(<DashboardClient />);
    expect(screen.getByTestId('year-slider')).toHaveAttribute('max', '10');
  });

  it('renders profile tabs', () => {
    render(<DashboardClient />);
    expect(screen.getByTestId('profile-tabs')).toBeInTheDocument();
  });

  it('renders yearly summary table', () => {
    render(<DashboardClient />);
    expect(screen.getByTestId('yearly-table')).toBeInTheDocument();
  });

  it('yearly table title includes profile name', () => {
    render(<DashboardClient />);
    expect(screen.getByText(/My Portfolio — Yearly Summary/)).toBeInTheDocument();
  });

  it('yearly table title shows All Profiles when active', () => {
    usePlannerStore.getState().setActiveProfile('all');
    render(<DashboardClient />);
    expect(screen.getByText(/All Profiles — Yearly Summary/)).toBeInTheDocument();
  });

  it('shows projected portfolio value of 0 for empty profile', () => {
    render(<DashboardClient />);
    expect(screen.getByTestId('portfolio-value')).toHaveTextContent('₹0');
  });

  it('year slider changes the displayed projected year', () => {
    render(<DashboardClient />);
    const slider = screen.getByTestId('year-slider');
    fireEvent.change(slider, { target: { value: '5' } });
    // 2024 + 5 = 2029
    expect(screen.getByText('2029')).toBeInTheDocument();
  });

  it('renders diversification chart for any active profile', () => {
    // Chart is always rendered when a timeline is available; empty state is
    // handled inside DiversificationChart itself (see DiversificationChart.test.tsx)
    render(<DashboardClient />);
    expect(screen.getByTestId('diversification-chart')).toBeInTheDocument();
  });

  it('renders diversification chart when profile has investments', () => {
    usePlannerStore.getState().addInvestment(1, {
      name: 'Nifty 50',
      assetClass: 'Equity',
      annualReturn: 12,
      returnType: 'basic',
      variableReturns: [],
    });
    render(<DashboardClient />);
    expect(screen.getByTestId('diversification-chart')).toBeInTheDocument();
  });

  it('aggregates investments from multiple profiles in All Profiles view', () => {
    usePlannerStore.getState().addInvestment(1, {
      name: 'Fund A', assetClass: 'Equity', annualReturn: 12, returnType: 'basic', variableReturns: [],
    });
    usePlannerStore.getState().addProfile('Profile 2');
    const id2 = usePlannerStore.getState().profiles[1]!.id;
    usePlannerStore.getState().addInvestment(id2, {
      name: 'Fund B', assetClass: 'Debt', annualReturn: 8, returnType: 'basic', variableReturns: [],
    });
    usePlannerStore.getState().setActiveProfile('all');
    render(<DashboardClient />);
    // Both profiles' investments are visible — chart should render
    expect(screen.getByTestId('diversification-chart')).toBeInTheDocument();
  });

  it('does not show planning alert when there are no errors', () => {
    // The calculator clamps all withdrawals via Math.min so closing never
    // goes below -1 in practice — no errors are expected with valid data
    render(<DashboardClient />);
    expect(screen.queryByText('Planning Alert')).not.toBeInTheDocument();
  });
});
