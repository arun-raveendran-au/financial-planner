import type { Investment, YearData } from '@financial-planner/types';
import { Edit3, Trash2 } from 'lucide-react';

interface Props {
  investment: Investment;
  yearData: YearData | undefined;
  color: string;
  onEdit: (inv: Investment) => void;
  onRemove: (id: number) => void;
}

export function InvestmentCard({ investment, yearData, color, onEdit, onRemove }: Props) {
  const data = yearData?.investments[investment.id] ?? { closing: 0, growth: 0, invested: 0, withdrawn: 0 };
  const netChange = data.growth + data.invested - data.withdrawn;

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200" data-testid={`investment-card-${investment.id}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
          <div>
            <h3 className="font-bold text-gray-900 truncate" title={investment.name}>{investment.name}</h3>
            <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {investment.assetClass || 'Unclassified'}
            </span>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(investment)}
            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition"
            data-testid={`edit-investment-${investment.id}`}
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onRemove(investment.id)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition"
            data-testid={`remove-investment-${investment.id}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Value */}
      <p className="text-sm text-gray-500 mb-0.5">Portfolio value</p>
      <p className="text-2xl font-bold text-gray-900">
        ₹{Math.round(data.closing).toLocaleString('en-IN')}
      </p>

      {/* Breakdown */}
      <div className="mt-3 pt-3 border-t border-gray-100 space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-500">Contributions</span>
          <span className="font-semibold text-blue-600">+₹{Math.round(data.invested).toLocaleString('en-IN')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Withdrawals</span>
          <span className="font-semibold text-red-600">-₹{Math.round(data.withdrawn).toLocaleString('en-IN')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Growth</span>
          <span className="font-semibold text-green-600">+₹{Math.round(data.growth).toLocaleString('en-IN')}</span>
        </div>
        <div className="flex justify-between font-bold border-t border-gray-100 pt-1">
          <span>Net change</span>
          <span className={netChange >= 0 ? 'text-green-700' : 'text-red-700'}>
            {netChange >= 0 ? '+' : ''}₹{Math.round(netChange).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Return rate badge */}
      <div className="mt-3">
        <span className="text-xs bg-indigo-50 text-indigo-700 font-medium px-2 py-1 rounded-full">
          {investment.returnType === 'advanced'
            ? 'Variable return'
            : `${investment.annualReturn}% p.a.`}
        </span>
      </div>
    </div>
  );
}
