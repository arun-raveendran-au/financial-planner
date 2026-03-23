import { Metadata } from 'next';
import { ContributionsClient } from './ContributionsClient';

export const metadata: Metadata = { title: 'Contributions – Financial Planner' };

export default function ContributionsPage() {
  return <ContributionsClient />;
}
