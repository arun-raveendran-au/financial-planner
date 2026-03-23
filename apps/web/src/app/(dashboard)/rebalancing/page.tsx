import { Metadata } from 'next';
import { RebalancingClient } from './RebalancingClient';

export const metadata: Metadata = { title: 'Rebalancing – Financial Planner' };

export default function RebalancingPage() {
  return <RebalancingClient />;
}
