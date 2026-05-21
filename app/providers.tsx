'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth';
import { SyncProvider } from '@/lib/sync-provider';
import { ThemeProvider } from '@/lib/theme';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <SyncProvider>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </SyncProvider>
    </AuthProvider>
  );
}
