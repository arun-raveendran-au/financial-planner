import { Metadata } from 'next';
import { DashboardClient } from './DashboardClient';

export const metadata: Metadata = { title: 'Dashboard – Financial Planner' };

export default function DashboardPage() {
  return <DashboardClient />;
}
