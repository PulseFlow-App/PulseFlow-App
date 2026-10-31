"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useData } from "@/lib/data/use-app-data";
import { isDemoMode, isEducationModeEnabled } from "@/lib/env";
import {
  EDUCATION_STEPS,
  EDUCATION_STEP_IDS,
  emptyStepsMap,
  firstPendingStepId,
  progressPercent,
  type EducationStepDef,
  type EducationStepId,
  type EducationStepsMap,
} from "@/lib/education/steps";
import {
  emitEducationEvent,
  logEducation,
  onEducationEvent,
  type EducationEventType,
} from "@/lib/education/events";
import {
  clearEducationCache,
  readEducationCache,
  writeEducationCache,
} from "@/lib/education/storage";

type TourUiMode = "hidden" | "sheet" | "chip" | "celebrate" | "checklist" | "finished";

type EducationContextValue = {
  enabled: boolean;
  eligible: boolean;
  open: boolean;
  uiMode: TourUiMode;
  steps: EducationStepDef[];
  stepsMap: EducationStepsMap;
  currentStepId: EducationStepId | null;
  step: EducationStepDef | null;
  targetIndex: number;
  percent: number;
  celebrating: boolean;
  menuLabel: "resume" | "startAgain" | "start";
  start: () => void;
  resume: () => void;
  startAgain: () => void;
  openChecklist: () => void;
  closeChecklist: () => void;
  pause: () => void;
  skip: () => void;
  back: () => void;
  acknowledge: () => void;
  primaryAction: () => void;
  shrinkToChip: () => void;
  expandSheet: () => void;
};

const EducationContext = createContext<EducationContextValue | null>(null);

function isOwnerOrManager(role: string | undefined) {
  return role === "owner" || role === "manager";
}

export function EducationProvider({ children }: { children: React.ReactNode }) {
  const data = useData();
  const router = useRouter();
  const pathname = usePathname();
  const enabled = isEducationModeEnabled();
  const demo = isDemoMode();
  const eligible =
    enabled &&
    !demo &&
    Boolean(data.profile) &&
    isOwnerOrManager(data.profile?.role);

  const [stepsMap, setStepsMap] = useState<EducationStepsMap>(emptyStepsMap);
  const [currentStepId, setCurrentStepId] = useState<EducationStepId | null>(
    null,
  );
  const [uiMode, setUiMode] = useState<TourUiMode>("hidden");
  const [targetIndex, setTargetIndex] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [dismissedAt, setDismissedAt] = useState<string | null>(null);
  const autoStarted = useRef(false);
  const persistTimer = useRef<number | null>(null);

  const step = useMemo(
    () => EDUCATION_STEPS.find((s) => s.id === currentStepId) ?? null,
    [currentStepId],
  );

  const percent = progressPercent(stepsMap);

  const menuLabel = useMemo(() => {
    if (completedAt) return "startAgain" as const;
    if (dismissedAt || firstPendingStepId(stepsMap)) {
      const anyStarted = EDUCATION_STEP_IDS.some(
        (id) => stepsMap[id]?.status !== "pending",
      );
      if (anyStarted || dismissedAt) return "resume" as const;
    }
    return "start" as const;
  }, [completedAt, dismissedAt, stepsMap]);

  const persist = useCallback(
    async (next: {
      steps?: EducationStepsMap;
      current_step_id?: string | null;
      started_at?: string | null;
      completed_at?: string | null;
      dismissed_at?: string | null;
    }) => {
      if (!eligible || !data.profile?.id) return;
      const profileId = data.profile.id;
      const mergedSteps = next.steps ?? stepsMap;
      const cache = {
        profileId,
        started_at: next.started_at ?? null,
        current_step_id:
          next.current_step_id === undefined
            ? currentStepId
            : next.current_step_id,
        steps: mergedSteps,
        completed_at:
          next.completed_at === undefined ? completedAt : next.completed_at,
        dismissed_at:
          next.dismissed_at === undefined ? dismissedAt : next.dismissed_at,
      };
      writeEducationCache(cache);

      if (persistTimer.current) window.clearTimeout(persistTimer.current);
      persistTimer.current = window.setTimeout(() => {
        void fetch("/api/education/progress", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            started_at: cache.started_at ?? new Date().toISOString(),
            current_step_id: cache.current_step_id,
            steps: cache.steps,
            completed_at: cache.completed_at,
            dismissed_at: cache.dismissed_at,
          }),
        }).catch(() => {
          /* local cache still holds state */
        });
      }, 200);
    },
    [
      eligible,
      data.profile?.id,
      stepsMap,
      currentStepId,
      completedAt,
      dismissedAt,
    ],
  );

  const markSatisfiedFromData = useCallback(
    (map: EducationStepsMap): EducationStepsMap => {
      const next = { ...map };
      const now = new Date().toISOString();
      if (data.villas.length > 0 && next.properties?.status === "pending") {
        next.properties = { status: "done", at: now };
      }
      const hasIcal = data.villas.some((v) => v.ical_import_url);
      const hasStay = (data.guestStays?.length ?? 0) > 0;
      if ((hasIcal || hasStay) && next.calendar?.status === "pending") {
        next.calendar = { status: "done", at: now };
      }
      if (data.contacts.length > 0 && next.contacts?.status === "pending") {
        next.contacts = { status: "done", at: now };
      }
      const hasWork =
        (data.tasks?.length ?? 0) > 0 || (data.serviceOrders?.length ?? 0) > 0;
      if (hasWork && next.work?.status === "pending") {
        next.work = { status: "done", at: now };
      }
      return next;
    },
    [data.villas, data.guestStays, data.contacts, data.tasks, data.serviceOrders],
  );

  // Load progress
  useEffect(() => {
    if (!eligible || !data.ready || !data.profile?.id) {
      if (data.ready) setLoaded(true);
      return;
    }
    let cancelled = false;
    const profileId = data.profile.id;
    const cached = readEducationCache(profileId);

    void (async () => {
      try {
        const res = await fetch("/api/education/progress");
        const json = (await res.json()) as {
          progress?: {
            steps?: EducationStepsMap;
            current_step_id?: string | null;
            completed_at?: string | null;
            dismissed_at?: string | null;
            started_at?: string | null;
          } | null;
        };
        if (cancelled) return;
        if (json.progress) {
          const mapped = markSatisfiedFromData({
            ...emptyStepsMap(),
            ...json.progress.steps,
          });
          setStepsMap(mapped);
          setCompletedAt(json.progress.completed_at ?? null);
          setDismissedAt(json.progress.dismissed_at ?? null);
          setCurrentStepId(
            (json.progress.current_step_id as EducationStepId) ??
              firstPendingStepId(mapped),
          );
        } else if (cached) {
          const mapped = markSatisfiedFromData(cached.steps);
          setStepsMap(mapped);
          setCompletedAt(cached.completed_at);
          setDismissedAt(cached.dismissed_at);
          setCurrentStepId(
            (cached.current_step_id as EducationStepId) ??
              firstPendingStepId(mapped),
          );
        } else {
          const mapped = markSatisfiedFromData(emptyStepsMap());
          setStepsMap(mapped);
          setCurrentStepId(firstPendingStepId(mapped));
        }
      } catch {
        if (cached && !cancelled) {
          setStepsMap(markSatisfiedFromData(cached.steps));
          setCurrentStepId(
            (cached.current_step_id as EducationStepId) ??
              firstPendingStepId(cached.steps),
          );
        }
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [eligible, data.ready, data.profile?.id, markSatisfiedFromData]);

  const goToStep = useCallback(
    (id: EducationStepId | null, opts?: { navigate?: boolean }) => {
      setCurrentStepId(id);
      setTargetIndex(0);
      if (!id) return;
      const def = EDUCATION_STEPS.find((s) => s.id === id);
      if (opts?.navigate !== false && def && pathname !== def.href) {
        router.push(def.href);
      }
      logEducation("step_viewed", { stepId: id });
    },
    [pathname, router],
  );

  const completeTour = useCallback(() => {
    const now = new Date().toISOString();
    setCompletedAt(now);
    setDismissedAt(null);
    setUiMode("finished");
    setCurrentStepId(null);
    void persist({
      completed_at: now,
      dismissed_at: null,
      current_step_id: null,
      steps: stepsMap,
    });
    logEducation("tour_completed");
  }, [persist, stepsMap]);

  const advanceAfterDone = useCallback(
    (map: EducationStepsMap) => {
      const nextId = firstPendingStepId(map);
      if (!nextId) {
        completeTour();
        return;
      }
      setCelebrating(true);
      window.setTimeout(() => {
        setCelebrating(false);
        setUiMode("sheet");
        goToStep(nextId);
        void persist({
          steps: map,
          current_step_id: nextId,
          completed_at: null,
          dismissed_at: null,
        });
      }, 1000);
    },
    [completeTour, goToStep, persist],
  );

  const markStep = useCallback(
    (id: EducationStepId, status: "done" | "skipped") => {
      const now = new Date().toISOString();
      const map = {
        ...stepsMap,
        [id]: { status, at: now },
      };
      setStepsMap(map);
      logEducation(status === "done" ? "step_done" : "step_skipped", {
        stepId: id,
      });
      if (status === "done" || status === "skipped") {
        advanceAfterDone(map);
      }
    },
    [stepsMap, advanceAfterDone],
  );

  // Completion events
  useEffect(() => {
    if (!eligible) return;
    return onEducationEvent((type: EducationEventType, detail) => {
      const listening =
        uiMode === "sheet" || uiMode === "chip" || uiMode === "celebrate";
      if (!listening) return;

      const active = currentStepId
        ? EDUCATION_STEPS.find((s) => s.id === currentStepId)
        : null;
      if (!active) return;

      if (type === "step.acknowledged") {
        if (detail?.stepId && detail.stepId !== active.id) return;
        if (!active.acknowledge) return;
        markStep(active.id, "done");
        return;
      }

      if ((active.doneOn as EducationEventType[]).includes(type)) {
        markStep(active.id, "done");
      }
    });
  }, [eligible, uiMode, currentStepId, markStep]);

  const openTourAt = useCallback(
    (id: EducationStepId | null) => {
      const startId = id ?? firstPendingStepId(stepsMap) ?? EDUCATION_STEP_IDS[0]!;
      const now = new Date().toISOString();
      setDismissedAt(null);
      setCompletedAt(null);
      setUiMode("sheet");
      goToStep(startId);
      void persist({
        started_at: now,
        dismissed_at: null,
        completed_at: null,
        current_step_id: startId,
        steps: stepsMap,
      });
      logEducation("tour_started", { stepId: startId });
    },
    [stepsMap, goToStep, persist],
  );

  const start = useCallback(() => {
    openTourAt(firstPendingStepId(stepsMap));
  }, [openTourAt, stepsMap]);

  const resume = useCallback(() => {
    openTourAt(currentStepId ?? firstPendingStepId(stepsMap));
  }, [openTourAt, currentStepId, stepsMap]);

  const startAgain = useCallback(() => {
    const fresh = emptyStepsMap();
    const mapped = markSatisfiedFromData(fresh);
    setStepsMap(mapped);
    setCompletedAt(null);
    setDismissedAt(null);
    clearEducationCache();
    const id = firstPendingStepId(mapped) ?? EDUCATION_STEP_IDS[0]!;
    setUiMode("sheet");
    goToStep(id);
    void persist({
      started_at: new Date().toISOString(),
      steps: mapped,
      current_step_id: id,
      completed_at: null,
      dismissed_at: null,
    });
    logEducation("tour_started", { restart: true, stepId: id });
  }, [markSatisfiedFromData, goToStep, persist]);

  const pause = useCallback(() => {
    const now = new Date().toISOString();
    setDismissedAt(now);
    setUiMode("hidden");
    void persist({
      dismissed_at: now,
      current_step_id: currentStepId,
      steps: stepsMap,
    });
    logEducation("tour_paused", { stepId: currentStepId });
  }, [persist, currentStepId, stepsMap]);

  const skip = useCallback(() => {
    if (!currentStepId) return;
    markStep(currentStepId, "skipped");
  }, [currentStepId, markStep]);

  const back = useCallback(() => {
    if (!currentStepId) return;
    const idx = EDUCATION_STEP_IDS.indexOf(currentStepId);
    if (idx <= 0) return;
    const prev = EDUCATION_STEP_IDS[idx - 1]!;
    goToStep(prev);
    void persist({ current_step_id: prev, steps: stepsMap });
  }, [currentStepId, goToStep, persist, stepsMap]);

  const acknowledge = useCallback(() => {
    if (!currentStepId) return;
    emitEducationEvent("step.acknowledged", { stepId: currentStepId });
  }, [currentStepId]);

  const primaryAction = useCallback(() => {
    if (!step) return;
    if (step.acknowledge) {
      acknowledge();
      return;
    }
    // Cycle spotlight targets / navigate to href
    const targets = step.targets;
    if (targetIndex < targets.length - 1) {
      setTargetIndex((i) => i + 1);
    }
    if (pathname !== step.href) {
      router.push(step.href);
    }
    setUiMode("chip");
  }, [step, acknowledge, targetIndex, pathname, router]);

  const shrinkToChip = useCallback(() => setUiMode("chip"), []);
  const expandSheet = useCallback(() => setUiMode("sheet"), []);
  const openChecklist = useCallback(() => setUiMode("checklist"), []);
  const closeChecklist = useCallback(() => {
    setUiMode(dismissedAt || completedAt ? "hidden" : "sheet");
  }, [dismissedAt, completedAt]);

  // Auto-start once after first sign-in
  useEffect(() => {
    if (!eligible || !loaded || autoStarted.current) return;
    if (completedAt) return;
    if (dismissedAt) return;
    const pending = firstPendingStepId(stepsMap);
    if (!pending) return;
    autoStarted.current = true;
    const t = window.setTimeout(() => {
      setUiMode("sheet");
      goToStep(pending);
      void persist({
        started_at: new Date().toISOString(),
        current_step_id: pending,
        steps: stepsMap,
        dismissed_at: null,
      });
      logEducation("tour_started", { auto: true, stepId: pending });
    }, 700);
    return () => window.clearTimeout(t);
  }, [
    eligible,
    loaded,
    completedAt,
    dismissedAt,
    stepsMap,
    goToStep,
    persist,
  ]);

  // Esc pauses
  useEffect(() => {
    if (uiMode !== "sheet" && uiMode !== "chip") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        pause();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [uiMode, pause]);

  const value = useMemo<EducationContextValue>(
    () => ({
      enabled,
      eligible,
      open: uiMode !== "hidden",
      uiMode,
      steps: EDUCATION_STEPS,
      stepsMap,
      currentStepId,
      step,
      targetIndex,
      percent,
      celebrating,
      menuLabel,
      start,
      resume,
      startAgain,
      openChecklist,
      closeChecklist,
      pause,
      skip,
      back,
      acknowledge,
      primaryAction,
      shrinkToChip,
      expandSheet,
    }),
    [
      enabled,
      eligible,
      uiMode,
      stepsMap,
      currentStepId,
      step,
      targetIndex,
      percent,
      celebrating,
      menuLabel,
      start,
      resume,
      startAgain,
      openChecklist,
      closeChecklist,
      pause,
      skip,
      back,
      acknowledge,
      primaryAction,
      shrinkToChip,
      expandSheet,
    ],
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
