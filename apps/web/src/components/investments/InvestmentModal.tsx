'use client';

import { useState } from 'react';
import type { Investment, ReturnType, VariableReturnPeriod } from '@financial-planner/types';
import { X, PlusCircle, Trash2 } from 'lucide-react';

interface Props {
  investment: Partial<Investment>;
  onSave: (investment: Partial<Investment>) => void;
  onCancel: () => void;
}

export function InvestmentModal({ investment, onSave, onCancel }: Props) {
  const [form, setForm] = useState<Partial<Investment>>(investment);
  const [returnTab, setReturnTab] = useState<ReturnType>(investment.returnType ?? 'basic');

  const update = (field: keyof Investment, value: unknown) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSave = () => onSave({ ...form, returnType: returnTab });

  const updateVariableRate = (index: number, field: keyof VariableReturnPeriod, value: number) => {
    const updated = [...(form.variableReturns ?? [])];
    updated[index] = { ...updated[index]!, [field]: value };
    update('variableReturns', updated);
  };

  const addPeriod = () =>
    update('variableReturns', [...(form.variableReturns ?? []), { from: 1, to: 5, rate: 12 }]);

  const removePeriod = (index: number) =>
    update('variableReturns', (form.variableReturns ?? []).filter((_, i) => i !== index));

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" data-testid="investment-modal">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-fade-in-up">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">
            {form.id ? 'Edit Investment' : 'Add Investment'}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={form.name ?? ''}
                onChange={(e) => update('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                data-testid="investment-name-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asset Class</label>
              <input
                type="text"
                value={form.assetClass ?? ''}
                onChange={(e) => update('assetClass', e.target.value)}
                list="asset-classes"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <datalist id="asset-classes">
                <option value="Equity" />
                <option value="Debt" />
                <option value="Gold" />
                <option value="Real Estate" />
                <option value="Cash" />
              </datalist>
            </div>
          </div>

          {/* Return rate section */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <p className="text-sm font-semibold text-gray-700">Return Rate</p>
              <div className="flex gap-1 mt-2">
                {(['basic', 'advanced'] as ReturnType[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setReturnTab(tab)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                      returnTab === tab
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-600'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4">
              {returnTab === 'basic' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Annual Return (%)
                  </label>
                  <input
                    type="number"
                    value={form.annualReturn ?? 12}
                    onChange={(e) => update('annualReturn', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    data-testid="annual-return-input"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500">Define return rates for different year ranges.</p>
                  {(form.variableReturns ?? []).map((p, i) => (
                    <div key={i} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                      <span className="text-xs text-gray-500">From</span>
                      <input
                        type="number"
                        value={p.from}
                        onChange={(e) => updateVariableRate(i, 'from', parseInt(e.target.value))}
                        className="w-14 px-2 py-1 border rounded text-sm"
                      />
                      <span className="text-xs text-gray-500">to</span>
                      <input
                        type="number"
                        value={p.to}
                        onChange={(e) => updateVariableRate(i, 'to', parseInt(e.target.value))}
                        className="w-14 px-2 py-1 border rounded text-sm"
                      />
                      <span className="text-xs text-gray-500">at</span>
                      <input
                        type="number"
                        value={p.rate}
                        onChange={(e) => updateVariableRate(i, 'rate', parseFloat(e.target.value))}
                        className="w-16 px-2 py-1 border rounded text-sm"
                      />
                      <span className="text-xs text-gray-500">%</span>
                      <button onClick={() => removePeriod(i)} className="ml-auto text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addPeriod}
                    className="text-indigo-600 text-sm font-semibold flex items-center gap-1 hover:text-indigo-800"
                  >
                    <PlusCircle className="w-4 h-4" /> Add Period
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 flex-shrink-0">
          <button onClick={onCancel} className="px-4 py-2 text-gray-600 hover:text-gray-900 transition">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
            data-testid="save-investment-button"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
