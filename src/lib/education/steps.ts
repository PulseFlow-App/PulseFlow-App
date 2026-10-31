import type { MessageKey } from "@/lib/i18n";
import type { UserRole } from "@/lib/design-tokens";
import type { PulseIconName } from "@/components/icons/pulse-icon";

export type EducationStepId =
  | "welcome"
  | "guestWelcome"
  | "settings"
  | "properties"
  | "staff"
  | "jobsVsTasks"
  | "createWork"
  | "transferOwner"
  | "staffBoard"
  | "staffAccept";

export type EducationStep = {
  id: EducationStepId;
  icon: PulseIconName;
  titleKey: MessageKey;
  bodyKey: MessageKey;
};

const STEP: Record<EducationStepId, EducationStep> = {
  welcome: {
    id: "welcome",
    icon: "home",
    titleKey: "education.welcomeTitle",
    bodyKey: "education.welcomeBody",
  },
  guestWelcome: {
    id: "guestWelcome",
    icon: "guests",
    titleKey: "education.guestWelcomeTitle",
    bodyKey: "education.guestWelcomeBody",
  },
  settings: {
    id: "settings",
    icon: "settings",
    titleKey: "education.settingsTitle",
    bodyKey: "education.settingsBody",
  },
  properties: {
    id: "properties",
    icon: "properties",
    titleKey: "education.propertiesTitle",
    bodyKey: "education.propertiesBody",
  },
  staff: {
    id: "staff",
    icon: "invite",
    titleKey: "education.staffTitle",
    bodyKey: "education.staffBody",
  },
  jobsVsTasks: {
    id: "jobsVsTasks",
    icon: "jobs",
    titleKey: "education.jobsVsTasksTitle",
    bodyKey: "education.jobsVsTasksBody",
  },
  createWork: {
    id: "createWork",
    icon: "tasks",
    titleKey: "education.createWorkTitle",
    bodyKey: "education.createWorkBody",
  },
  transferOwner: {
    id: "transferOwner",
    icon: "contacts",
    titleKey: "education.transferTitle",
    bodyKey: "education.transferBody",
  },
  staffBoard: {
    id: "staffBoard",
    icon: "home",
    titleKey: "education.staffBoardTitle",
    bodyKey: "education.staffBoardBody",
  },
  staffAccept: {
    id: "staffAccept",
    icon: "jobs",
    titleKey: "education.staffAcceptTitle",
    bodyKey: "education.staffAcceptBody",
  },
};

export function educationStepsFor(input: {
  role: UserRole;
  orgKind: "personal" | "company" | null;
}): EducationStep[] {
  const { role, orgKind } = input;
  const company = orgKind === "company";

  if (role === "guest") {
    return [STEP.guestWelcome, STEP.settings];
  }

  if (role === "staff" || role === "cleaner") {
    return [STEP.staffBoard, STEP.staffAccept, STEP.settings, STEP.jobsVsTasks];
  }

  // Owner or manager
  const ids: EducationStepId[] = [
    "welcome",
    "settings",
    "properties",
  ];
  if (company) ids.push("staff");
  ids.push("jobsVsTasks", "createWork");
  if (company && (role === "owner" || role === "manager")) {
    ids.push("transferOwner");
  }
  return ids.map((id) => STEP[id]);
}
