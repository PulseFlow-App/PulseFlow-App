import type { ProRequest, ProReview } from "@/lib/pros/types";

/** One order each calendar month, even when a review is still open. */
export const FREE_ORDERS_PER_MONTH = 1;
/** Extra orders. The next one opens only after the review on the previous job. */
export const TRIAL_ORDERS = 3;
export const SERVICES_PLAN_USD = 9;
/** Assistant that suggests a specialist. Added on top of the full plan. */
export const SERVICES_AGENT_USD = 5;
export const SERVICES_PAYMENTS_ENABLED = false;

export const SERVICES_CUSTOMER_KEY = "pulseflow.services.customer";
export const SERVICES_CUSTOMER_EVENT = "services-customer";

export type ServiceAnswers = {
  done: "yes" | "partly" | "no";
  result: "excellent" | "good" | "not";
  again: "yes" | "maybe" | "no";
  complicated: "no" | "a_bit" | "yes";
  reply: "same_day" | "few_days" | "slow" | "none";
  clear: "yes" | "not_really";
};

export type ServicesCustomer = {
  id: string;
  name: string;
  email: string;
  /** ISO time. The assistant stays locked until this is in the future. */
  agentUntil?: string | null;
};

export type OrderVia = "monthly" | "trial" | "plan";

export function starsFromAnswers(answers: ServiceAnswers) {
  if (answers.result === "excellent" && answers.done === "yes") return 5;
  if (answers.result === "good" || answers.done === "partly") return 4;
  if (answers.result === "not" || answers.done === "no") return 2;
  return 3;
}

export function answersToComment(answers: ServiceAnswers) {
  return [
    `Work done: ${answers.done}`,
    `Result: ${answers.result}`,
    `Ask again: ${answers.again}`,
    `Ordering complicated: ${answers.complicated}`,
    `Reply speed: ${answers.reply}`,
    `Next step was clear: ${answers.clear}`,
  ].join("\n");
}

export function ordersUsed(requests: ProRequest[], actorId: string) {
  return requests.filter((row) => row.createdBy === actorId && row.status !== "cancelled").length;
}

/** Monthly free orders are not counted against the 3 review orders. */
export function orderSlots(requests: ProRequest[], actorId: string, now = new Date()) {
  const mine = requests
    .filter((row) => row.createdBy === actorId && row.status !== "cancelled")
    .slice()
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const monthKey = (at: Date) => `${at.getFullYear()}-${at.getMonth()}`;
  const perMonth = new Map<string, number>();
  let trial = 0;
  for (const row of mine) {
    const key = monthKey(new Date(row.createdAt));
    const used = perMonth.get(key) ?? 0;
    if (used < FREE_ORDERS_PER_MONTH) perMonth.set(key, used + 1);
    else trial += 1;
  }
  return {
    monthlyThisMonth: perMonth.get(monthKey(now)) ?? 0,
    trial,
  };
}

export function hasAgentPlan(customer: ServicesCustomer | null, now = new Date()) {
  if (!customer?.agentUntil) return false;
  const until = new Date(customer.agentUntil).getTime();
  return Number.isFinite(until) && until > now.getTime();
}

/**
 * The monthly free order is always open.
 * Up to 3 orders in total can go beyond that month, after each finished job is reviewed.
 * Further orders need the paid plan. While payments are off, those orders are still saved and not charged.
 */
export function orderAllowance(
  requests: ProRequest[],
  reviews: ProReview[],
  actorId: string,
  now = new Date(),
): { ok: true; via: OrderVia } | { ok: false; error: "review" | "finish" | "plan" } {
  const slots = orderSlots(requests, actorId, now);
  if (slots.monthlyThisMonth < FREE_ORDERS_PER_MONTH) {
    return { ok: true, via: "monthly" };
  }
  if (slots.trial < TRIAL_ORDERS) {
    const blocked = orderBlock(requests, reviews, actorId);
    if (blocked) return { ok: false, error: blocked };
    return { ok: true, via: "trial" };
  }
  if (!SERVICES_PAYMENTS_ENABLED) return { ok: true, via: "plan" };
  return { ok: false, error: "plan" };
}

/** The next of the 3 extra orders is offered only after the previous one is finished and reviewed. */
export function orderBlock(
  requests: ProRequest[],
  reviews: ProReview[],
  actorId: string,
): "finish" | "review" | null {
  const mine = requests.filter((row) => row.createdBy === actorId && row.status !== "cancelled");
  if (mine.some((row) => row.status !== "completed")) return "finish";
  if (mine.some((row) => !reviews.some((review) => review.requestId === row.id))) return "review";
  return null;
}

export function readServicesCustomer(): ServicesCustomer | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SERVICES_CUSTOMER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ServicesCustomer;
    if (!parsed?.id || !parsed.name) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveServicesCustomer(input: { name: string; email: string }) {
  const row: ServicesCustomer = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
  };
  localStorage.setItem(SERVICES_CUSTOMER_KEY, JSON.stringify(row));
  window.dispatchEvent(new Event(SERVICES_CUSTOMER_EVENT));
  return row;
}
