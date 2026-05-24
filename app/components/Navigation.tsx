'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/lib/theme';

const tabs = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/schedule', label: 'Lịch học', icon: '📅' },
  { href: '/kanji', label: 'Kanji', icon: '🈁' },
  { href: '/practice', label: 'Luyện', icon: '🎯' },
  { href: '/quiz', label: 'Quiz', icon: '✍️' },
];

export default function Navigation() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 shadow-lg">
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
