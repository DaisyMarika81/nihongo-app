'use client';

import { createContext, useContext, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './auth';
import { syncCloudToLocal, autoSave } from './sync';

type SyncCtx = { save: (field: string, localKey: string) => void };
const SyncContext = createContext<SyncCtx>({ save: () => {} });

export function SyncProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  // On login: download cloud data to localStorage
  useEffect(() => {
    if (user) syncCloudToLocal(user.id);
  }, [user]);

  // Save helper: writes to cloud after localStorage update
  const save = useCallback((field: string, localKey: string) => {
    autoSave(user?.id ?? null, field, localKey);
  }, [user]);

  return <SyncContext.Provider value={{ save }}>{children}</SyncContext.Provider>;
}

export const useSync = () => useContext(SyncContext);
