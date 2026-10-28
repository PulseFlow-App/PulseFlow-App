/**
 * Copyright (c) 2026 Anastasia Boltrushevich / Pulse Flow. All rights reserved.
 */
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  applyAppearance,
  persistAppearance,
  readStoredAppearance,
} from "@/lib/appearance/apply";
import {
  DEFAULT_APPEARANCE,
  type Appearance,
} from "@/lib/appearance/types";

type AppearanceContextValue = {
  appearance: Appearance;
  setAppearance: (next: Appearance) => void;
};

const AppearanceContext = createContext<AppearanceContextValue>({
  appearance: DEFAULT_APPEARANCE,
  setAppearance: () => undefined,
});

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [appearance, setAppearanceState] = useState<Appearance>(() => {
    if (typeof window === "undefined") return DEFAULT_APPEARANCE;
    return readStoredAppearance();
  });

  useEffect(() => {
    applyAppearance(appearance);
  }, [appearance]);

  const setAppearance = useCallback((next: Appearance) => {
    setAppearanceState(next);
    persistAppearance(next);
  }, []);

  const value = useMemo(
    () => ({ appearance, setAppearance }),
    [appearance, setAppearance],
  );

  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  return useContext(AppearanceContext);
}
