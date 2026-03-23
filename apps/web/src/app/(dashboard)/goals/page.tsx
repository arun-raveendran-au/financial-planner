import { Metadata } from 'next';
import { GoalsClient } from './GoalsClient';

export const metadata: Metadata = { title: 'Goals – Financial Planner' };

export default function GoalsPage() {
  return <GoalsClient />;
}
