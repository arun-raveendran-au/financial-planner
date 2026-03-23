'use client';

import { usePlannerStore, selectActiveProfile } from '@financial-planner/store';
import { TransactionList } from '@/components/transactions/TransactionList';
import type { SIP, Lumpsum } from '@financial-planner/types';

export function ContributionsClient() {
  const activeProfileId = usePlannerStore((s) => s.activeProfileId);
  const profile = usePlannerStore(selectActiveProfile);
  const addSip = usePlannerStore((s) => s.addSip);
  const updateSip = usePlannerStore((s) => s.updateSip);
  const removeSip = usePlannerStore((s) => s.removeSip);
  const addLumpsum = usePlannerStore((s) => s.addLumpsum);
  const updateLumpsum = usePlannerStore((s) => s.updateLumpsum);
  const removeLumpsum = usePlannerStore((s) => s.removeLumpsum);

  if (!profile || activeProfileId === 'all') {
    return <div className="text-center py-16 text-gray-500">Select an individual profile to manage contributions.</div>;
  }

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold text-gray-900">Contributions</h1>

      <TransactionList
        title="Recurring Contributions (SIPs)"
        type="sip"
        transactions={profile.sips}
        investments={profile.investments}
        onAdd={(tx) => addSip(profile.id, tx as Omit<SIP, 'id'>)}
        onUpdate={(tx) => updateSip(profile.id, tx as SIP)}
        onRemove={(id) => removeSip(profile.id, id)}
      />

      <TransactionList
        title="One-Time Contributions (Lumpsums)"
        type="lumpsum"
        transactions={profile.lumpsums}
        investments={profile.investments}
        onAdd={(tx) => addLumpsum(profile.id, tx as Omit<Lumpsum, 'id'>)}
        onUpdate={(tx) => updateLumpsum(profile.id, tx as Lumpsum)}
        onRemove={(id) => removeLumpsum(profile.id, id)}
      />
    </div>
  );
}
