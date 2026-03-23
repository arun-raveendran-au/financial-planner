/**
 * Tab navigator layout.
 * Mounts the data sync hook so portfolio data is loaded from Supabase when the
 * user first enters the app and saved back automatically on every change.
 */
import { Tabs } from 'expo-router';
import { useDataSync } from '../../hooks/useDataSync';

export default function TabsLayout() {
  useDataSync();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4f46e5',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: { borderTopColor: '#e5e7eb' },
      }}
    >
      <Tabs.Screen name="index"       options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="investments" options={{ title: 'Investments' }} />
      <Tabs.Screen name="contribute"  options={{ title: 'Contribute' }} />
      <Tabs.Screen name="withdraw"    options={{ title: 'Withdraw' }} />
      <Tabs.Screen name="goals"        options={{ title: 'Goals' }} />
      <Tabs.Screen name="rebalancing" options={{ title: 'Rebalance' }} />
      <Tabs.Screen name="settings"    options={{ title: 'Settings' }} />
    </Tabs>
  );
}
