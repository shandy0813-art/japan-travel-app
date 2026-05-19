'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  {
    href: '/itinerary',
    label: '行程',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} className="w-6 h-6">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/accounting',
    label: '記帳',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} className="w-6 h-6">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v1m0 8v1M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.5-1.5 2-2.5 2.5S9.5 13 9.5 14.5a2.5 2.5 0 0 0 5 0"
          strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/packing',
    label: '行李',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} className="w-6 h-6">
        <rect x="4" y="8" width="16" height="13" rx="2" />
        <path d="M8 8V6a4 4 0 0 1 8 0v2" strokeLinecap="round" />
        <path d="M12 12v4M10 14h4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/translation',
    label: '工具',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} className="w-6 h-6">
        <path d="M3 5h12M9 3v2M5 9a7 7 0 0 0 7 7" strokeLinecap="round" />
        <path d="M9 14s.8-1.5 2-3 2.8-2.5 4-3" strokeLinecap="round" />
        <path d="M13 21l4-9 4 9M14.6 17.5h4.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/settings',
    label: '設定',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} className="w-6 h-6">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33
          1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06
          a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09
          A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06
          A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51
          1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9
          a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom"
      style={{ height: 'var(--nav-height)' }}>
      <div className="flex h-full max-w-lg mx-auto">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors
                ${active ? 'text-red-600' : 'text-gray-400'}`}
            >
              {icon(active)}
              <span className={`text-[10px] font-medium ${active ? 'text-red-600' : 'text-gray-400'}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
