import { describe, it, expect, beforeEach } from 'vitest';
import {
  usePlannerStore,
  selectActiveProfile,
  selectAllProfilesMerged,
} from '../index';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMPTY_PROFILE = {
  id: 1,
  name: 'Test Portfolio',
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
    profiles: [{ ...EMPTY_PROFILE }],
    activeProfileId: 1,
    globalSettings: { timelineYears: 30, startYear: 2024 },
  });
});

// ─── Profile ──────────────────────────────────────────────────────────────────

describe('addProfile', () => {
  it('appends a new profile and activates it', () => {
    usePlannerStore.getState().addProfile('Portfolio B');
    const { profiles, activeProfileId } = usePlannerStore.getState();
    expect(profiles).toHaveLength(2);
    expect(profiles[1]?.name).toBe('Portfolio B');
    expect(activeProfileId).toBe(profiles[1]?.id);
  });

  it('gives each new profile a unique id', () => {
    usePlannerStore.getState().addProfile('A');
    usePlannerStore.getState().addProfile('B');
    const ids = usePlannerStore.getState().profiles.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('updateProfileName', () => {
  it('renames an existing profile', () => {
    usePlannerStore.getState().updateProfileName(1, 'Renamed');
    expect(usePlannerStore.getState().profiles[0]?.name).toBe('Renamed');
  });

  it('is a no-op for unknown id', () => {
    usePlannerStore.getState().updateProfileName(999, 'X');
    expect(usePlannerStore.getState().profiles[0]?.name).toBe('Test Portfolio');
  });
});

describe('removeProfile', () => {
  it('removes the profile and falls back to first remaining', () => {
    usePlannerStore.getState().addProfile('Profile B');
    const { profiles } = usePlannerStore.getState();
    usePlannerStore.getState().removeProfile(profiles[1]!.id);
    expect(usePlannerStore.getState().profiles).toHaveLength(1);
    expect(usePlannerStore.getState().activeProfileId).toBe(1);
  });

  it('reassigns active when the active profile is removed', () => {
    usePlannerStore.getState().addProfile('Profile B');
    const id2 = usePlannerStore.getState().profiles[1]!.id;
    usePlannerStore.getState().setActiveProfile(id2);
    usePlannerStore.getState().removeProfile(id2);
    // Falls back to first remaining profile
    expect(usePlannerStore.getState().activeProfileId).toBe(1);
  });
});

describe('setActiveProfile', () => {
  it('changes the active profile id', () => {
    usePlannerStore.getState().addProfile('B');
    const id2 = usePlannerStore.getState().profiles[1]!.id;
    usePlannerStore.getState().setActiveProfile(id2);
    expect(usePlannerStore.getState().activeProfileId).toBe(id2);
  });

  it('accepts the "all" sentinel', () => {
    usePlannerStore.getState().setActiveProfile('all');
    expect(usePlannerStore.getState().activeProfileId).toBe('all');
  });
});

// ─── Investment ───────────────────────────────────────────────────────────────

const BASE_INV = {
  name: 'Nifty 50',
  assetClass: 'Equity',
  annualReturn: 12,
  returnType: 'basic' as const,
  variableReturns: [],
};

describe('Investment management', () => {
  it('adds an investment with a generated id', () => {
    usePlannerStore.getState().addInvestment(1, BASE_INV);
    const inv = usePlannerStore.getState().profiles[0]?.investments[0];
    expect(inv?.name).toBe('Nifty 50');
    expect(typeof inv?.id).toBe('number');
  });

  it('updates an investment field', () => {
    usePlannerStore.getState().addInvestment(1, BASE_INV);
    const inv = usePlannerStore.getState().profiles[0]!.investments[0]!;
    usePlannerStore.getState().updateInvestment(1, { ...inv, annualReturn: 15 });
    expect(usePlannerStore.getState().profiles[0]?.investments[0]?.annualReturn).toBe(15);
  });

  it('removes an investment by id', () => {
    usePlannerStore.getState().addInvestment(1, BASE_INV);
    const { id } = usePlannerStore.getState().profiles[0]!.investments[0]!;
    usePlannerStore.getState().removeInvestment(1, id);
    expect(usePlannerStore.getState().profiles[0]?.investments).toHaveLength(0);
  });

  it('is a no-op for unknown profile', () => {
    usePlannerStore.getState().addInvestment(999, BASE_INV);
    expect(usePlannerStore.getState().profiles[0]?.investments).toHaveLength(0);
  });
});

// ─── SIP ──────────────────────────────────────────────────────────────────────

const BASE_SIP = {
  investmentId: 10,
  amount: 5000,
  startDate: '2024-01-01',
  durationYears: 10,
  frequency: 'Monthly' as const,
  stepUpPercent: 5,
};

describe('SIP management', () => {
  it('adds a SIP with a generated id', () => {
    usePlannerStore.getState().addSip(1, BASE_SIP);
    expect(usePlannerStore.getState().profiles[0]?.sips).toHaveLength(1);
  });

  it('updates a SIP', () => {
    usePlannerStore.getState().addSip(1, BASE_SIP);
    const sip = usePlannerStore.getState().profiles[0]!.sips[0]!;
    usePlannerStore.getState().updateSip(1, { ...sip, amount: 10000 });
    expect(usePlannerStore.getState().profiles[0]?.sips[0]?.amount).toBe(10000);
  });

  it('removes a SIP', () => {
    usePlannerStore.getState().addSip(1, BASE_SIP);
    const { id } = usePlannerStore.getState().profiles[0]!.sips[0]!;
    usePlannerStore.getState().removeSip(1, id);
    expect(usePlannerStore.getState().profiles[0]?.sips).toHaveLength(0);
  });
});

// ─── Lumpsum ──────────────────────────────────────────────────────────────────

const BASE_LUMPSUM = {
  investmentId: 1,
  amount: 100_000,
  date: '2024-06-01',
};

describe('Lumpsum management', () => {
  it('adds a lumpsum with a generated id', () => {
    usePlannerStore.getState().addLumpsum(1, BASE_LUMPSUM);
    const ls = usePlannerStore.getState().profiles[0]?.lumpsums[0];
    expect(ls?.amount).toBe(100_000);
    expect(typeof ls?.id).toBe('number');
  });

  it('updates a lumpsum amount', () => {
    usePlannerStore.getState().addLumpsum(1, BASE_LUMPSUM);
    const ls = usePlannerStore.getState().profiles[0]!.lumpsums[0]!;
    usePlannerStore.getState().updateLumpsum(1, { ...ls, amount: 200_000 });
    expect(usePlannerStore.getState().profiles[0]?.lumpsums[0]?.amount).toBe(200_000);
  });

  it('removes a lumpsum', () => {
    usePlannerStore.getState().addLumpsum(1, BASE_LUMPSUM);
    const { id } = usePlannerStore.getState().profiles[0]!.lumpsums[0]!;
    usePlannerStore.getState().removeLumpsum(1, id);
    expect(usePlannerStore.getState().profiles[0]?.lumpsums).toHaveLength(0);
  });
});

// ─── SWP ──────────────────────────────────────────────────────────────────────

const BASE_SWP = {
  investmentId: 1,
  amount: 20_000,
  startDate: '2030-01-01',
  durationYears: 10,
  frequency: 'Monthly' as const,
  stepUpPercent: 3,
};

describe('SWP management', () => {
  it('adds a SWP with a generated id', () => {
    usePlannerStore.getState().addSwp(1, BASE_SWP);
    const swp = usePlannerStore.getState().profiles[0]?.swps[0];
    expect(swp?.amount).toBe(20_000);
    expect(typeof swp?.id).toBe('number');
  });

  it('updates a SWP amount', () => {
    usePlannerStore.getState().addSwp(1, BASE_SWP);
    const swp = usePlannerStore.getState().profiles[0]!.swps[0]!;
    usePlannerStore.getState().updateSwp(1, { ...swp, amount: 30_000 });
    expect(usePlannerStore.getState().profiles[0]?.swps[0]?.amount).toBe(30_000);
  });

  it('removes a SWP', () => {
    usePlannerStore.getState().addSwp(1, BASE_SWP);
    const { id } = usePlannerStore.getState().profiles[0]!.swps[0]!;
    usePlannerStore.getState().removeSwp(1, id);
    expect(usePlannerStore.getState().profiles[0]?.swps).toHaveLength(0);
  });
});

// ─── OneTimeWithdrawal ────────────────────────────────────────────────────────

const BASE_OTW = {
  investmentId: 1,
  amount: 500_000,
  date: '2035-01-01',
};

describe('OneTimeWithdrawal management', () => {
  it('adds a one-time withdrawal with a generated id', () => {
    usePlannerStore.getState().addOneTimeWithdrawal(1, BASE_OTW);
    const w = usePlannerStore.getState().profiles[0]?.oneTimeWithdrawals[0];
    expect(w?.amount).toBe(500_000);
    expect(typeof w?.id).toBe('number');
  });

  it('updates a one-time withdrawal', () => {
    usePlannerStore.getState().addOneTimeWithdrawal(1, BASE_OTW);
    const w = usePlannerStore.getState().profiles[0]!.oneTimeWithdrawals[0]!;
    usePlannerStore.getState().updateOneTimeWithdrawal(1, { ...w, amount: 750_000 });
    expect(usePlannerStore.getState().profiles[0]?.oneTimeWithdrawals[0]?.amount).toBe(750_000);
  });

  it('removes a one-time withdrawal', () => {
    usePlannerStore.getState().addOneTimeWithdrawal(1, BASE_OTW);
    const { id } = usePlannerStore.getState().profiles[0]!.oneTimeWithdrawals[0]!;
    usePlannerStore.getState().removeOneTimeWithdrawal(1, id);
    expect(usePlannerStore.getState().profiles[0]?.oneTimeWithdrawals).toHaveLength(0);
  });
});

// ─── Goal ─────────────────────────────────────────────────────────────────────

describe('Goal management', () => {
  it('adds a goal with a generated id', () => {
    usePlannerStore.getState().addGoal(1, { name: 'House', year: 2030, withdrawals: [] });
    const goal = usePlannerStore.getState().profiles[0]?.goals[0];
    expect(goal?.name).toBe('House');
    expect(typeof goal?.id).toBe('number');
  });

  it('updates a goal', () => {
    usePlannerStore.getState().addGoal(1, { name: 'House', year: 2030, withdrawals: [] });
    const goal = usePlannerStore.getState().profiles[0]!.goals[0]!;
    usePlannerStore.getState().updateGoal(1, { ...goal, year: 2032 });
    expect(usePlannerStore.getState().profiles[0]?.goals[0]?.year).toBe(2032);
  });

  it('removes a goal', () => {
    usePlannerStore.getState().addGoal(1, { name: 'House', year: 2030, withdrawals: [] });
    const { id } = usePlannerStore.getState().profiles[0]!.goals[0]!;
    usePlannerStore.getState().removeGoal(1, id);
    expect(usePlannerStore.getState().profiles[0]?.goals).toHaveLength(0);
  });
});

// ─── RebalancingEvent ─────────────────────────────────────────────────────────

const BASE_REBALANCE = {
  date: '2025-06-01',
  amount: 100_000,
  fromInvestmentId: 1,
  toInvestmentId: 2,
};

describe('RebalancingEvent management', () => {
  it('adds a rebalancing event with a generated id', () => {
    usePlannerStore.getState().addRebalancingEvent(1, BASE_REBALANCE);
    const ev = usePlannerStore.getState().profiles[0]?.rebalancingEvents[0];
    expect(ev?.amount).toBe(100_000);
    expect(typeof ev?.id).toBe('number');
  });

  it('updates a rebalancing event', () => {
    usePlannerStore.getState().addRebalancingEvent(1, BASE_REBALANCE);
    const ev = usePlannerStore.getState().profiles[0]!.rebalancingEvents[0]!;
    usePlannerStore.getState().updateRebalancingEvent(1, { ...ev, amount: 200_000 });
    expect(usePlannerStore.getState().profiles[0]?.rebalancingEvents[0]?.amount).toBe(200_000);
  });

  it('removes a rebalancing event', () => {
    usePlannerStore.getState().addRebalancingEvent(1, BASE_REBALANCE);
    const { id } = usePlannerStore.getState().profiles[0]!.rebalancingEvents[0]!;
    usePlannerStore.getState().removeRebalancingEvent(1, id);
    expect(usePlannerStore.getState().profiles[0]?.rebalancingEvents).toHaveLength(0);
  });
});

// ─── Global settings ──────────────────────────────────────────────────────────

describe('updateGlobalSettings', () => {
  it('updates timelineYears', () => {
    usePlannerStore.getState().updateGlobalSettings({ timelineYears: 20 });
    expect(usePlannerStore.getState().globalSettings.timelineYears).toBe(20);
  });

  it('updates startYear without touching other fields', () => {
    usePlannerStore.getState().updateGlobalSettings({ startYear: 2025 });
    const { globalSettings } = usePlannerStore.getState();
    expect(globalSettings.startYear).toBe(2025);
    expect(globalSettings.timelineYears).toBe(30); // unchanged
  });
});

// ─── Selectors ────────────────────────────────────────────────────────────────

describe('selectActiveProfile', () => {
  it('returns the currently active profile', () => {
    const profile = selectActiveProfile(usePlannerStore.getState());
    expect(profile?.id).toBe(1);
  });

  it('returns null when activeProfileId is "all"', () => {
    usePlannerStore.getState().setActiveProfile('all');
    expect(selectActiveProfile(usePlannerStore.getState())).toBeNull();
  });

  it('returns null for an unknown id', () => {
    usePlannerStore.setState({ activeProfileId: 999 });
    expect(selectActiveProfile(usePlannerStore.getState())).toBeNull();
  });
});

describe('selectAllProfilesMerged', () => {
  it('merges investments from all profiles', () => {
    usePlannerStore.getState().addInvestment(1, BASE_INV);
    usePlannerStore.getState().addProfile('Profile B');
    const id2 = usePlannerStore.getState().profiles[1]!.id;
    usePlannerStore.getState().addInvestment(id2, { ...BASE_INV, name: 'Debt Fund', assetClass: 'Debt' });

    const merged = selectAllProfilesMerged(usePlannerStore.getState());
    expect(merged.investments).toHaveLength(2);
  });

  it('merges all entity types across profiles', () => {
    usePlannerStore.getState().addSip(1, BASE_SIP);
    usePlannerStore.getState().addLumpsum(1, BASE_LUMPSUM);
    usePlannerStore.getState().addGoal(1, { name: 'Car', year: 2028, withdrawals: [] });

    usePlannerStore.getState().addProfile('P2');
    const id2 = usePlannerStore.getState().profiles[1]!.id;
    usePlannerStore.getState().addSip(id2, BASE_SIP);
    usePlannerStore.getState().addGoal(id2, { name: 'Bike', year: 2029, withdrawals: [] });

    const merged = selectAllProfilesMerged(usePlannerStore.getState());
    expect(merged.sips).toHaveLength(2);
    expect(merged.lumpsums).toHaveLength(1);
    expect(merged.goals).toHaveLength(2);
  });

  it('returns name "All Profiles" and id 0', () => {
    const merged = selectAllProfilesMerged(usePlannerStore.getState());
    expect(merged.name).toBe('All Profiles');
    expect(merged.id).toBe(0);
  });
});

// ─── loadFromData ─────────────────────────────────────────────────────────────

describe('loadFromData', () => {
  it('replaces all state with imported data', () => {
    const imported = [
      { id: 99, name: 'Imported', investments: [], sips: [], lumpsums: [], swps: [], oneTimeWithdrawals: [], goals: [], rebalancingEvents: [] },
    ];
    usePlannerStore.getState().loadFromData(imported, { timelineYears: 25, startYear: 2022 });

    const { profiles, globalSettings, activeProfileId } = usePlannerStore.getState();
    expect(profiles[0]?.name).toBe('Imported');
    expect(globalSettings.timelineYears).toBe(25);
    expect(globalSettings.startYear).toBe(2022);
    expect(activeProfileId).toBe(99);
  });

  it('sets active to first profile after import', () => {
    const imported = [
      { id: 10, name: 'A', investments: [], sips: [], lumpsums: [], swps: [], oneTimeWithdrawals: [], goals: [], rebalancingEvents: [] },
      { id: 20, name: 'B', investments: [], sips: [], lumpsums: [], swps: [], oneTimeWithdrawals: [], goals: [], rebalancingEvents: [] },
    ];
    usePlannerStore.getState().loadFromData(imported, { timelineYears: 10, startYear: 2024 });
    expect(usePlannerStore.getState().activeProfileId).toBe(10);
  });
});
