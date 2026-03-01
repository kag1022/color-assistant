import React, { createContext, useContext, useMemo, useState } from 'react';

import { ColorAnalyzeResponse } from '@/src/api/types';

type AnalysisContextValue = {
  result: ColorAnalyzeResponse | null;
  lastError: string | null;
  setResult: React.Dispatch<React.SetStateAction<ColorAnalyzeResponse | null>>;
  setLastError: React.Dispatch<React.SetStateAction<string | null>>;
};

const AnalysisContext = createContext<AnalysisContextValue | undefined>(undefined);

export function AnalysisProvider({ children }: { children: React.ReactNode }) {
  const [result, setResult] = useState<ColorAnalyzeResponse | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const value = useMemo(
    () => ({
      result,
      lastError,
      setResult,
      setLastError,
    }),
    [result, lastError]
  );

  return <AnalysisContext.Provider value={value}>{children}</AnalysisContext.Provider>;
}

export function useAnalysis(): AnalysisContextValue {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error('useAnalysis must be used within AnalysisProvider.');
  }
  return context;
}

