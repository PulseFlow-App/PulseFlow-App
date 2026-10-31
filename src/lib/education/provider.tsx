"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useData } from "@/lib/data/use-app-data";
import {
  educationStepsFor,
  type EducationStep,
} from "@/lib/education/steps";
import {
  hasCompletedEducation,
  markEducationCompleted,
} from "@/lib/education/storage";

type EducationContextValue = {
  open: boolean;
  steps: EducationStep[];
  index: number;
  step: EducationStep | null;
  start: () => void;
  close: () => void;
  next: () => void;
  back: () => void;
  skipAll: () => void;
};

const EducationContext = createContext<EducationContextValue | null>(null);

export function EducationProvider({ children }: { children: React.ReactNode }) {
  const data = useData();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [autoChecked, setAutoChecked] = useState(false);

  const steps = useMemo(() => {
    if (!data.profile) return [];
    return educationStepsFor({
      role: data.profile.role,
      orgKind: data.orgKind,
    });
  }, [data.profile, data.orgKind]);

  const start = useCallback(() => {
    setIndex(0);
    setOpen(true);
  }, []);

  const finish = useCallback(() => {
    setOpen(false);
    setIndex(0);
    if (data.profile?.id) markEducationCompleted(data.profile.id);
  }, [data.profile?.id]);

  const close = useCallback(() => {
    finish();
  }, [finish]);

  const skipAll = useCallback(() => {
    finish();
  }, [finish]);

  const next = useCallback(() => {
    setIndex((i) => {
      if (i >= steps.length - 1) {
        finish();
        return 0;
      }
      return i + 1;
    });
  }, [steps.length, finish]);

  const back = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  useEffect(() => {
    if (autoChecked || !data.ready || !data.profile) return;
    setAutoChecked(true);
    if (hasCompletedEducation(data.profile.id)) return;
    if (steps.length === 0) return;
    const t = window.setTimeout(() => {
      setIndex(0);
      setOpen(true);
    }, 600);
    return () => window.clearTimeout(t);
  }, [autoChecked, data.ready, data.profile, steps.length]);

  const value = useMemo<EducationContextValue>(
    () => ({
      open,
      steps,
      index,
      step: steps[index] ?? null,
      start,
      close,
      next,
      back,
      skipAll,
    }),
    [open, steps, index, start, close, next, back, skipAll],
  );

  return (
    <EducationContext.Provider value={value}>
      {children}
    </EducationContext.Provider>
  );
}

export function useEducation() {
  const ctx = useContext(EducationContext);
  if (!ctx) {
    throw new Error("useEducation must be used within EducationProvider");
  }
  return ctx;
}
