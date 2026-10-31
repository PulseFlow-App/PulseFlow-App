"use client";

import { EducationTourSheet } from "@/components/education/tour-sheet";
import { EducationChecklist } from "@/components/education/checklist";
import { useEducation } from "@/lib/education/provider";

/** Root education overlays: spotlight sheet + checklist. */
export function EducationTour() {
  const edu = useEducation();
  if (!edu.enabled || !edu.eligible) return null;
  return (
    <>
      <EducationTourSheet />
      <EducationChecklist />
    </>
  );
}
