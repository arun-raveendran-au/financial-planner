// ─────────────────────────────────────────────────────────────────────────────
// Investment
// ─────────────────────────────────────────────────────────────────────────────

export type ReturnType = 'basic' | 'advanced';
export type Frequency = 'Monthly' | 'Yearly';

export interface VariableReturnPeriod {
  from: number; // year offset from start
  to: number;
  rate: number; // annual % rate
}

export interface Investment {
  id: number;
  name: string;
  assetClass: string;
  annualReturn: number; // used when returnType === 'basic'
  returnType: ReturnType;
  variableReturns: VariableReturnPeriod[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Transactions — Contributions
// ─────────────────────────────────────────────────────────────────────────────

export interface SIP {
  id: number;
  investmentId: number;
  amount: number;
  startDate: string; // ISO date string
  durationYears: number;
  frequency: Frequency;
  stepUpPercent: number; // annual step-up %
}

export interface Lumpsum {
  id: number;
  investmentId: number;
  amount: number;
  date: string; // ISO date string
}

// ─────────────────────────────────────────────────────────────────────────────
// Transactions — Withdrawals
// ─────────────────────────────────────────────────────────────────────────────

export interface SWP {
  id: number;
  investmentId: number;
  amount: number;
  startDate: string;
  durationYears: number;
  frequency: Frequency;
  stepUpPercent: number;
}

export interface OneTimeWithdrawal {
  id: number;
  investmentId: number;
  amount: number;
  date: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Goals
// ─────────────────────────────────────────────────────────────────────────────

export interface GoalWithdrawal {
  investmentId: number;
  amount: number;
}

export interface Goal {
  id: number;
  name: string;
  year: number;
  withdrawals: GoalWithdrawal[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Rebalancing
// ─────────────────────────────────────────────────────────────────────────────

export interface RebalancingEvent {
  id: number;
  date: string;
  amount: number;
  fromInvestmentId: number;
  toInvestmentId: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Profile
// ─────────────────────────────────────────────────────────────────────────────

export interface Profile {
  id: number;
  name: string;
  investments: Investment[];
  sips: SIP[];
  lumpsums: Lumpsum[];
  swps: SWP[];
  oneTimeWithdrawals: OneTimeWithdrawal[];
  goals: Goal[];
  rebalancingEvents: RebalancingEvent[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────────────────────────────────────

export interface GlobalSettings {
  timelineYears: number;
  startYear: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Calculation Engine Output
// ─────────────────────────────────────────────────────────────────────────────

export interface InvestmentYearData {
  closing: number;
  invested: number;
  withdrawn: number;
  growth: number;
}

export interface YearData {
  year: number;
  opening: number;
  invested: number;
  withdrawn: number;
  growth: number;
  closing: number;
  investments: Record<number, InvestmentYearData>;
}

export interface PortfolioTimeline {
  yearlyData: YearData[];
  errors: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Supabase / API shapes (DB rows will map to these)
// ─────────────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;         // UUID from Supabase auth
  email: string;
  displayName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AppData {
  profiles: Profile[];
  globalSettings: GlobalSettings;
}
