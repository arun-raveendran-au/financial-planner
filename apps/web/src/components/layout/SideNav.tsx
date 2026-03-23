'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Layers,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Goal,
  Shuffle,
  Settings,
  PiggyBank,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard',     label: 'Dashboard',     icon: Layers },
  { href: '/investments',   label: 'Investments',   icon: DollarSign },
  { href: '/contributions', label: 'Contributions', icon: TrendingUp },
  { href: '/withdrawals',   label: 'Withdrawals',   icon: TrendingDown },
  { href: '/goals',         label: 'Goals',         icon: Goal },
  { href: '/rebalancing',   label: 'Rebalancing',   icon: Shuffle },
  { href: '/settings',      label: 'Settings',      icon: Settings },
];

export function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden lg:flex">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <PiggyBank className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-gray-900">FinPlanner</span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              data-testid={`nav-${label.toLowerCase()}`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
