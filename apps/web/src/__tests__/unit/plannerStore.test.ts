import { describe, it, expect, beforeEach } from 'vitest';
import { usePlannerStore, selectActiveProfile, selectAllProfilesMerged } from '../../store/plannerStore';

// Reset store before each test
beforeEach(() => {
  usePlannerStore.setState({
    profiles: [
      {
        id: 1,
        name: 'Test Profile',
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
});

describe('Profile management', () => {
  it('adds a new profile and sets it as active', () => {
    const store = usePlannerStore.getState();
    store.addProfile('Portfolio B');
    const state = usePlannerStore.getState();
    expect(state.profiles).toHaveLength(2);
    expect(state.profiles[1]?.name).toBe('Portfolio B');
    expect(state.activeProfileId).toBe(state.profiles[1]?.id);
  });

  it('updates a profile name', () => {
    usePlannerStore.getState().updateProfileName(1, 'Renamed');
    expect(usePlannerStore.getState().profiles[0]?.name).toBe('Renamed');
  });

  it('removes a profile and switches active to remaining', () => {
    usePlannerStore.getState().addProfile('Profile B');
    const { profiles } = usePlannerStore.getState();
    const idToRemove = profiles[1]!.id;
    usePlannerStore.getState().removeProfile(idToRemove);
    expect(usePlannerStore.getState().profiles).toHaveLength(1);
    expect(usePlannerStore.getState().activeProfileId).toBe(1);
  });
});

describe('Investment management', () => {
  it('adds an investment to a profile', () => {
    usePlannerStore.getState().addInvestment(1, {
      name: 'Nifty 50',
      assetClass: 'Equity',
      annualReturn: 12,
      returnType: 'basic',
      variableReturns: [],
    });
    const { profiles } = usePlannerStore.getState();
    expect(profiles[0]?.investments).toHaveLength(1);
    expect(profiles[0]?.investments[0]?.name).toBe('Nifty 50');
  });

  it('updates an investment', () => {
    usePlannerStore.getState().addInvestment(1, {
      name: 'Fund A',
      assetClass: 'Equity',
      annualReturn: 10,
      returnType: 'basic',
      variableReturns: [],
    });
    const inv = usePlannerStore.getState().profiles[0]!.investments[0]!;
    usePlannerStore.getState().updateInvestment(1, { ...inv, annualReturn: 15 });
    expect(usePlannerStore.getState().profiles[0]?.investments[0]?.annualReturn).toBe(15);
  });

  it('removes an investment', () => {
    usePlannerStore.getState().addInvestment(1, {
      name: 'Fund A',
      assetClass: 'Equity',
      annualReturn: 10,
      returnType: 'basic',
      variableReturns: [],
    });
    const { id } = usePlannerStore.getState().profiles[0]!.investments[0]!;
    usePlannerStore.getState().removeInvestment(1, id);
    expect(usePlannerStore.getState().profiles[0]?.investments).toHaveLength(0);
  });
});

describe('SIP management', () => {
  it('adds and removes a SIP', () => {
    const sip = {
      investmentId: 10,
      amount: 5000,
      startDate: '2024-01-01',
      durationYears: 10,
      frequency: 'Monthly' as const,
      stepUpPercent: 5,
    };
    usePlannerStore.getState().addSip(1, sip);
    expect(usePlannerStore.getState().profiles[0]?.sips).toHaveLength(1);
    const { id } = usePlannerStore.getState().profiles[0]!.sips[0]!;
    usePlannerStore.getState().removeSip(1, id);
    expect(usePlannerStore.getState().profiles[0]?.sips).toHaveLength(0);
  });
});

describe('Goal management', () => {
  it('adds, updates, and removes a goal', () => {
    usePlannerStore.getState().addGoal(1, { name: 'House', year: 2030, withdrawals: [] });
    const goal = usePlannerStore.getState().profiles[0]!.goals[0]!;
    expect(goal.name).toBe('House');

    usePlannerStore.getState().updateGoal(1, { ...goal, year: 2032 });
    expect(usePlannerStore.getState().profiles[0]?.goals[0]?.year).toBe(2032);

    usePlannerStore.getState().removeGoal(1, goal.id);
    expect(usePlannerStore.getState().profiles[0]?.goals).toHaveLength(0);
  });
});

describe('Global settings', () => {
  it('updates timeline years', () => {
    usePlannerStore.getState().updateGlobalSettings({ timelineYears: 20 });
    expect(usePlannerStore.getState().globalSettings.timelineYears).toBe(20);
  });

  it('updates start year', () => {
    usePlannerStore.getState().updateGlobalSettings({ startYear: 2025 });
    expect(usePlannerStore.getState().globalSettings.startYear).toBe(2025);
  });
});

describe('selectActiveProfile', () => {
  it('returns the active profile', () => {
    const state = usePlannerStore.getState();
    const profile = selectActiveProfile(state);
    expect(profile?.id).toBe(1);
  });

  it('returns null when activeProfileId is "all"', () => {
    usePlannerStore.getState().setActiveProfile('all');
    expect(selectActiveProfile(usePlannerStore.getState())).toBeNull();
  });
});

describe('selectAllProfilesMerged', () => {
  it('merges investments from all profiles', () => {
    usePlannerStore.getState().addInvestment(1, {
      name: 'Fund A', assetClass: 'Equity', annualReturn: 12, returnType: 'basic', variableReturns: [],
    });
    usePlannerStore.getState().addProfile('Profile 2');
    const { profiles } = usePlannerStore.getState();
    const id2 = profiles[1]!.id;
    usePlannerStore.getState().addInvestment(id2, {
      name: 'Fund B', assetClass: 'Debt', annualReturn: 8, returnType: 'basic', variableReturns: [],
    });
    const merged = selectAllProfilesMerged(usePlannerStore.getState());
    expect(merged.investments).toHaveLength(2);
  });
});

describe('loadFromData', () => {
  it('replaces state with imported data', () => {
    const imported = [{ id: 99, name: 'Imported', investments: [], sips: [], lumpsums: [], swps: [], oneTimeWithdrawals: [], goals: [], rebalancingEvents: [] }];
    usePlannerStore.getState().loadFromData(imported, { timelineYears: 25, startYear: 2022 });
    const state = usePlannerStore.getState();
    expect(state.profiles[0]?.name).toBe('Imported');
    expect(state.globalSettings.timelineYears).toBe(25);
    expect(state.activeProfileId).toBe(99);
  });
});
