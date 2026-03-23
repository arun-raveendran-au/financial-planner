import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { YearlyDataTable } from '../../components/ui/YearlyDataTable';
import type { YearData } from '@financial-planner/types';

const mockData: YearData[] = [
  {
    year: 2024,
    opening: 0,
    invested: 120_000,
    withdrawn: 0,
    growth: 15_000,
    closing: 135_000,
    investments: {},
  },
  {
    year: 2025,
    opening: 135_000,
    invested: 120_000,
    withdrawn: 20_000,
    growth: 18_000,
    closing: 253_000,
    investments: {},
  },
];

describe('YearlyDataTable', () => {
  it('renders the title', () => {
    render(<YearlyDataTable data={mockData} title="My Portfolio" />);
    expect(screen.getByText('My Portfolio')).toBeInTheDocument();
  });

  it('renders the correct number of rows', () => {
    render(<YearlyDataTable data={mockData} title="Test" />);
    expect(screen.getByText('2024')).toBeInTheDocument();
    expect(screen.getByText('2025')).toBeInTheDocument();
  });

  it('renders closing value for first year', () => {
    render(<YearlyDataTable data={mockData} title="Test" />);
    // 135,000 should appear as closing value for 2024
    expect(screen.getAllByText(/1,35,000/)[0]).toBeInTheDocument();
  });

  it('renders with empty data', () => {
    render(<YearlyDataTable data={[]} title="Empty" />);
    expect(screen.getByText('Empty')).toBeInTheDocument();
    // No year rows should be present
    expect(screen.queryByText('2024')).not.toBeInTheDocument();
  });
});
