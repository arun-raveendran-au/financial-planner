import { Metadata } from 'next';
import { InvestmentsClient } from './InvestmentsClient';

export const metadata: Metadata = { title: 'Investments – Financial Planner' };

export default function InvestmentsPage() {
  return <InvestmentsClient />;
}
