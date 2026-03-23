import { Metadata } from 'next';
import { WithdrawalsClient } from './WithdrawalsClient';

export const metadata: Metadata = { title: 'Withdrawals – Financial Planner' };

export default function WithdrawalsPage() {
  return <WithdrawalsClient />;
}
