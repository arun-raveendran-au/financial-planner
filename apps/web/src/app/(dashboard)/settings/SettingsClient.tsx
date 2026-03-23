'use client';

import { usePlannerStore } from '@/store/plannerStore';
import { Download, Upload, Trash2 } from 'lucide-react';
import { useRef } from 'react';
import type { GlobalSettings, Profile } from '@financial-planner/types';

export function SettingsClient() {
  const globalSettings = usePlannerStore((s) => s.globalSettings);
  const updateGlobalSettings = usePlannerStore((s) => s.updateGlobalSettings);
  const profiles = usePlannerStore((s) => s.profiles);
  const loadFromData = usePlannerStore((s) => s.loadFromData);
  const removeProfile = usePlannerStore((s) => s.removeProfile);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = { profiles, globalSettings };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `financial-plan-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as {
          profiles: Profile[];
          globalSettings: GlobalSettings;
        };
        if (data.profiles && data.globalSettings) {
          loadFromData(data.profiles, data.globalSettings);
        } else {
          alert('Invalid file format.');
        }
      } catch {
        alert('Could not parse file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Timeline settings */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Timeline</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Year</label>
            <input
              type="number"
              value={globalSettings.startYear}
              onChange={(e) =>
                updateGlobalSettings({ startYear: parseInt(e.target.value) || new Date().getFullYear() })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              data-testid="start-year-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Timeline Duration (Years)</label>
            <input
              type="number"
              min={1}
              max={50}
              value={globalSettings.timelineYears}
              onChange={(e) =>
                updateGlobalSettings({ timelineYears: parseInt(e.target.value) || 30 })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              data-testid="timeline-years-input"
            />
          </div>
        </div>
      </div>

      {/* Import / Export */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Data</h2>
        <p className="text-sm text-gray-500">Export your plan as JSON to back it up, or import a previously saved plan.</p>
        <div className="flex gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
            data-testid="import-button"
          >
            <Upload className="w-4 h-4" /> Import
          </button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
            data-testid="export-button"
          >
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Profiles */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Profiles</h2>
        <div className="space-y-2">
          {profiles.map((p) => (
            <div key={p.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-800">{p.name}</span>
              {profiles.length > 1 && (
                <button
                  onClick={() => removeProfile(p.id)}
                  className="text-gray-400 hover:text-red-600 transition"
                  title="Remove profile"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
