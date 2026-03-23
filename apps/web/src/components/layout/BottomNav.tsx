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
} from 'lucide-react';

const navItems = [
  { href: '/dashboard',     label: 'Dashboard',     icon: Layers },
  { href: '/investments',   label: 'Investments',   icon: DollarSign },
  { href: '/contributions', label: 'Contribute',    icon: TrendingUp },
  { href: '/withdrawals',   label: 'Withdraw',      icon: TrendingDown },
  { href: '/goals',         label: 'Goals',         icon: Goal },
  { href: '/rebalancing',   label: 'Rebalance',     icon: Shuffle },
  { href: '/settings',      label: 'Settings',      icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex overflow-x-auto scrollbar-hide">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 px-3 py-2 min-w-[4rem] flex-1 text-xs font-medium transition-colors ${
                isActive ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : ''}`} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
