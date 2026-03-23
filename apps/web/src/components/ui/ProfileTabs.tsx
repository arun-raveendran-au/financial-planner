'use client';

import { usePlannerStore } from '@/store/plannerStore';
import { User, Users, PlusCircle, Edit, Check, X } from 'lucide-react';
import { useState } from 'react';

export function ProfileTabs() {
  const profiles = usePlannerStore((s) => s.profiles);
  const activeProfileId = usePlannerStore((s) => s.activeProfileId);
  const setActiveProfile = usePlannerStore((s) => s.setActiveProfile);
  const addProfile = usePlannerStore((s) => s.addProfile);
  const updateProfileName = usePlannerStore((s) => s.updateProfileName);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

  const startEdit = (id: number, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const saveEdit = () => {
    if (editingId && editingName.trim()) {
      updateProfileName(editingId, editingName.trim());
    }
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden" data-testid="profile-tabs">
      <div className="flex items-center overflow-x-auto border-b border-gray-200 px-2">
        {profiles.map((p) => (
          <div
            key={p.id}
            onClick={() => setActiveProfile(p.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium cursor-pointer whitespace-nowrap transition-colors border-b-2 ${
              activeProfileId === p.id
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
            data-testid={`profile-tab-${p.id}`}
          >
            <User className="w-4 h-4 flex-shrink-0" />

            {editingId === p.id ? (
              <span className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <input
                  autoFocus
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                  className="border border-indigo-300 rounded px-1.5 py-0.5 text-sm w-32 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button onClick={saveEdit} className="text-green-600 hover:text-green-700"><Check className="w-3.5 h-3.5" /></button>
                <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
              </span>
            ) : (
              <>
                {p.name}
                <button
                  onClick={(e) => { e.stopPropagation(); startEdit(p.id, p.name); }}
                  className="text-gray-300 hover:text-gray-500 ml-1"
                >
                  <Edit className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
        ))}

        <div
          onClick={() => setActiveProfile('all')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium cursor-pointer whitespace-nowrap transition-colors border-b-2 ${
            activeProfileId === 'all'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
          data-testid="profile-tab-all"
        >
          <Users className="w-4 h-4" />
          All Profiles
        </div>

        <button
          onClick={() => addProfile(`Profile ${profiles.length + 1}`)}
          className="ml-2 p-2 text-indigo-500 hover:text-indigo-700 transition flex-shrink-0"
          data-testid="add-profile-button"
          title="Add profile"
        >
          <PlusCircle className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
