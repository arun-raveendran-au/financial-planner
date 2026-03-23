'use client';

import { useState } from 'react';
import { usePlannerStore, selectActiveProfile } from '@financial-planner/store';
import type { RebalancingEvent } from '@financial-planner/types';
import { PlusCircle, Edit, Trash2, X, ArrowRight } from 'lucide-react';

export function RebalancingClient() {
  const activeProfileId = usePlannerStore((s) => s.activeProfileId);
  const profile = usePlannerStore(selectActiveProfile);
  const addRebalancingEvent = usePlannerStore((s) => s.addRebalancingEvent);
  const updateRebalancingEvent = usePlannerStore((s) => s.updateRebalancingEvent);
  const removeRebalancingEvent = usePlannerStore((s) => s.removeRebalancingEvent);
  const [editing, setEditing] = useState<Partial<RebalancingEvent> | null>(null);

  if (!profile || activeProfileId === 'all') {
    return <div className="text-center py-16 text-gray-500">Select an individual profile to manage rebalancing.</div>;
  }

  const handleSave = () => {
    if (!editing) return;
    if (editing.id) {
      updateRebalancingEvent(profile.id, editing as RebalancingEvent);
    } else {
      addRebalancingEvent(profile.id, editing as Omit<RebalancingEvent, 'id'>);
    }
    setEditing(null);
  };

  const defaultEvent = (): Partial<RebalancingEvent> => ({
    date: new Date().toISOString().split('T')[0],
    amount: 10_000,
    fromInvestmentId: undefined,
    toInvestmentId: undefined,
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Rebalancing</h1>
        <button
          onClick={() => setEditing(defaultEvent())}
          className="flex items-center gap-2 bg-cyan-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-cyan-700 transition"
          data-testid="add-rebalancing-button"
        >
          <PlusCircle className="w-4 h-4" /> Add Event
        </button>
      </div>

      {profile.rebalancingEvents.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-10 text-center text-gray-400">
          <p className="text-sm">No rebalancing events yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {profile.rebalancingEvents.map((r) => {
            const from = profile.investments.find((i) => i.id === r.fromInvestmentId);
            const to = profile.investments.find((i) => i.id === r.toInvestmentId);
            return (
              <div key={r.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center" data-testid={`rebalancing-${r.id}`}>
                <div>
                  <p className="font-semibold text-gray-900">
                    ₹{r.amount.toLocaleString('en-IN')} on {r.date}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                    <span className="text-rose-600">{from?.name ?? 'Unknown'}</span>
                    <ArrowRight className="w-3 h-3" />
                    <span className="text-green-600">{to?.name ?? 'Unknown'}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditing(r)} className="p-1.5 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-full transition"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => removeRebalancingEvent(profile.id, r.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in-up">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold">{editing.id ? 'Edit' : 'New'} Rebalancing Event</h2>
              <button onClick={() => setEditing(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" value={editing.date ?? ''} onChange={(e) => setEditing({ ...editing, date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                  <input type="number" value={editing.amount ?? ''} onChange={(e) => setEditing({ ...editing, amount: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 outline-none" data-testid="rebalancing-amount-input" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                <select value={editing.fromInvestmentId ?? ''} onChange={(e) => setEditing({ ...editing, fromInvestmentId: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 outline-none">
                  <option value="">Select investment</option>
                  {profile.investments.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <select value={editing.toInvestmentId ?? ''} onChange={(e) => setEditing({ ...editing, toInvestmentId: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 outline-none">
                  <option value="">Select investment</option>
                  {profile.investments.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-gray-600">Cancel</button>
              <button onClick={handleSave} className="px-6 py-2 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700" data-testid="save-rebalancing-button">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
