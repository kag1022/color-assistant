import React, { createContext, useContext, useMemo, useState } from 'react';

import { DEFAULT_API_BASE_URL, DEFAULT_UPLOAD_MODE, UploadMode } from '@/src/config/env';

type AppSettings = {
  speechEnabled: boolean;
  speechRate: number;
  apiBaseUrl: string;
  authEmail: string;
  authPassword: string;
  uploadMode: UploadMode;
};

type AppSettingsContextValue = {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
};

const AppSettingsContext = createContext<AppSettingsContextValue | undefined>(undefined);

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>({
    speechEnabled: true,
    speechRate: 1.0,
    apiBaseUrl: DEFAULT_API_BASE_URL,
    authEmail: 'admin@example.com',
    authPassword: 'Admin12345!',
    uploadMode: DEFAULT_UPLOAD_MODE,
  });

  const value = useMemo(() => ({ settings, setSettings }), [settings]);

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
}

export function useAppSettings(): AppSettingsContextValue {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within AppSettingsProvider.');
  }
  return context;
}

