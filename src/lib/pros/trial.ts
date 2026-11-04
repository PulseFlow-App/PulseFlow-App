import type { ProRequest, ProReview } from "@/lib/pros/types";

/** After the 3 free orders, the free plan is one order each calendar month. */
export const FREE_ORDERS_PER_MONTH = 1;
/** The first orders. The next one opens only after the review on the finished job. */
export const TRIAL_ORDERS = 3;
export const SERVICES_PLAN_USD = 5;
/** The assistant is included in the 5 USD plan. */
export const SERVICES_AGENT_USD = 0;
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
  termsAcceptedAt?: string | null;
  emailOptIn?: boolean;
};

/** Days before the scheduled payment when the account is told a payment is coming. */
export const PAYMENT_NOTICE_DAYS = 2;

/** The 5 USD plan includes extra orders and the AI assistant. */
export type ServicePlan = {
  premium: boolean;
  pro: boolean;
  billingRegisteredAt?: string | null;
  nextPaymentAt?: string | null;
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

/** The first 3 orders are the free starter. After that, count only orders placed once the trial is over. */
export function orderSlots(requests: ProRequest[], actorId: string, now = new Date()) {
  const mine = myOrders(requests, actorId);
  const key = monthKey(now);
  const afterTrial = mine.slice(TRIAL_ORDERS);
  return {
    starter: Math.min(mine.length, TRIAL_ORDERS),
    monthlyThisMonth: afterTrial.filter((row) => monthKey(new Date(row.createdAt)) === key).length,
  };
}

function reviewedOrders(requests: ProRequest[], reviews: ProReview[], actorId: string) {
  const reviewedIds = new Set(reviews.map((review) => review.requestId));
  return myOrders(requests, actorId).filter(
    (row) => row.status === "completed" && reviewedIds.has(row.id),
  );
}

/** The first day of the month after the third reviewed trial order. */
export function monthlyFreeOpensAt(
  requests: ProRequest[],
  reviews: ProReview[],
  actorId: string,
): Date | null {
  const reviewed = reviewedOrders(requests, reviews, actorId);
  const third = reviewed[TRIAL_ORDERS - 1];
  if (!third) return null;
  const review = reviews.find((row) => row.requestId === third.id);
  const at = new Date(review?.createdAt ?? third.createdAt);
  if (!Number.isFinite(at.getTime())) return null;
  return new Date(at.getFullYear(), at.getMonth() + 1, 1);
}

/**
 * Offer billing after the 3 reviewed trial orders.
 * Offer it again after each later free order is reviewed.
 */
export function billingMilestone(
  requests: ProRequest[],
  reviews: ProReview[],
  actorId: string,
): "trial" | `monthly:${string}` | null {
  const reviewed = reviewedOrders(requests, reviews, actorId);
  if (reviewed.length < TRIAL_ORDERS) return null;
  const later = reviewed.slice(TRIAL_ORDERS);
  const last = later[later.length - 1];
  if (last) return `monthly:${last.id}`;
  return "trial";
}

export function addMonths(date: Date, months: number) {
  const next = new Date(date.getTime());
  const day = next.getDate();
  next.setDate(1);
  next.setMonth(next.getMonth() + months);
  const last = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(day, last));
  return next;
}

/** Move a past payment date forward by whole months until it is still ahead. */
export function rollPaymentDate(iso: string, now = new Date()) {
  const due = new Date(iso);
  if (!Number.isFinite(due.getTime())) return iso;
  let cursor = due;
  while (cursor.getTime() <= now.getTime()) cursor = addMonths(cursor, 1);
  return cursor.toISOString();
}

/** The scheduled payment, when today is inside the two days before it. */
export function paymentNoticeDue(nextPaymentAt: string | null | undefined, now = new Date()): Date | null {
  if (!nextPaymentAt) return null;
  const due = new Date(rollPaymentDate(nextPaymentAt, now));
  if (!Number.isFinite(due.getTime())) return null;
  const start = new Date(due.getTime());
  start.setDate(start.getDate() - PAYMENT_NOTICE_DAYS);
  if (now.getTime() >= start.getTime() && now.getTime() < due.getTime()) return due;
  return null;
}

export function hasAgentPlan(customer: ServicesCustomer | null, now = new Date()) {
  if (!customer?.agentUntil) return false;
  const until = new Date(customer.agentUntil).getTime();
  return Number.isFinite(until) && until > now.getTime();
}

/** The 5 USD plan, or a recorded assistant plan, unlocks the assistant. */
export function canUseAssistant(
  customer: ServicesCustomer | null,
  plan: Pick<ServicePlan, "pro" | "premium"> | null = null,
  now = new Date(),
) {
  if (plan?.pro || plan?.premium) return true;
  return hasAgentPlan(customer, now);
}

/**
 * The first 3 orders are free. Each next one waits until the previous job is finished and reviewed.
 * After those 3 are reviewed, the next free order opens the following month, then one each calendar month.
 * Premium allows an order before that, and more than one in a month. It does not skip the review.
 */
export function orderAllowance(
  requests: ProRequest[],
  reviews: ProReview[],
  actorId: string,
  now = new Date(),
  premium = false,
): { ok: true; via: OrderVia } | { ok: false; error: "review" | "finish" | "plan" | "nextMonth" } {
  const mine = myOrders(requests, actorId);
  const blocked = orderBlock(requests, reviews, actorId);
  if (mine.length < TRIAL_ORDERS) {
    if (blocked) return { ok: false, error: blocked };
    return { ok: true, via: "trial" };
  }
  if (blocked) return { ok: false, error: blocked };
  const opens = monthlyFreeOpensAt(requests, reviews, actorId);
  if (opens && now < opens) {
    if (premium) return { ok: true, via: "plan" };
    return { ok: false, error: "nextMonth" };
  }
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
    const map = JSON.parse(raw) as Record<string, ServicePlan>;
    const row = map[actorId];
    return {
      ...normalizePlan(row),
      billingRegisteredAt: row?.billingRegisteredAt ?? null,
      nextPaymentAt: row?.nextPaymentAt ?? null,
    };
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
  const current = map[actorId];
  const saved: ServicePlan = { ...next };
  if (next.premium) {
    if (current?.premium && current.nextPaymentAt) {
      saved.billingRegisteredAt = current.billingRegisteredAt ?? new Date().toISOString();
      saved.nextPaymentAt = rollPaymentDate(current.nextPaymentAt);
    } else {
      const registered = new Date();
      saved.billingRegisteredAt = registered.toISOString();
      saved.nextPaymentAt = addMonths(registered, 1).toISOString();
    }
  } else {
    saved.billingRegisteredAt = null;
    saved.nextPaymentAt = null;
  }
  map[actorId] = saved;
  localStorage.setItem(SERVICES_PLAN_KEY, JSON.stringify(map));
  window.dispatchEvent(new Event(SERVICES_PLAN_EVENT));
  return saved;
}

export function saveServicesCustomer(input: {
  name: string;
  email: string;
  termsAcceptedAt?: string | null;
  emailOptIn?: boolean;
}) {
  const row: ServicesCustomer = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    termsAcceptedAt: input.termsAcceptedAt ?? null,
    emailOptIn: Boolean(input.emailOptIn),
  };
  localStorage.setItem(SERVICES_CUSTOMER_KEY, JSON.stringify(row));
  window.dispatchEvent(new Event(SERVICES_CUSTOMER_EVENT));
  return row;
}
