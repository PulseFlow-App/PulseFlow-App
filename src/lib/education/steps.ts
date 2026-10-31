import type { MessageKey } from "@/lib/i18n";

export type EducationStepId =
  | "properties"
  | "calendar"
  | "contacts"
  | "work"
  | "home"
  | "settings";

export type EducationStepStatus = "pending" | "done" | "skipped";

export type EducationStepDef = {
  id: EducationStepId;
  titleKey: MessageKey;
  bodyKey: MessageKey;
  /** Primary CTA label while spotlighting */
  ctaKey: MessageKey;
  /** Ordered data-tour targets to highlight */
  targets: string[];
  /** Route to navigate when the step becomes current */
  href: string;
  /** Completion events that mark this step done */
  doneOn: Array<
    | "property.created"
    | "calendar.saved"
    | "checkin.created"
    | "contact.created"
    | "job.created"
    | "task.created"
    | "step.acknowledged"
  >;
  /** Acknowledge button (steps 5–6) */
  acknowledge?: boolean;
};

export const EDUCATION_STEP_IDS: EducationStepId[] = [
  "properties",
  "calendar",
  "contacts",
  "work",
  "home",
  "settings",
];

export const EDUCATION_STEPS: EducationStepDef[] = [
  {
    id: "properties",
    titleKey: "education.propertiesTitle",
    bodyKey: "education.propertiesBody",
    ctaKey: "education.ctaProperties",
    targets: ["nav-properties", "add-property", "quick-fill"],
    href: "/villas",
    doneOn: ["property.created"],
  },
  {
    id: "calendar",
    titleKey: "education.calendarTitle",
    bodyKey: "education.calendarBody",
    ctaKey: "education.ctaCalendar",
    targets: ["nav-bookings", "calendar-import"],
    href: "/bookings",
    doneOn: ["calendar.saved", "checkin.created"],
  },
  {
    id: "contacts",
    titleKey: "education.contactsTitle",
    bodyKey: "education.contactsBody",
    ctaKey: "education.ctaContacts",
    targets: ["nav-contacts", "add-contact", "nav-invites"],
    href: "/contacts",
    doneOn: ["contact.created"],
  },
  {
    id: "work",
    titleKey: "education.workTitle",
    bodyKey: "education.workBody",
    ctaKey: "education.ctaWork",
    targets: ["nav-jobs", "nav-tasks", "add-job", "add-task"],
    href: "/jobs",
    doneOn: ["job.created", "task.created"],
  },
  {
    id: "home",
    titleKey: "education.homeTitle",
    bodyKey: "education.homeBody",
    ctaKey: "education.gotIt",
    targets: ["home-focus", "bottom-nav", "burger-menu"],
    href: "/home",
    doneOn: ["step.acknowledged"],
    acknowledge: true,
  },
  {
    id: "settings",
    titleKey: "education.settingsTitle",
    bodyKey: "education.settingsBody",
    ctaKey: "education.done",
    targets: [
      "settings-language",
      "settings-currency",
      "settings-appearance",
      "settings-translate",
      "settings-passkey",
    ],
    href: "/settings",
    doneOn: ["step.acknowledged"],
    acknowledge: true,
  },
];

export type EducationStepsMap = Record<
  string,
  { status: EducationStepStatus; at?: string }
>;

export function emptyStepsMap(): EducationStepsMap {
  const map: EducationStepsMap = {};
  for (const id of EDUCATION_STEP_IDS) {
    map[id] = { status: "pending" };
  }
  return map;
}

export function firstPendingStepId(steps: EducationStepsMap): EducationStepId | null {
  for (const id of EDUCATION_STEP_IDS) {
    if ((steps[id]?.status ?? "pending") === "pending") return id;
  }
  return null;
}

export function progressPercent(steps: EducationStepsMap): number {
  const done = EDUCATION_STEP_IDS.filter(
    (id) => steps[id]?.status === "done" || steps[id]?.status === "skipped",
  ).length;
  return Math.round((done / EDUCATION_STEP_IDS.length) * 100);
}
