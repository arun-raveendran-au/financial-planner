/**
 * useDataSync (mobile) — loads portfolio data from Supabase on mount, saves
 * any subsequent store changes back (debounced 1.5 s), and resets the store
 * when the user signs out so that the next user starts with a clean slate.
 *
 * Unlike the web version, the mobile app keeps the JS bundle alive across
 * sessions, so we must clear in-memory state on SIGNED_OUT explicitly.
 */
import { useEffect } from 'react';
import { usePlannerStore } from '@financial-planner/store';
import { supabase } from '../lib/supabase';
import type { AppData } from '@financial-planner/types';

const SAVE_DEBOUNCE_MS = 1500;

const DEFAULT_PROFILE = {
  investments: [],
  sips: [],
  lumpsums: [],
  swps: [],
  oneTimeWithdrawals: [],
  goals: [],
  rebalancingEvents: [],
};

export function useDataSync() {
  useEffect(() => {
    let saveTimer: ReturnType<typeof setTimeout>;
    let unsubscribeStore: (() => void) | undefined;

    async function save() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { profiles, globalSettings } = usePlannerStore.getState();
      await supabase.from('app_data').upsert({
        id: user.id,
        data: { profiles, globalSettings } as AppData,
        updated_at: new Date().toISOString(),
      });
    }

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('app_data')
        .select('data')
        .eq('id', user.id)
        .maybeSingle();

      if (!error && data?.data) {
        const appData = data.data as AppData;
        if (appData.profiles?.length && appData.globalSettings) {
          usePlannerStore.getState().loadFromData(appData.profiles, appData.globalSettings);
        }
      }

      // Subscribe to store changes only AFTER the initial load so that
      // loadFromData() above does not trigger an immediate redundant save.
      unsubscribeStore = usePlannerStore.subscribe((state, prev) => {
        if (
          state.profiles === prev.profiles &&
          state.globalSettings === prev.globalSettings
        ) return;

        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => { save().catch(console.error); }, SAVE_DEBOUNCE_MS);
      });
    }

    // Clear store when the user signs out so the next user always starts fresh.
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_OUT') {
          unsubscribeStore?.();
          unsubscribeStore = undefined;
          clearTimeout(saveTimer);
          usePlannerStore.getState().loadFromData(
            [{ id: Date.now(), name: 'My Portfolio', ...DEFAULT_PROFILE }],
            { timelineYears: 30, startYear: new Date().getFullYear() },
          );
        }

        if (event === 'SIGNED_IN') {
          load().catch(console.error);
        }
      },
    );

    // Also do an initial load for the already-authenticated session on mount.
    load().catch(console.error);

    return () => {
      authSubscription.unsubscribe();
      unsubscribeStore?.();
      clearTimeout(saveTimer);
    };
  }, []);
}
