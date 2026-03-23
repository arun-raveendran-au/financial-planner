'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { getAllocationByAssetClass } from '@financial-planner/core';
import type { Investment, YearData } from '@financial-planner/types';
import { PieChart as PieChartIcon } from 'lucide-react';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#84cc16'];

interface Props {
  investments: Investment[];
  yearlyData: YearData[];
  yearOffset: number;
  startYear: number;
}

export function DiversificationChart({ investments, yearlyData, yearOffset, startYear }: Props) {
  const allocation = useMemo(() => {
    const yearData = yearlyData[yearOffset];
    if (!yearData) return [];
    return getAllocationByAssetClass(investments, yearData);
  }, [investments, yearlyData, yearOffset]);

  const displayYear = startYear + yearOffset;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-full" data-testid="diversification-chart">
      <h3 className="text-lg font-bold text-gray-800 mb-1">Diversification</h3>
      <p className="text-sm text-gray-500 mb-4">Asset allocation in {displayYear}</p>

      {allocation.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 items-center">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allocation}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, percentage }: { name: string; percentage: number }) =>
                    `${name} (${percentage.toFixed(0)}%)`
                  }
                  labelLine={false}
                >
                  {allocation.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, _: string, props: { payload?: { name: string; percentage: number } }) => [
                    `₹${Math.round(value).toLocaleString('en-IN')}`,
                    `${props.payload?.name ?? ''} (${props.payload?.percentage?.toFixed(1) ?? 0}%)`,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2">
            {allocation.sort((a, b) => b.value - a.value).map((entry, index) => (
              <div key={entry.name} className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  {entry.name}
                </span>
                <span className="font-semibold text-gray-800">
                  ₹{Math.round(entry.value).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
          <PieChartIcon className="w-12 h-12 mb-2" />
          <p className="text-sm">No data for this year</p>
        </div>
      )}
    </div>
  );
}
