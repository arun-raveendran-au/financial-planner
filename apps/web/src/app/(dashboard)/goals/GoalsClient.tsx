'use client';

import { useState } from 'react';
import { usePlannerStore, selectActiveProfile } from '@/store/plannerStore';
import type { Goal } from '@financial-planner/types';
import { PlusCircle, Edit, Trash2, X } from 'lucide-react';

export function GoalsClient() {
  const activeProfileId = usePlannerStore((s) => s.activeProfileId);
  const profile = usePlannerStore(selectActiveProfile);
  const addGoal = usePlannerStore((s) => s.addGoal);
  const updateGoal = usePlannerStore((s) => s.updateGoal);
  const removeGoal = usePlannerStore((s) => s.removeGoal);
  const [editingGoal, setEditingGoal] = useState<Partial<Goal> | null>(null);

  if (!profile || activeProfileId === 'all') {
    return <div className="text-center py-16 text-gray-500">Select an individual profile to manage goals.</div>;
  }

  const handleSave = () => {
    if (!editingGoal) return;
    if (editingGoal.id) {
      updateGoal(profile.id, editingGoal as Goal);
    } else {
      addGoal(profile.id, editingGoal as Omit<Goal, 'id'>);
    }
    setEditingGoal(null);
  };

  const updateWithdrawal = (invId: number, amount: number) => {
    if (!editingGoal) return;
    const existing = editingGoal.withdrawals?.find((w) => w.investmentId === invId);
    const withdrawals = existing
      ? (editingGoal.withdrawals ?? []).map((w) => w.investmentId === invId ? { ...w, amount } : w)
      : [...(editingGoal.withdrawals ?? []), { investmentId: invId, amount }];
    setEditingGoal({ ...editingGoal, withdrawals });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Life Goals</h1>
        <button
          onClick={() => setEditingGoal({ name: '', year: new Date().getFullYear() + 5, withdrawals: [] })}
          className="flex items-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition"
          data-testid="add-goal-button"
        >
          <PlusCircle className="w-4 h-4" /> Add Goal
        </button>
      </div>

      {profile.goals.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-10 text-center text-gray-400">
          <p className="text-sm">No goals defined yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {profile.goals.map((goal) => (
            <div key={goal.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm" data-testid={`goal-${goal.id}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-900">{goal.name}</h3>
                  <p className="text-sm text-gray-500">Target year: {goal.year}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditingGoal(goal)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => removeGoal(profile.id, goal.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {goal.withdrawals.filter((w) => w.amount > 0).length > 0 && (
                <ul className="mt-3 space-y-1">
                  {goal.withdrawals.filter((w) => w.amount > 0).map((w) => {
                    const inv = profile.investments.find((i) => i.id === w.investmentId);
                    return (
                      <li key={w.investmentId} className="text-sm text-gray-600">
                        Withdraw <strong>₹{w.amount.toLocaleString('en-IN')}</strong> from{' '}
                        <span className="text-indigo-700">{inv?.name ?? 'Unknown'}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Goal modal */}
      {editingGoal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in-up">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold">{editingGoal.id ? 'Edit' : 'Add'} Goal</h2>
              <button onClick={() => setEditingGoal(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Goal Name</label>
                  <input
                    type="text"
                    value={editingGoal.name ?? ''}
                    onChange={(e) => setEditingGoal({ ...editingGoal, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    data-testid="goal-name-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Year</label>
                  <input
                    type="number"
                    value={editingGoal.year ?? ''}
                    onChange={(e) => setEditingGoal({ ...editingGoal, year: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    data-testid="goal-year-input"
                  />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Withdrawals</h4>
                {profile.investments.length === 0 ? (
                  <p className="text-sm text-gray-400">Add investments first.</p>
                ) : (
                  <div className="space-y-2">
                    {profile.investments.map((inv) => (
                      <div key={inv.id} className="flex justify-between items-center gap-4">
                        <label className="text-sm text-gray-700 flex-1">{inv.name}</label>
                        <input
                          type="number"
                          placeholder="Amount"
                          value={editingGoal.withdrawals?.find((w) => w.investmentId === inv.id)?.amount || ''}
                          onChange={(e) => updateWithdrawal(inv.id, parseInt(e.target.value) || 0)}
                          className="w-36 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button onClick={() => setEditingGoal(null)} className="px-4 py-2 text-gray-600">Cancel</button>
              <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700" data-testid="save-goal-button">
                Save Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
