/**
 * Thin local cache for education progress. DB is source of truth via API.
 */

import type { EducationStepsMap } from "@/lib/education/steps";
import { emptyStepsMap } from "@/lib/education/steps";

const CACHE_KEY = "pulseflow_education_progress_v2";

export type EducationProgressCache = {
  profileId: string;
  started_at: string | null;
  current_step_id: string | null;
  steps: EducationStepsMap;
  completed_at: string | null;
  dismissed_at: string | null;
};

export function readEducationCache(
  profileId: string,
): EducationProgressCache | null {
  if (typeof window === "undefined" || !profileId) return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as EducationProgressCache;
    if (parsed.profileId !== profileId) return null;
    return {
      ...parsed,
      steps: { ...emptyStepsMap(), ...parsed.steps },
    };
  } catch {
    return null;
  }
}

export function writeEducationCache(cache: EducationProgressCache): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* ignore quota */
  }
}

export function clearEducationCache(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    /* ignore */
  }
}
