'use client';
/**
 * useDataSync — loads portfolio data from Supabase on mount, then saves any
 * subsequent store changes back (debounced 1.5 s).
 *
 * The subscribe call is set up AFTER the initial load so that calling
 * loadFromData() does not immediately trigger a redundant save.
 */
import { useEffect } from 'react';
import { usePlannerStore } from '@financial-planner/store';
import { createClient } from '@/lib/supabase/client';
import type { AppData } from '@financial-planner/types';

const SAVE_DEBOUNCE_MS = 1500;

export function useDataSync() {
  useEffect(() => {
    const supabase = createClient();
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

      // Subscribe to store changes only AFTER the initial load has completed.
      // This ensures loadFromData() above does not trigger a redundant save.
      unsubscribeStore = usePlannerStore.subscribe((state, prev) => {
        if (
          state.profiles === prev.profiles &&
          state.globalSettings === prev.globalSettings
        ) return;

        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => { save().catch(console.error); }, SAVE_DEBOUNCE_MS);
      });
    }

    load().catch(console.error);

    return () => {
      unsubscribeStore?.();
      clearTimeout(saveTimer);
    };
  }, []);
}
