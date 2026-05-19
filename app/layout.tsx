import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProvider } from './context/AppContext';
import BottomNav from './components/BottomNav';
import SwRegister from './components/SwRegister';

export const metadata: Metadata = {
  title: '日本旅遊 2026',
  description: '日本旅遊專用 App',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '日本旅遊',
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#dc2626',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" className="h-full">
      <body className="h-full bg-gray-50">
        <AppProvider>
          <main className="page-scroll pb-[var(--nav-height)]">
            {children}
          </main>
          <BottomNav />
          <SwRegister />
        </AppProvider>
      </body>
    </html>
  );
}
