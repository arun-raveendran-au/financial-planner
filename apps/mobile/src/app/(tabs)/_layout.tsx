/**
 * Tab navigator layout.
 * Scaffold — screens are populated in subsequent steps.
 * The sign-out option lives in the Settings tab header.
 */
import { Tabs } from 'expo-router';

export default function TabsLayout() {
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
      <Tabs.Screen name="goals"       options={{ title: 'Goals' }} />
      <Tabs.Screen name="settings"    options={{ title: 'Settings' }} />
    </Tabs>
  );
}
