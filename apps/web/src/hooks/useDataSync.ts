'use client';
/**
 * useDataSync (web)
 *
 * 1. Load  — on mount, fetch the user's app_data row from Supabase and
 *            populate the store via loadFromData().
 *
 * 2. Save  — after load, subscribe to store changes and debounce-save them
 *            back to Supabase (1.5 s). The subscription is registered AFTER
 *            the initial load so that loadFromData() itself never triggers a
 *            redundant write.
 *
 * 3. Sync  — subscribe to Supabase Realtime postgres_changes on the user's
 *            app_data row. When a change arrives:
 *            - Ignore it if it arrived within 3 s of our last save (echo of
 *              our own write bouncing back through the DB).
 *            - Ignore it if we have unsaved local edits in flight (our
 *              pending save will win; we don't want to clobber it).
 *            - Otherwise apply it — the data came from another device.
 *
 * Requires the app_data table to be added to the supabase_realtime
 * publication (see README / DEVNOTES for the one-line SQL migration).
 */
import { useEffect } from 'react';
import { usePlannerStore } from '@financial-planner/store';
import { createClient } from '@/lib/supabase/client';
import type { AppData } from '@financial-planner/types';

const SAVE_DEBOUNCE_MS  = 1500;
const ECHO_WINDOW_MS    = 3000; // ignore Realtime events arriving this soon after our own save

export function useDataSync() {
  useEffect(() => {
    const supabase = createClient();
    let saveTimer: ReturnType<typeof setTimeout>;
    let unsubscribeStore: (() => void) | undefined;
    let lastSaveTime  = 0;
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

    // ── Init (load → store subscription → realtime subscription) ─────────────

    async function init() {
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

      // 2. Start saving on store changes (after load, so it doesn't fire immediately)
      unsubscribeStore = usePlannerStore.subscribe((state, prev) => {
        if (
          state.profiles     === prev.profiles &&
          state.globalSettings === prev.globalSettings
        ) return;

        hasPendingSave = true;
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => { save().catch(console.error); }, SAVE_DEBOUNCE_MS);
      });

      // 3. Subscribe to Realtime — pick up edits from other devices
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
            // Echo of our own recent save — ignore
            if (Date.now() - lastSaveTime < ECHO_WINDOW_MS) return;
            // Local unsaved edits are in flight — our save will win
            if (hasPendingSave) return;

            const incoming = (payload.new as { data?: AppData })?.data;
            if (incoming?.profiles?.length && incoming?.globalSettings) {
              usePlannerStore.getState().loadFromData(incoming.profiles, incoming.globalSettings);
            }
          },
        )
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }

    let cleanupRealtime: (() => void) | undefined;
    init().then((cleanup) => { cleanupRealtime = cleanup; }).catch(console.error);

    return () => {
      unsubscribeStore?.();
      cleanupRealtime?.();
      clearTimeout(saveTimer);
    };
  }, []);
}
