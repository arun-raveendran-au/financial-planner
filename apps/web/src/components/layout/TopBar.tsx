'use client';

import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { LogOut } from 'lucide-react';

interface TopBarProps {
  user: User;
}

export function TopBar({ user }: TopBarProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
      <h1 className="text-xl font-bold text-gray-900">Financial Planner</h1>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500 hidden sm:block">{user.email}</span>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition"
          data-testid="signout-button"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:block">Sign out</span>
        </button>
      </div>
    </header>
  );
}
