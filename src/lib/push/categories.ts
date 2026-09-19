import type { NotificationKind } from "@/lib/types";
import type { UserRole } from "@/lib/design-tokens";
import { settingsAudience, type SettingsAudience } from "@/lib/settings/audience-copy";
import type { MessageKey } from "@/lib/i18n";

/** User-facing push groups (lock-screen). */
export const PUSH_CATEGORIES = [
  "jobs",
  "messages",
  "tasks",
  "bills",
  "schedule",
  "team",
  "stay",
] as const;

export type PushCategory = (typeof PUSH_CATEGORIES)[number];

export type PushCategoryPrefs = Record<PushCategory, boolean>;

const KIND_TO_CATEGORY: Partial<Record<NotificationKind, PushCategory>> = {
  appointment: "jobs",
  message: "messages",
  urgent_task: "tasks",
  task_assigned: "tasks",
  task_completed: "tasks",
  bill_submitted: "bills",
  bill_paid: "bills",
  bill_due: "bills",
  check_in: "schedule",
  check_out: "schedule",
  team_joined: "team",
  guest_update: "stay",
  endorsement: "team",
};

const CATEGORIES_BY_AUDIENCE: Record<SettingsAudience, PushCategory[]> = {
  guest: ["messages", "stay", "bills"],
  host: ["jobs", "messages", "tasks", "bills", "schedule", "team", "stay"],
  staff: ["jobs", "messages", "tasks", "bills", "schedule", "team"],
};

export function defaultPushPrefs(): PushCategoryPrefs {
  return {
    jobs: true,
    messages: true,
    tasks: true,
    bills: true,
    schedule: true,
    team: true,
    stay: true,
  };
}

export function normalizePushPrefs(raw: unknown): PushCategoryPrefs {
  const base = defaultPushPrefs();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;
  const obj = raw as Record<string, unknown>;
  for (const key of PUSH_CATEGORIES) {
    if (typeof obj[key] === "boolean") base[key] = obj[key];
  }
  return base;
}

export function categoryForNotificationKind(
  kind: NotificationKind | string | undefined,
): PushCategory | null {
  if (!kind) return null;
  return KIND_TO_CATEGORY[kind as NotificationKind] ?? null;
}

export function isPushCategoryEnabled(
  prefs: PushCategoryPrefs | null | undefined,
  kind: NotificationKind | string | undefined,
): boolean {
  const category = categoryForNotificationKind(kind);
  if (!category) return true;
  const normalized = normalizePushPrefs(prefs);
  return normalized[category] !== false;
}

export function pushCategoriesForRole(role: UserRole): PushCategory[] {
  return CATEGORIES_BY_AUDIENCE[settingsAudience(role)];
}

export function pushCategoryLabelKey(category: PushCategory): MessageKey {
  return `settings.pushCategory.${category}` as MessageKey;
}

export function pushCategoryHintKey(category: PushCategory): MessageKey {
  return `settings.pushCategoryHint.${category}` as MessageKey;
}
