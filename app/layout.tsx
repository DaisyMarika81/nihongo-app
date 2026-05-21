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
          <main className="max-w-4xl mx-auto px-4 pb-20">
            {children}
          </main>
          <Navigation />
        </Providers>
      </body>
    </html>
  );
}
