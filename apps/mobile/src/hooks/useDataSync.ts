/**
 * useDataSync (mobile)
 *
 * Same three responsibilities as the web version:
 *   1. Load  — fetch app_data on mount and populate the store.
 *   2. Save  — debounce-save store changes back to Supabase (1.5 s).
 *   3. Sync  — Supabase Realtime subscription so edits from other devices
 *              (e.g. the web dashboard) appear live in the mobile app.
 *
 * Mobile-only extras:
 *   - SIGNED_OUT event resets the store to defaults so that a second user
 *     logging in on the same device never sees the previous user's data.
 *   - SIGNED_IN event re-runs the load (handles switching accounts without
 *     killing the app).
 *
 * Requires the app_data table to be added to the supabase_realtime
 * publication (see README / DEVNOTES for the one-line SQL migration).
 */
import { useEffect } from 'react';
import { usePlannerStore } from '@financial-planner/store';
import { supabase } from '../lib/supabase';
import type { AppData } from '@financial-planner/types';

const SAVE_DEBOUNCE_MS = 1500;
const ECHO_WINDOW_MS   = 3000;

const EMPTY_PROFILE = {
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
    let cleanupRealtime: (() => void) | undefined;
    let lastSaveTime   = 0;
    let hasPendingSave = false;

    // ── Save ──────────────────────────────────────────────────────────────────

    async function save() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { profiles, globalSettings } = usePlannerStore.getState();
      lastSaveTime   = Date.now();
      hasPendingSave = false;
      await supabase.from('app_data').upsert({
        id: user.id,
        data: { profiles, globalSettings } as AppData,
        updated_at: new Date().toISOString(),
      });
    }

    // ── Teardown helpers ──────────────────────────────────────────────────────

    function stopStoreListener() {
      unsubscribeStore?.();
      unsubscribeStore = undefined;
      clearTimeout(saveTimer);
      hasPendingSave = false;
    }

    // ── Load + subscribe ──────────────────────────────────────────────────────

    async function startSync() {
      stopStoreListener(); // clear any previous listener before re-subscribing
      cleanupRealtime?.();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Load existing data
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

      // 2. Save on store changes (registered after load so it doesn't fire immediately)
      unsubscribeStore = usePlannerStore.subscribe((state, prev) => {
        if (
          state.profiles       === prev.profiles &&
          state.globalSettings === prev.globalSettings
        ) return;

        hasPendingSave = true;
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => { save().catch(console.error); }, SAVE_DEBOUNCE_MS);
      });

      // 3. Realtime — pick up edits from other devices
      const channel = supabase
        .channel(`app_data:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'app_data',
            filter: `id=eq.${user.id}`,
          },
          (payload) => {
            if (Date.now() - lastSaveTime < ECHO_WINDOW_MS) return; // echo of our own save
            if (hasPendingSave) return;                              // local edits in flight

            const incoming = (payload.new as { data?: AppData })?.data;
            if (incoming?.profiles?.length && incoming?.globalSettings) {
              usePlannerStore.getState().loadFromData(incoming.profiles, incoming.globalSettings);
            }
          },
        )
        .subscribe();

      cleanupRealtime = () => { supabase.removeChannel(channel); };
    }

    // ── Auth state changes ────────────────────────────────────────────────────

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_OUT') {
          stopStoreListener();
          cleanupRealtime?.();
          cleanupRealtime = undefined;
          lastSaveTime = 0;
          // Reset store so the next user starts with a clean slate
          usePlannerStore.getState().loadFromData(
            [{ id: Date.now(), name: 'My Portfolio', ...EMPTY_PROFILE }],
            { timelineYears: 30, startYear: new Date().getFullYear() },
          );
        }

        if (event === 'SIGNED_IN') {
          startSync().catch(console.error);
        }
      },
    );

    // Initial load for the already-authenticated session on mount
    startSync().catch(console.error);

    return () => {
      authSubscription.unsubscribe();
      stopStoreListener();
      cleanupRealtime?.();
    };
  }, []);
}
