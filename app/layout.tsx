import type { Metadata } from 'next';
import './globals.css';
import Navigation from './components/Navigation';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Nihongo App - Học tiếng Nhật',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" data-theme="light">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="min-h-screen w-full text-gray-700">
        <Providers>
          <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-indigo-600 focus:rounded-lg focus:shadow-lg focus:text-sm focus:font-bold">
            Bỏ qua điều hướng
          </a>
          <main id="main-content" className="max-w-4xl mx-auto px-4 pb-20">
            {children}
          </main>
          <Navigation />
        </Providers>
      </body>
    </html>
  );
}
