'use client';

import { useState } from 'react';
import type { Investment } from '@financial-planner/types';
import { X } from 'lucide-react';
import type { TxType, AnyTransaction } from './TransactionList';

interface Props {
  type: TxType;
  transaction: Partial<AnyTransaction>;
  investments: Investment[];
  onSave: (tx: Partial<AnyTransaction>) => void;
  onCancel: () => void;
}

export function TransactionModal({ type, transaction, investments, onSave, onCancel }: Props) {
  const [form, setForm] = useState<Partial<AnyTransaction>>(transaction);
  const isRecurring = type === 'sip' || type === 'swp';
  const isContribution = type === 'sip' || type === 'lumpsum';

  const titles: Record<TxType, string> = {
    sip: 'Recurring Contribution (SIP)',
    lumpsum: 'One-Time Contribution',
    swp: 'Recurring Withdrawal (SWP)',
    oneTimeWithdrawal: 'One-Time Withdrawal',
  };

  const update = (field: keyof AnyTransaction, value: unknown) =>
    setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" data-testid="transaction-modal">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in-up">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">{form.id ? 'Edit' : 'Add'} {titles[type]}</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Investment</label>
            <select
              value={form.investmentId ?? ''}
              onChange={(e) => update('investmentId', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              data-testid="tx-investment-select"
            >
              <option value="">Select investment</option>
              {investments.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
            <input
              type="number"
              value={form.amount ?? ''}
              onChange={(e) => update('amount', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              data-testid="tx-amount-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isRecurring ? 'Start Date' : 'Date'}
            </label>
            <input
              type="date"
              value={isRecurring ? (form.startDate ?? '') : (form.date ?? '')}
              onChange={(e) => update(isRecurring ? 'startDate' : 'date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              data-testid="tx-date-input"
            />
          </div>

          {isRecurring && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Years)</label>
                  <input
                    type="number"
                    value={form.durationYears ?? ''}
                    onChange={(e) => update('durationYears', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                  <select
                    value={form.frequency ?? 'Monthly'}
                    onChange={(e) => update('frequency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Annual Step-up (%)</label>
                <input
                  type="number"
                  value={form.stepUpPercent ?? 0}
                  onChange={(e) => update('stepUpPercent', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button onClick={onCancel} className="px-4 py-2 text-gray-600 hover:text-gray-900 transition">
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            className={`px-6 py-2 text-white font-semibold rounded-lg transition ${
              isContribution ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-rose-600 hover:bg-rose-700'
            }`}
            data-testid="save-tx-button"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
