'use client';

import { useState } from 'react';
import type { Investment } from '@financial-planner/types';
import { Edit, Trash2, PlusCircle } from 'lucide-react';
import { TransactionModal } from './TransactionModal';

export type TxType = 'sip' | 'lumpsum' | 'swp' | 'oneTimeWithdrawal';

export interface AnyTransaction {
  id: number;
  investmentId: number;
  amount: number;
  // recurring
  startDate?: string;
  durationYears?: number;
  frequency?: 'Monthly' | 'Yearly';
  stepUpPercent?: number;
  // one-time
  date?: string;
}

interface Props {
  title: string;
  type: TxType;
  transactions: AnyTransaction[];
  investments: Investment[];
  onAdd: (tx: Omit<AnyTransaction, 'id'>) => void;
  onUpdate: (tx: AnyTransaction) => void;
  onRemove: (id: number) => void;
}

function defaultTx(type: TxType): Omit<AnyTransaction, 'id'> {
  const today = new Date().toISOString().split('T')[0]!;
  if (type === 'sip' || type === 'swp') {
    return { investmentId: 0, amount: 5_000, startDate: today, durationYears: 10, frequency: 'Monthly', stepUpPercent: 5 };
  }
  return { investmentId: 0, amount: 100_000, date: today };
}

export function TransactionList({ title, type, transactions, investments, onAdd, onUpdate, onRemove }: Props) {
  const [modalTx, setModalTx] = useState<Partial<AnyTransaction> | null>(null);
  const isRecurring = type === 'sip' || type === 'swp';
  const isContribution = type === 'sip' || type === 'lumpsum';

  const handleSave = (tx: Partial<AnyTransaction>) => {
    if (tx.id) {
      onUpdate(tx as AnyTransaction);
    } else {
      onAdd(tx as Omit<AnyTransaction, 'id'>);
    }
    setModalTx(null);
  };

  return (
    <div className="space-y-4" data-testid={`transaction-list-${type}`}>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <button
          onClick={() => setModalTx(defaultTx(type))}
          className={`flex items-center gap-2 text-white font-semibold py-2 px-4 rounded-lg transition text-sm ${
            isContribution ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-rose-600 hover:bg-rose-700'
          }`}
          data-testid={`add-${type}-button`}
        >
          <PlusCircle className="w-4 h-4" /> Add
        </button>
      </div>

      {transactions.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-400">
          <p className="text-sm">No {title.toLowerCase()} yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => {
            const inv = investments.find((i) => i.id === tx.investmentId);
            return (
              <div
                key={tx.id}
                className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center"
                data-testid={`tx-item-${tx.id}`}
              >
                <div>
                  <p className="font-semibold text-gray-900">
                    ₹{tx.amount.toLocaleString('en-IN')}
                    {isRecurring && <span className="font-normal text-gray-500"> / {tx.frequency}</span>}
                    {' '}
                    {isContribution ? 'into' : 'from'}
                    {' '}
                    <span className="text-indigo-700">{inv?.name ?? 'Unknown'}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {isRecurring
                      ? `Starts ${tx.startDate} · ${tx.durationYears} years${tx.stepUpPercent ? ` · ${tx.stepUpPercent}% step-up` : ''}`
                      : tx.date}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => setModalTx(tx)}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onRemove(tx.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalTx !== null && (
        <TransactionModal
          type={type}
          transaction={modalTx}
          investments={investments}
          onSave={handleSave}
          onCancel={() => setModalTx(null)}
        />
      )}
    </div>
  );
}
