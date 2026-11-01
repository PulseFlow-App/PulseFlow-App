import type { ProRequest, ProReview } from "@/lib/pros/types";

/** After the 3 free orders, the free plan is one order each calendar month. */
export const FREE_ORDERS_PER_MONTH = 1;
/** The first orders. The next one opens only after the review on the finished job. */
export const TRIAL_ORDERS = 3;
export const SERVICES_PLAN_USD = 9;
/** Assistant that suggests a specialist. Added on top of the full plan. */
export const SERVICES_AGENT_USD = 5;
export const SERVICES_PAYMENTS_ENABLED = false;

export const SERVICES_CUSTOMER_KEY = "pulseflow.services.customer";
export const SERVICES_CUSTOMER_EVENT = "services-customer";
export const SERVICES_PLAN_KEY = "pulseflow.services.plans.v1";
export const SERVICES_PLAN_EVENT = "services-plan";

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

/** Premium is the 9 USD plan. Pro is the assistant, 5 USD on top of Premium. */
export type ServicePlan = {
  premium: boolean;
  pro: boolean;
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

function myOrders(requests: ProRequest[], actorId: string) {
  return requests
    .filter((row) => row.createdBy === actorId && row.status !== "cancelled")
    .slice()
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

function monthKey(at: Date) {
  return `${at.getFullYear()}-${at.getMonth()}`;
}

/** The first 3 orders are the free starter. After that, count orders already placed this month. */
export function orderSlots(requests: ProRequest[], actorId: string, now = new Date()) {
  const mine = myOrders(requests, actorId);
  const key = monthKey(now);
  return {
    starter: Math.min(mine.length, TRIAL_ORDERS),
    monthlyThisMonth: mine.filter((row) => monthKey(new Date(row.createdAt)) === key).length,
  };
}

export function hasAgentPlan(customer: ServicesCustomer | null, now = new Date()) {
  if (!customer?.agentUntil) return false;
  const until = new Date(customer.agentUntil).getTime();
  return Number.isFinite(until) && until > now.getTime();
}

/** Pro, or a recorded assistant plan, unlocks the assistant. Guests still preview it before an account. */
export function canUseAssistant(
  customer: ServicesCustomer | null,
  plan: Pick<ServicePlan, "pro"> | null = null,
  now = new Date(),
) {
  if (plan?.pro) return true;
  return hasAgentPlan(customer, now);
}

/**
 * The first 3 orders are free. Each next one waits until the previous job is finished and reviewed.
 * After those 3, the free plan is one order in a calendar month.
 * Premium allows more than one order in that month. It does not skip the review.
 */
export function orderAllowance(
  requests: ProRequest[],
  reviews: ProReview[],
  actorId: string,
  now = new Date(),
  premium = false,
): { ok: true; via: OrderVia } | { ok: false; error: "review" | "finish" | "plan" } {
  const mine = myOrders(requests, actorId);
  const blocked = orderBlock(requests, reviews, actorId);
  if (mine.length < TRIAL_ORDERS) {
    if (blocked) return { ok: false, error: blocked };
    return { ok: true, via: "trial" };
  }
  if (blocked) return { ok: false, error: blocked };
  const slots = orderSlots(requests, actorId, now);
  if (slots.monthlyThisMonth < FREE_ORDERS_PER_MONTH) {
    return { ok: true, via: "monthly" };
  }
  if (premium) return { ok: true, via: "plan" };
  return { ok: false, error: "plan" };
}

/** The next order is offered only after every open one is finished and reviewed. */
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

export function normalizePlan(input: { premium?: boolean; pro?: boolean } | null | undefined): ServicePlan {
  const pro = Boolean(input?.pro);
  const premium = Boolean(input?.premium) || pro;
  return { premium, pro };
}

export function readServicePlan(actorId: string | null | undefined): ServicePlan {
  if (!actorId || typeof window === "undefined") return { premium: false, pro: false };
  try {
    const raw = localStorage.getItem(SERVICES_PLAN_KEY);
    if (!raw) return { premium: false, pro: false };
    const map = JSON.parse(raw) as Record<string, { premium?: boolean; pro?: boolean }>;
    return normalizePlan(map[actorId]);
  } catch {
    return { premium: false, pro: false };
  }
}

export function saveServicePlan(actorId: string, input: { premium?: boolean; pro?: boolean }) {
  const next = normalizePlan(input);
  let map: Record<string, ServicePlan> = {};
  try {
    const raw = localStorage.getItem(SERVICES_PLAN_KEY);
    if (raw) map = JSON.parse(raw) as Record<string, ServicePlan>;
  } catch {
    map = {};
  }
  map[actorId] = next;
  localStorage.setItem(SERVICES_PLAN_KEY, JSON.stringify(map));
  window.dispatchEvent(new Event(SERVICES_PLAN_EVENT));
  return next;
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
