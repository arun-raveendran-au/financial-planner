'use client';

import { usePlannerStore, selectActiveProfile } from '@financial-planner/store';
import { TransactionList } from '@/components/transactions/TransactionList';
import type { SWP, OneTimeWithdrawal } from '@financial-planner/types';

export function WithdrawalsClient() {
  const activeProfileId = usePlannerStore((s) => s.activeProfileId);
  const profile = usePlannerStore(selectActiveProfile);
  const addSwp = usePlannerStore((s) => s.addSwp);
  const updateSwp = usePlannerStore((s) => s.updateSwp);
  const removeSwp = usePlannerStore((s) => s.removeSwp);
  const addOneTimeWithdrawal = usePlannerStore((s) => s.addOneTimeWithdrawal);
  const updateOneTimeWithdrawal = usePlannerStore((s) => s.updateOneTimeWithdrawal);
  const removeOneTimeWithdrawal = usePlannerStore((s) => s.removeOneTimeWithdrawal);

  if (!profile || activeProfileId === 'all') {
    return <div className="text-center py-16 text-gray-500">Select an individual profile to manage withdrawals.</div>;
  }

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold text-gray-900">Withdrawals</h1>

      <TransactionList
        title="Recurring Withdrawals (SWPs)"
        type="swp"
        transactions={profile.swps}
        investments={profile.investments}
        onAdd={(tx) => addSwp(profile.id, tx as Omit<SWP, 'id'>)}
        onUpdate={(tx) => updateSwp(profile.id, tx as SWP)}
        onRemove={(id) => removeSwp(profile.id, id)}
      />

      <TransactionList
        title="One-Time Withdrawals"
        type="oneTimeWithdrawal"
        transactions={profile.oneTimeWithdrawals}
        investments={profile.investments}
        onAdd={(tx) => addOneTimeWithdrawal(profile.id, tx as Omit<OneTimeWithdrawal, 'id'>)}
        onUpdate={(tx) => updateOneTimeWithdrawal(profile.id, tx as OneTimeWithdrawal)}
        onRemove={(id) => removeOneTimeWithdrawal(profile.id, id)}
      />
    </div>
  );
}
