/**
 * Supabase client for React Native.
 * Uses expo-secure-store as the token storage adapter so session tokens
 * are encrypted at rest on the device (iOS Keychain / Android Keystore).
 *
 * Env vars use the EXPO_PUBLIC_ prefix (Expo's equivalent of NEXT_PUBLIC_).
 */
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(
  process.env['EXPO_PUBLIC_SUPABASE_URL']!,
  process.env['EXPO_PUBLIC_SUPABASE_ANON_KEY']!,
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // not a web browser — no URL-based OAuth callbacks
    },
  }
);
