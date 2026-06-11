'use client';

import { createContext, useContext, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './auth';
import { syncCloudToLocal, autoSave } from './sync';

type SyncCtx = { save: (field: string, localKey: string) => void };
const SyncContext = createContext<SyncCtx>({ save: () => {} });

export function SyncProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  useEffect(() => {
    if (user) syncCloudToLocal(user.username);
  }, [user]);

  const save = useCallback((field: string, localKey: string) => {
    autoSave(user?.username ?? null, field, localKey);
  }, [user]);

  return <SyncContext.Provider value={{ save }}>{children}</SyncContext.Provider>;
}

export const useSync = () => useContext(SyncContext);
