import { Metadata } from 'next';
import { SettingsClient } from './SettingsClient';

export const metadata: Metadata = { title: 'Settings – Financial Planner' };

export default function SettingsPage() {
  return <SettingsClient />;
}
