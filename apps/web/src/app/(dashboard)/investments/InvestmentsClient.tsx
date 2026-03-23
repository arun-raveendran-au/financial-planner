'use client';

import { useMemo, useState } from 'react';
import { usePlannerStore, selectActiveProfile } from '@financial-planner/store';
import { calculatePortfolioTimeline } from '@financial-planner/core';
import type { Investment } from '@financial-planner/types';
import { InvestmentCard } from '@/components/investments/InvestmentCard';
import { InvestmentModal } from '@/components/investments/InvestmentModal';
import { PlusCircle } from 'lucide-react';

const CARD_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

export function InvestmentsClient() {
  const globalSettings = usePlannerStore((s) => s.globalSettings);
  const activeProfileId = usePlannerStore((s) => s.activeProfileId);
  const activeProfile = usePlannerStore(selectActiveProfile);
  const addInvestment = usePlannerStore((s) => s.addInvestment);
  const updateInvestment = usePlannerStore((s) => s.updateInvestment);
  const removeInvestment = usePlannerStore((s) => s.removeInvestment);

  const [yearOffset, setYearOffset] = useState(globalSettings.timelineYears);
  const [modalState, setModalState] = useState<{ open: boolean; investment: Partial<Investment> | null }>({
    open: false,
    investment: null,
  });

  const timeline = useMemo(() => {
    if (!activeProfile) return null;
    return calculatePortfolioTimeline(activeProfile, globalSettings);
  }, [activeProfile, globalSettings]);

  const openAdd = () => {
    setModalState({
      open: true,
      investment: {
        name: `Investment ${(activeProfile?.investments.length ?? 0) + 1}`,
        assetClass: 'Equity',
        annualReturn: 12,
        returnType: 'basic',
        variableReturns: [],
      },
    });
  };

  const openEdit = (inv: Investment) => {
    setModalState({ open: true, investment: inv });
  };

  const handleSave = (inv: Partial<Investment>) => {
    if (!activeProfile || activeProfileId === 'all') return;
    if (inv.id) {
      updateInvestment(activeProfile.id, inv as Investment);
    } else {
      addInvestment(activeProfile.id, inv as Omit<Investment, 'id'>);
    }
    setModalState({ open: false, investment: null });
  };

  if (activeProfileId === 'all') {
    return (
      <div className="text-center py-16 text-gray-500">
        <p>Select an individual profile to manage investments.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Investments</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition"
          data-testid="add-investment-button"
        >
          <PlusCircle className="w-4 h-4" /> Add Investment
        </button>
      </div>

      {/* Year slider */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-700">View values as of year:</label>
          <span className="font-bold text-indigo-600">{globalSettings.startYear + yearOffset}</span>
        </div>
        <input
          type="range"
          min={0}
          max={globalSettings.timelineYears}
          value={yearOffset}
          onChange={(e) => setYearOffset(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        />
      </div>

      {/* Investment cards */}
      {activeProfile && activeProfile.investments.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-300">
          <p className="text-lg font-medium">No investments yet</p>
          <p className="text-sm mt-1">Click &ldquo;Add Investment&rdquo; to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {activeProfile?.investments.map((inv, i) => (
            <InvestmentCard
              key={inv.id}
              investment={inv}
              yearData={timeline?.yearlyData[yearOffset]}
              color={CARD_COLORS[i % CARD_COLORS.length] ?? '#6366f1'}
              onEdit={openEdit}
              onRemove={(id) => activeProfile && removeInvestment(activeProfile.id, id)}
            />
          ))}
        </div>
      )}

      {modalState.open && modalState.investment && (
        <InvestmentModal
          investment={modalState.investment}
          onSave={handleSave}
          onCancel={() => setModalState({ open: false, investment: null })}
        />
      )}
    </div>
  );
}
