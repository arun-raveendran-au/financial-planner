/**
 * Central Zustand store for the financial planner.
 * Holds all profiles + global settings and exposes CRUD actions.
 * The portfolio timeline is derived via a selector (not stored) to avoid stale data.
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  Profile,
  GlobalSettings,
  Investment,
  SIP,
  Lumpsum,
  SWP,
  OneTimeWithdrawal,
  Goal,
  RebalancingEvent,
} from '@financial-planner/types';

// ─── State shape ──────────────────────────────────────────────────────────────

export interface PlannerState {
  profiles: Profile[];
  activeProfileId: number | 'all';
  globalSettings: GlobalSettings;

  // Profile actions
  addProfile: (name: string) => void;
  updateProfileName: (id: number, name: string) => void;
  removeProfile: (id: number) => void;
  setActiveProfile: (id: number | 'all') => void;

  // Investment actions
  addInvestment: (profileId: number, investment: Omit<Investment, 'id'>) => void;
  updateInvestment: (profileId: number, investment: Investment) => void;
  removeInvestment: (profileId: number, investmentId: number) => void;

  // SIP actions
  addSip: (profileId: number, sip: Omit<SIP, 'id'>) => void;
  updateSip: (profileId: number, sip: SIP) => void;
  removeSip: (profileId: number, sipId: number) => void;

  // Lumpsum actions
  addLumpsum: (profileId: number, lumpsum: Omit<Lumpsum, 'id'>) => void;
  updateLumpsum: (profileId: number, lumpsum: Lumpsum) => void;
  removeLumpsum: (profileId: number, lumpsumId: number) => void;

  // SWP actions
  addSwp: (profileId: number, swp: Omit<SWP, 'id'>) => void;
  updateSwp: (profileId: number, swp: SWP) => void;
  removeSwp: (profileId: number, swpId: number) => void;

  // One-time withdrawal actions
  addOneTimeWithdrawal: (profileId: number, w: Omit<OneTimeWithdrawal, 'id'>) => void;
  updateOneTimeWithdrawal: (profileId: number, w: OneTimeWithdrawal) => void;
  removeOneTimeWithdrawal: (profileId: number, id: number) => void;

  // Goal actions
  addGoal: (profileId: number, goal: Omit<Goal, 'id'>) => void;
  updateGoal: (profileId: number, goal: Goal) => void;
  removeGoal: (profileId: number, goalId: number) => void;

  // Rebalancing actions
  addRebalancingEvent: (profileId: number, event: Omit<RebalancingEvent, 'id'>) => void;
  updateRebalancingEvent: (profileId: number, event: RebalancingEvent) => void;
  removeRebalancingEvent: (profileId: number, eventId: number) => void;

  // Settings
  updateGlobalSettings: (settings: Partial<GlobalSettings>) => void;

  // Import / export
  loadFromData: (profiles: Profile[], settings: GlobalSettings) => void;
}

// ─── Default values ───────────────────────────────────────────────────────────

const DEFAULT_PROFILE: Omit<Profile, 'id' | 'name'> = {
  investments: [],
  sips: [],
  lumpsums: [],
  swps: [],
  oneTimeWithdrawals: [],
  goals: [],
  rebalancingEvents: [],
};

const DEFAULT_SETTINGS: GlobalSettings = {
  timelineYears: 30,
  startYear: new Date().getFullYear(),
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const usePlannerStore = create<PlannerState>()(
  immer((set) => ({
    profiles: [{ id: 1, name: 'My Portfolio', ...DEFAULT_PROFILE }],
    activeProfileId: 1,
    globalSettings: DEFAULT_SETTINGS,

    // ── Profile actions ──────────────────────────────────────────────────────

    addProfile: (name) =>
      set((state) => {
        const id = Date.now();
        state.profiles.push({ id, name, ...DEFAULT_PROFILE });
        state.activeProfileId = id;
      }),

    updateProfileName: (id, name) =>
      set((state) => {
        const profile = state.profiles.find((p) => p.id === id);
        if (profile) profile.name = name;
      }),

    removeProfile: (id) =>
      set((state) => {
        state.profiles = state.profiles.filter((p) => p.id !== id);
        if (state.activeProfileId === id) {
          state.activeProfileId = state.profiles[0]?.id ?? 1;
        }
      }),

    setActiveProfile: (id) =>
      set((state) => { state.activeProfileId = id; }),

    // ── Investment actions ───────────────────────────────────────────────────

    addInvestment: (profileId, investment) =>
      set((state) => {
        const profile = state.profiles.find((p) => p.id === profileId);
        profile?.investments.push({ ...investment, id: Date.now() });
      }),

    updateInvestment: (profileId, investment) =>
      set((state) => {
        const profile = state.profiles.find((p) => p.id === profileId);
        if (!profile) return;
        const idx = profile.investments.findIndex((i) => i.id === investment.id);
        if (idx !== -1) profile.investments[idx] = investment;
      }),

    removeInvestment: (profileId, investmentId) =>
      set((state) => {
        const profile = state.profiles.find((p) => p.id === profileId);
        if (!profile) return;
        profile.investments = profile.investments.filter((i) => i.id !== investmentId);
      }),

    // ── SIP actions ─────────────────────────────────────────────────────────

    addSip: (profileId, sip) =>
      set((state) => {
        const profile = state.profiles.find((p) => p.id === profileId);
        profile?.sips.push({ ...sip, id: Date.now() });
      }),

    updateSip: (profileId, sip) =>
      set((state) => {
        const profile = state.profiles.find((p) => p.id === profileId);
        if (!profile) return;
        const idx = profile.sips.findIndex((s) => s.id === sip.id);
        if (idx !== -1) profile.sips[idx] = sip;
      }),

    removeSip: (profileId, sipId) =>
      set((state) => {
        const profile = state.profiles.find((p) => p.id === profileId);
        if (!profile) return;
        profile.sips = profile.sips.filter((s) => s.id !== sipId);
      }),

    // ── Lumpsum actions ──────────────────────────────────────────────────────

    addLumpsum: (profileId, lumpsum) =>
      set((state) => {
        const profile = state.profiles.find((p) => p.id === profileId);
        profile?.lumpsums.push({ ...lumpsum, id: Date.now() });
      }),

    updateLumpsum: (profileId, lumpsum) =>
      set((state) => {
        const profile = state.profiles.find((p) => p.id === profileId);
        if (!profile) return;
        const idx = profile.lumpsums.findIndex((l) => l.id === lumpsum.id);
        if (idx !== -1) profile.lumpsums[idx] = lumpsum;
      }),

    removeLumpsum: (profileId, lumpsumId) =>
      set((state) => {
        const profile = state.profiles.find((p) => p.id === profileId);
        if (!profile) return;
        profile.lumpsums = profile.lumpsums.filter((l) => l.id !== lumpsumId);
      }),

    // ── SWP actions ──────────────────────────────────────────────────────────

    addSwp: (profileId, swp) =>
      set((state) => {
        const profile = state.profiles.find((p) => p.id === profileId);
        profile?.swps.push({ ...swp, id: Date.now() });
      }),

    updateSwp: (profileId, swp) =>
      set((state) => {
        const profile = state.profiles.find((p) => p.id === profileId);
        if (!profile) return;
        const idx = profile.swps.findIndex((s) => s.id === swp.id);
        if (idx !== -1) profile.swps[idx] = swp;
      }),

    removeSwp: (profileId, swpId) =>
      set((state) => {
        const profile = state.profiles.find((p) => p.id === profileId);
        if (!profile) return;
        profile.swps = profile.swps.filter((s) => s.id !== swpId);
      }),

    // ── One-time withdrawal actions ──────────────────────────────────────────

    addOneTimeWithdrawal: (profileId, w) =>
      set((state) => {
        const profile = state.profiles.find((p) => p.id === profileId);
        profile?.oneTimeWithdrawals.push({ ...w, id: Date.now() });
      }),

    updateOneTimeWithdrawal: (profileId, w) =>
      set((state) => {
        const profile = state.profiles.find((p) => p.id === profileId);
        if (!profile) return;
        const idx = profile.oneTimeWithdrawals.findIndex((x) => x.id === w.id);
        if (idx !== -1) profile.oneTimeWithdrawals[idx] = w;
      }),

    removeOneTimeWithdrawal: (profileId, id) =>
      set((state) => {
        const profile = state.profiles.find((p) => p.id === profileId);
        if (!profile) return;
        profile.oneTimeWithdrawals = profile.oneTimeWithdrawals.filter((x) => x.id !== id);
      }),

    // ── Goal actions ─────────────────────────────────────────────────────────

    addGoal: (profileId, goal) =>
      set((state) => {
        const profile = state.profiles.find((p) => p.id === profileId);
        profile?.goals.push({ ...goal, id: Date.now() });
      }),

    updateGoal: (profileId, goal) =>
      set((state) => {
        const profile = state.profiles.find((p) => p.id === profileId);
        if (!profile) return;
        const idx = profile.goals.findIndex((g) => g.id === goal.id);
        if (idx !== -1) profile.goals[idx] = goal;
      }),

    removeGoal: (profileId, goalId) =>
      set((state) => {
        const profile = state.profiles.find((p) => p.id === profileId);
        if (!profile) return;
        profile.goals = profile.goals.filter((g) => g.id !== goalId);
      }),

    // ── Rebalancing actions ──────────────────────────────────────────────────

    addRebalancingEvent: (profileId, event) =>
      set((state) => {
        const profile = state.profiles.find((p) => p.id === profileId);
        profile?.rebalancingEvents.push({ ...event, id: Date.now() });
      }),

    updateRebalancingEvent: (profileId, event) =>
      set((state) => {
        const profile = state.profiles.find((p) => p.id === profileId);
        if (!profile) return;
        const idx = profile.rebalancingEvents.findIndex((e) => e.id === event.id);
        if (idx !== -1) profile.rebalancingEvents[idx] = event;
      }),

    removeRebalancingEvent: (profileId, eventId) =>
      set((state) => {
        const profile = state.profiles.find((p) => p.id === profileId);
        if (!profile) return;
        profile.rebalancingEvents = profile.rebalancingEvents.filter((e) => e.id !== eventId);
      }),

    // ── Settings ─────────────────────────────────────────────────────────────

    updateGlobalSettings: (settings) =>
      set((state) => {
        Object.assign(state.globalSettings, settings);
      }),

    // ── Import / export ───────────────────────────────────────────────────────

    loadFromData: (profiles, settings) =>
      set((state) => {
        state.profiles = profiles;
        state.globalSettings = settings;
        state.activeProfileId = profiles[0]?.id ?? 1;
      }),
  }))
);

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectActiveProfile = (state: PlannerState): Profile | null => {
  if (state.activeProfileId === 'all') return null;
  return state.profiles.find((p) => p.id === state.activeProfileId) ?? null;
};

export const selectAllProfilesMerged = (state: PlannerState): Profile => ({
  id: 0,
  name: 'All Profiles',
  investments: state.profiles.flatMap((p) => p.investments),
  sips: state.profiles.flatMap((p) => p.sips),
  lumpsums: state.profiles.flatMap((p) => p.lumpsums),
  swps: state.profiles.flatMap((p) => p.swps),
  oneTimeWithdrawals: state.profiles.flatMap((p) => p.oneTimeWithdrawals),
  goals: state.profiles.flatMap((p) => p.goals),
  rebalancingEvents: state.profiles.flatMap((p) => p.rebalancingEvents),
});
