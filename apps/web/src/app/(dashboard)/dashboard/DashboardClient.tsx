'use client';

import { useMemo, useState } from 'react';
import { usePlannerStore, selectActiveProfile, selectAllProfilesMerged } from '@/store/plannerStore';
import { calculatePortfolioTimeline } from '@financial-planner/core';
import { YearlyDataTable } from '@/components/ui/YearlyDataTable';
import { DiversificationChart } from '@/components/charts/DiversificationChart';
import { ProfileTabs } from '@/components/ui/ProfileTabs';
import { ArrowUpRight, AlertTriangle } from 'lucide-react';

export function DashboardClient() {
  const globalSettings = usePlannerStore((s) => s.globalSettings);
  const activeProfileId = usePlannerStore((s) => s.activeProfileId);
  const activeProfile = usePlannerStore((s) =>
    s.activeProfileId === 'all' ? selectAllProfilesMerged(s) : selectActiveProfile(s)
  );

  const [yearOffset, setYearOffset] = useState(globalSettings.timelineYears);

  const timeline = useMemo(() => {
    if (!activeProfile) return null;
    return calculatePortfolioTimeline(activeProfile, globalSettings);
  }, [activeProfile, globalSettings]);

  const projectedValue = timeline?.yearlyData[yearOffset]?.closing ?? 0;
  const projectedYear = globalSettings.startYear + yearOffset;

  return (
    <div className="space-y-6" data-testid="dashboard">
      <ProfileTabs />

      {/* Errors */}
      {timeline && timeline.errors.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-700 text-sm">Planning Alert</p>
            <ul className="list-disc list-inside text-sm text-red-600 mt-1">
              {timeline.errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        </div>
      )}

      {/* Year slider */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-700">View projections as of year:</label>
          <span className="font-bold text-indigo-600">{projectedYear}</span>
        </div>
        <input
          type="range"
          min={0}
          max={globalSettings.timelineYears}
          value={yearOffset}
          onChange={(e) => setYearOffset(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          data-testid="year-slider"
        />
      </div>

      {/* Projection card + Diversification */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3">
          <div className="bg-indigo-800 text-white p-8 rounded-2xl shadow-xl h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ArrowUpRight className="w-6 h-6" />
                <h2 className="text-xl font-bold">
                  {activeProfile?.name ?? 'Portfolio'} Projection
                </h2>
              </div>
              <p className="text-indigo-300 text-sm">Value at {projectedYear}</p>
            </div>
            <div>
              <p className="text-indigo-200 text-lg mt-6">Total Portfolio Value</p>
              <p className="text-5xl font-extrabold tracking-tight mt-1" data-testid="portfolio-value">
                ₹{Math.round(projectedValue).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        <div className="xl:col-span-2">
          {timeline && activeProfile && (
            <DiversificationChart
              investments={activeProfile.investments}
              yearlyData={timeline.yearlyData}
              yearOffset={yearOffset}
              startYear={globalSettings.startYear}
            />
          )}
        </div>
      </div>

      {/* Yearly table */}
      {timeline && (
        <YearlyDataTable
          data={timeline.yearlyData}
          title={`${activeProfile?.name ?? 'Portfolio'} — Yearly Summary`}
        />
      )}
    </div>
  );
}
