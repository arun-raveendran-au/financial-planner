'use client';
/**
 * DataSync — a zero-render client component that activates the data sync hook.
 * Mounted inside the server-rendered DashboardLayout so that every dashboard
 * page automatically stays in sync with Supabase without any page-level wiring.
 */
import { useDataSync } from '@/hooks/useDataSync';

export function DataSync() {
  useDataSync();
  return null;
}
