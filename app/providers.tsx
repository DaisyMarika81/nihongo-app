'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth';
import { SyncProvider } from '@/lib/sync-provider';
import { ThemeProvider } from '@/lib/theme';
import AuthGuard from './components/AuthGuard';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <SyncProvider>
        <ThemeProvider>
          <AuthGuard>
            {children}
          </AuthGuard>
        </ThemeProvider>
      </SyncProvider>
    </AuthProvider>
  );
}
