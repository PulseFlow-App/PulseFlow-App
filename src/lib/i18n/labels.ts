import type { CleaningStatus, UserRole, VillaStatus } from "@/lib/design-tokens";
import type { MessageKey } from "@/lib/i18n";

type TFn = (key: MessageKey, params?: Record<string, string | number>) => string;

export function labelVillaStatus(t: TFn, status: VillaStatus) {
  return t(`status.${status}` as MessageKey);
}

export function labelCleaningStatus(t: TFn, status: CleaningStatus) {
  return t(`status.cleaning.${status}` as MessageKey);
}

export function labelRole(t: TFn, role: UserRole) {
  return t(`roles.${role}` as MessageKey);
}
