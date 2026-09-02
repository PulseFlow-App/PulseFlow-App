import type { UserRole } from "@/lib/design-tokens";
import type { MessageKey } from "@/lib/i18n";

export type SettingsAudience = "guest" | "host" | "staff";

/** Maps app roles to the three settings/notification copy audiences. */
export function settingsAudience(role: UserRole): SettingsAudience {
  if (role === "guest") return "guest";
  if (role === "owner" || role === "manager") return "host";
  return "staff";
}

function audienceKey(
  base: string,
  role: UserRole,
): MessageKey {
  return `${base}.${settingsAudience(role)}` as MessageKey;
}

export function pushHintKey(role: UserRole): MessageKey {
  return audienceKey("settings.pushHint", role);
}

export function translateContentHintKey(role: UserRole): MessageKey {
  return audienceKey("settings.translateContentHint", role);
}

export function notificationsSubtitleKey(role: UserRole): MessageKey {
  return audienceKey("notifications.subtitle", role);
}
