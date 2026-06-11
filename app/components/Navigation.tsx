'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { getRestrictMode } from '@/lib/session-data';

const allTabs = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/schedule', label: 'Lịch học', icon: '📅' },
  { href: '/review/jlpt', label: 'Luyện Kanji', icon: '🎯' },
  { href: '/practice', label: 'Luyện', icon: '🎯' },
  { href: '/chat', label: 'AI', icon: '🤖' },
  { href: '/kanji', label: 'Kanji', icon: '🈁' },
  { href: '/quiz', label: 'Quiz', icon: '✍️' },
];

const RESTRICTED_TABS = ['/', '/schedule', '/review/jlpt', '/quiz'];

export default function Navigation() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const { isAdmin } = useAuth();
  const [restrict, setRestrict] = useState(false);

  useEffect(() => {
    getRestrictMode().then(setRestrict);
  }, []);

  const tabs = (!isAdmin && restrict) ? allTabs.filter(t => RESTRICTED_TABS.includes(t.href)) : allTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-lg z-50">
      <div className="flex justify-around items-center h-16">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link key={tab.href} href={tab.href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 text-xs rounded-lg transition-all ${active ? 'text-rose-500 scale-110' : 'text-gray-400 hover:text-gray-600'}`}>
              <span className="text-xl">{tab.icon}</span>
              <span className="font-medium">{tab.label}</span>
            </Link>
          );
        })}
        <button onClick={toggle} className="flex flex-col items-center gap-0.5 px-2 py-1 text-xs text-gray-400 hover:text-gray-600">
          <span className="text-xl">{theme === 'light' ? '🌙' : '☀️'}</span>
          <span className="font-medium">{theme === 'light' ? 'Tối' : 'Sáng'}</span>
        </button>
      </div>
    </nav>
  );
}
