/**
 * Copyright (c) 2026 Anastasia Boltrushevich / Pulse Flow. All rights reserved.
 */
/** Lightweight welcome funnel events (session-scoped). */

export type WelcomeEventName =
  | "welcome_start_free"
  | "welcome_see_demo"
  | "welcome_role_chip"
  | "welcome_card_open"
  | "welcome_demo_pick";

type WelcomeEvent = {
  name: WelcomeEventName;
  at: string;
  props?: Record<string, string>;
};

const STORAGE_KEY = "pulse-welcome-events";

export function trackWelcomeEvent(
  name: WelcomeEventName,
  props?: Record<string, string>,
) {
  if (typeof window === "undefined") return;
  const event: WelcomeEvent = {
    name,
    at: new Date().toISOString(),
    props,
  };
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const list: WelcomeEvent[] = raw ? (JSON.parse(raw) as WelcomeEvent[]) : [];
    list.push(event);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(-40)));
  } catch {
    /* private mode */
  }
  if (process.env.NODE_ENV !== "production") {
    console.info("[welcome]", name, props ?? {});
  }
  const w = window as Window & {
    dataLayer?: Array<Record<string, unknown>>;
  };
  w.dataLayer?.push({ event: name, ...props });
}
