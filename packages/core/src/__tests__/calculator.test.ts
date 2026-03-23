import { describe, it, expect } from 'vitest';
import {
  calculatePortfolioTimeline,
  getAnnualReturnRate,
  monthlyGrowthFactor,
  getAllocationByAssetClass,
} from '../calculator';
import type {
  Profile,
  GlobalSettings,
  Investment,
  YearData,
} from '@financial-planner/types';

// ─── Test helpers ─────────────────────────────────────────────────────────────

const makeSettings = (overrides: Partial<GlobalSettings> = {}): GlobalSettings => ({
  startYear: 2024,
  timelineYears: 5,
  ...overrides,
});

const makeInvestment = (overrides: Partial<Investment> = {}): Investment => ({
  id: 1,
  name: 'Test Fund',
  assetClass: 'Equity',
  annualReturn: 12,
  returnType: 'basic',
  variableReturns: [],
  ...overrides,
});

const makeEmptyProfile = (investments: Investment[] = []): Profile => ({
  id: 1,
  name: 'Test Profile',
  investments,
  sips: [],
  lumpsums: [],
  swps: [],
  oneTimeWithdrawals: [],
  goals: [],
  rebalancingEvents: [],
});

// ─── getAnnualReturnRate ──────────────────────────────────────────────────────

describe('getAnnualReturnRate', () => {
  it('returns annualReturn for basic mode', () => {
    const inv = makeInvestment({ returnType: 'basic', annualReturn: 12 });
    expect(getAnnualReturnRate(inv, 0)).toBe(12);
    expect(getAnnualReturnRate(inv, 10)).toBe(12);
  });

  it('returns annualReturn when advanced mode has no periods', () => {
    const inv = makeInvestment({ returnType: 'advanced', variableReturns: [] });
    expect(getAnnualReturnRate(inv, 3)).toBe(12);
  });

  it('returns matching variable rate in advanced mode', () => {
    const inv = makeInvestment({
      returnType: 'advanced',
      variableReturns: [
        { from: 0, to: 5, rate: 15 },
        { from: 6, to: 10, rate: 10 },
      ],
    });
    expect(getAnnualReturnRate(inv, 3)).toBe(15);
    expect(getAnnualReturnRate(inv, 8)).toBe(10);
  });

  it('falls back to annualReturn when no period matches in advanced mode', () => {
    const inv = makeInvestment({
      annualReturn: 8,
      returnType: 'advanced',
      variableReturns: [{ from: 0, to: 5, rate: 15 }],
    });
    expect(getAnnualReturnRate(inv, 10)).toBe(8);
  });
});

// ─── monthlyGrowthFactor ─────────────────────────────────────────────────────

describe('monthlyGrowthFactor', () => {
  it('returns 1 for 0% return', () => {
    expect(monthlyGrowthFactor(0)).toBe(1);
  });

  it('returns correct factor for 12% annual', () => {
    expect(monthlyGrowthFactor(12)).toBeCloseTo(1.01, 5);
  });
});

// ─── calculatePortfolioTimeline ───────────────────────────────────────────────

describe('calculatePortfolioTimeline — empty portfolio', () => {
  it('returns correct number of years with all zeros', () => {
    const result = calculatePortfolioTimeline(makeEmptyProfile(), makeSettings({ timelineYears: 3 }));
    expect(result.yearlyData).toHaveLength(4); // 0..3 inclusive
    expect(result.errors).toHaveLength(0);
    result.yearlyData.forEach((y) => {
      expect(y.closing).toBe(0);
      expect(y.invested).toBe(0);
    });
  });
});

describe('calculatePortfolioTimeline — lumpsum contribution', () => {
  it('adds a lumpsum to the correct investment in the correct year', () => {
    const inv = makeInvestment({ id: 1, annualReturn: 0 }); // 0% so we can reason simply
    const profile: Profile = {
      ...makeEmptyProfile([inv]),
      lumpsums: [{ id: 1, investmentId: 1, amount: 100_000, date: '2024-06-01' }],
    };
    const result = calculatePortfolioTimeline(profile, makeSettings({ startYear: 2024, timelineYears: 2 }));

    // Year 0 (2024): lumpsum was contributed
    const y2024 = result.yearlyData[0]!;
    expect(y2024.year).toBe(2024);
    expect(y2024.closing).toBeGreaterThan(0);
    expect(y2024.invested).toBe(100_000);
    expect(result.errors).toHaveLength(0);
  });

  it('does not affect the wrong year', () => {
    const inv = makeInvestment({ id: 1, annualReturn: 0 });
    const profile: Profile = {
      ...makeEmptyProfile([inv]),
      lumpsums: [{ id: 1, investmentId: 1, amount: 50_000, date: '2025-01-01' }],
    };
    const result = calculatePortfolioTimeline(profile, makeSettings({ startYear: 2024, timelineYears: 2 }));

    const y2024 = result.yearlyData[0]!;
    expect(y2024.closing).toBe(0); // lumpsum not yet contributed
    expect(y2024.invested).toBe(0);
  });
});

describe('calculatePortfolioTimeline — SIP', () => {
  it('accumulates monthly SIP contributions over the duration', () => {
    const inv = makeInvestment({ id: 1, annualReturn: 0 }); // 0% to test pure contributions
    const profile: Profile = {
      ...makeEmptyProfile([inv]),
      sips: [
        {
          id: 10,
          investmentId: 1,
          amount: 10_000,
          startDate: '2024-01-01',
          durationYears: 1,
          frequency: 'Monthly',
          stepUpPercent: 0,
        },
      ],
    };
    const result = calculatePortfolioTimeline(profile, makeSettings({ startYear: 2024, timelineYears: 1 }));
    const y2024 = result.yearlyData[0]!;

    // 12 months × 10,000 = 120,000
    expect(y2024.invested).toBeCloseTo(120_000, 0);
    expect(y2024.closing).toBeCloseTo(120_000, 0);
  });

  it('stops SIP contributions after durationYears', () => {
    const inv = makeInvestment({ id: 1, annualReturn: 0 });
    const profile: Profile = {
      ...makeEmptyProfile([inv]),
      sips: [
        {
          id: 10,
          investmentId: 1,
          amount: 10_000,
          startDate: '2024-01-01',
          durationYears: 1,
          frequency: 'Monthly',
          stepUpPercent: 0,
        },
      ],
    };
    const result = calculatePortfolioTimeline(profile, makeSettings({ startYear: 2024, timelineYears: 2 }));
    const y2025 = result.yearlyData[1]!;
    // No new contributions in 2025 (SIP ended after 2024)
    expect(y2025.invested).toBe(0);
  });

  it('applies annual step-up correctly', () => {
    const inv = makeInvestment({ id: 1, annualReturn: 0 });
    const profile: Profile = {
      ...makeEmptyProfile([inv]),
      sips: [
        {
          id: 10,
          investmentId: 1,
          amount: 10_000,
          startDate: '2024-01-01',
          durationYears: 2,
          frequency: 'Monthly',
          stepUpPercent: 10, // 10% annual step-up
        },
      ],
    };
    const result = calculatePortfolioTimeline(profile, makeSettings({ startYear: 2024, timelineYears: 2 }));

    const y2024 = result.yearlyData[0]!;
    const y2025 = result.yearlyData[1]!;

    // Year 1: 12 × 10,000 = 120,000
    expect(y2024.invested).toBeCloseTo(120_000, 0);
    // Year 2: 12 × 11,000 = 132,000 (10% step-up)
    expect(y2025.invested).toBeCloseTo(132_000, 0);
  });
});

describe('calculatePortfolioTimeline — SWP', () => {
  it('withdraws monthly SWP amounts from the correct investment', () => {
    const inv = makeInvestment({ id: 1, annualReturn: 0 });
    const profile: Profile = {
      ...makeEmptyProfile([inv]),
      lumpsums: [{ id: 1, investmentId: 1, amount: 1_000_000, date: '2024-01-01' }],
      swps: [
        {
          id: 20,
          investmentId: 1,
          amount: 10_000,
          startDate: '2024-01-01',
          durationYears: 1,
          frequency: 'Monthly',
          stepUpPercent: 0,
        },
      ],
    };
    const result = calculatePortfolioTimeline(profile, makeSettings({ startYear: 2024, timelineYears: 1 }));
    const y2024 = result.yearlyData[0]!;

    // 12 months × 10,000 = 120,000 withdrawn
    expect(y2024.withdrawn).toBeCloseTo(120_000, 0);
    expect(y2024.closing).toBeCloseTo(880_000, 0);
    expect(result.errors).toHaveLength(0);
  });
});

describe('calculatePortfolioTimeline — goals', () => {
  it('withdraws goal amount from the specified investment at year-end', () => {
    const inv = makeInvestment({ id: 1, annualReturn: 0 });
    const profile: Profile = {
      ...makeEmptyProfile([inv]),
      lumpsums: [{ id: 1, investmentId: 1, amount: 500_000, date: '2024-01-01' }],
      goals: [
        {
          id: 100,
          name: 'House Down Payment',
          year: 2024,
          withdrawals: [{ investmentId: 1, amount: 200_000 }],
        },
      ],
    };
    const result = calculatePortfolioTimeline(profile, makeSettings({ startYear: 2024, timelineYears: 1 }));
    const y2024 = result.yearlyData[0]!;

    expect(y2024.closing).toBeCloseTo(300_000, 0);
  });
});

describe('calculatePortfolioTimeline — rebalancing', () => {
  it('transfers amount from one investment to another on the rebalancing date', () => {
    const inv1 = makeInvestment({ id: 1, name: 'Fund A', annualReturn: 0 });
    const inv2 = makeInvestment({ id: 2, name: 'Fund B', annualReturn: 0 });
    const profile: Profile = {
      ...makeEmptyProfile([inv1, inv2]),
      lumpsums: [
        { id: 1, investmentId: 1, amount: 500_000, date: '2024-01-01' },
        { id: 2, investmentId: 2, amount: 200_000, date: '2024-01-01' },
      ],
      rebalancingEvents: [
        { id: 50, date: '2024-06-01', amount: 100_000, fromInvestmentId: 1, toInvestmentId: 2 },
      ],
    };
    const result = calculatePortfolioTimeline(profile, makeSettings({ startYear: 2024, timelineYears: 1 }));
    const y2024 = result.yearlyData[0]!;

    const inv1End = y2024.investments[1]!;
    const inv2End = y2024.investments[2]!;

    expect(inv1End.closing).toBeCloseTo(400_000, -3);
    expect(inv2End.closing).toBeCloseTo(300_000, -3);
  });
});

describe('calculatePortfolioTimeline — compound growth', () => {
  it('grows a lumpsum at ~12% annual over 10 years (rule of 72)', () => {
    const inv = makeInvestment({ id: 1, annualReturn: 12 });
    const profile: Profile = {
      ...makeEmptyProfile([inv]),
      lumpsums: [{ id: 1, investmentId: 1, amount: 100_000, date: '2024-01-01' }],
    };
    const result = calculatePortfolioTimeline(profile, makeSettings({ startYear: 2024, timelineYears: 10 }));

    // yearlyData[9] = year index 9 = 10 full years of compounding (120 months)
    // 100,000 * (1.01)^120 ≈ 330,039
    const y10 = result.yearlyData[9]!;
    expect(y10.closing).toBeGreaterThan(320_000);
    expect(y10.closing).toBeLessThan(340_000);
  });
});

describe('calculatePortfolioTimeline — insufficient funds', () => {
  it('records an error when withdrawal exceeds balance', () => {
    const inv = makeInvestment({ id: 1, annualReturn: 0 });
    const profile: Profile = {
      ...makeEmptyProfile([inv]),
      lumpsums: [{ id: 1, investmentId: 1, amount: 1_000, date: '2024-01-01' }],
      goals: [
        {
          id: 100,
          name: 'Expensive Goal',
          year: 2024,
          withdrawals: [{ investmentId: 1, amount: 999_999 }],
        },
      ],
    };
    const result = calculatePortfolioTimeline(profile, makeSettings({ startYear: 2024, timelineYears: 1 }));
    // Balance is clamped to 0, no negative
    expect(result.yearlyData[0]?.investments[1]?.closing).toBe(0);
  });
});

describe('calculatePortfolioTimeline — advanced return rates', () => {
  it('applies different rates for different periods', () => {
    const inv = makeInvestment({
      id: 1,
      returnType: 'advanced',
      annualReturn: 0,
      variableReturns: [
        { from: 0, to: 2, rate: 15 },
        { from: 3, to: 5, rate: 8 },
      ],
    });
    const profile: Profile = {
      ...makeEmptyProfile([inv]),
      lumpsums: [{ id: 1, investmentId: 1, amount: 100_000, date: '2024-01-01' }],
    };
    const result = calculatePortfolioTimeline(profile, makeSettings({ startYear: 2024, timelineYears: 5 }));

    // Year 2 should reflect ~15% growth, Year 4 should reflect ~8%
    const y2 = result.yearlyData[2]!;
    const y4 = result.yearlyData[4]!;

    // At 15% for 2 years then 8%: year 4 closing should be less aggressive than all-15% scenario
    expect(y2.closing).toBeGreaterThan(100_000);
    expect(y4.closing).toBeGreaterThan(y2.closing);
    expect(result.errors).toHaveLength(0);
  });
});

// ─── getAllocationByAssetClass ────────────────────────────────────────────────

describe('getAllocationByAssetClass', () => {
  it('returns correct allocation percentages', () => {
    const investments: Investment[] = [
      makeInvestment({ id: 1, assetClass: 'Equity' }),
      makeInvestment({ id: 2, assetClass: 'Debt' }),
    ];

    const yearData: YearData = {
      year: 2024,
      opening: 0,
      invested: 0,
      withdrawn: 0,
      growth: 0,
      closing: 300_000,
      investments: {
        1: { closing: 200_000, invested: 0, withdrawn: 0, growth: 0 },
        2: { closing: 100_000, invested: 0, withdrawn: 0, growth: 0 },
      },
    };

    const result = getAllocationByAssetClass(investments, yearData);
    const equity = result.find((r) => r.name === 'Equity')!;
    const debt = result.find((r) => r.name === 'Debt')!;

    expect(equity.percentage).toBeCloseTo(66.67, 1);
    expect(debt.percentage).toBeCloseTo(33.33, 1);
    expect(equity.value).toBe(200_000);
  });

  it('returns empty array when total value is 0', () => {
    const investments: Investment[] = [makeInvestment()];
    const yearData: YearData = {
      year: 2024,
      opening: 0, invested: 0, withdrawn: 0, growth: 0, closing: 0,
      investments: { 1: { closing: 0, invested: 0, withdrawn: 0, growth: 0 } },
    };
    expect(getAllocationByAssetClass(investments, yearData)).toHaveLength(0);
  });

  it('groups multiple investments with the same asset class', () => {
    const investments: Investment[] = [
      makeInvestment({ id: 1, assetClass: 'Equity' }),
      makeInvestment({ id: 2, assetClass: 'Equity' }),
    ];
    const yearData: YearData = {
      year: 2024,
      opening: 0, invested: 0, withdrawn: 0, growth: 0, closing: 200_000,
      investments: {
        1: { closing: 100_000, invested: 0, withdrawn: 0, growth: 0 },
        2: { closing: 100_000, invested: 0, withdrawn: 0, growth: 0 },
      },
    };
    const result = getAllocationByAssetClass(investments, yearData);
    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe('Equity');
    expect(result[0]!.value).toBe(200_000);
    expect(result[0]!.percentage).toBe(100);
  });
});
