import { AREAS, CATEGORIES, localizedName } from "@/lib/pros/catalog";
import type { ProJob, ProOffer, ProProfile, ProRequest, ProReview, ProsState } from "@/lib/pros/types";

export type AreaRef = {
  id: string;
  parentId: string | null;
  level: string;
  names: Record<string, string>;
  slug: string;
};

export function allCategories(state: ProsState) {
  return [
    ...CATEGORIES.map((c) => ({ ...c, active: true, extra: false })),
    ...state.categoriesExtra.map((c) => ({
      id: c.id,
      slug: c.slug,
      icon: c.icon,
      names: c.names,
      descriptions: c.names,
      active: c.active,
      extra: true,
    })),
  ];
}

export function allAreas(state: ProsState): AreaRef[] {
  return [
    ...AREAS.map((a) => ({ id: a.id, parentId: a.parentId, level: a.level, names: a.names, slug: a.slug })),
    ...state.areasExtra.map((a) => ({
      id: a.id,
      parentId: a.parentId,
      level: a.level,
      names: a.names,
      slug: a.slug,
    })),
  ];
}

export function areaName(state: ProsState, id: string | null, locale: string) {
  if (!id) return "";
  const area = allAreas(state).find((a) => a.id === id);
  return area ? localizedName(area.names, locale) : "";
}

export function categoryName(state: ProsState, id: string | null, locale: string) {
  if (!id) return "";
  const cat = allCategories(state).find((c) => c.id === id);
  return cat ? localizedName(cat.names, locale) : "";
}

function covers(areas: AreaRef[], selected: string | null, coverage: string[]) {
  if (!selected) return true;
  if (coverage.includes(selected)) return true;
  const children = new Set(areas.filter((a) => a.parentId === selected).map((a) => a.id));
  if (coverage.some((id) => children.has(id))) return true;
  let cursor = areas.find((a) => a.id === selected) ?? null;
  const seen = new Set<string>();
  while (cursor && !seen.has(cursor.id)) {
    seen.add(cursor.id);
    if (coverage.includes(cursor.id)) return true;
    cursor = cursor.parentId ? areas.find((a) => a.id === cursor!.parentId) ?? null : null;
  }
  return false;
}

export function profileVisible(
  pro: ProProfile,
  mode: "public" | "team",
  orgId: string | null,
) {
  if (pro.status === "suspended") return false;
  if (pro.visibility === "public") return true;
  return mode === "team" && Boolean(orgId) && pro.orgId === orgId;
}

export function filterPros(
  state: ProsState,
  input: {
    mode: "public" | "team";
    orgId: string | null;
    placeId: string | null;
    categoryId?: string | null;
    language?: string | null;
    verified?: boolean;
    available?: boolean;
    query?: string;
  },
) {
  const areas = allAreas(state);
  const q = input.query?.trim().toLowerCase() ?? "";
  return state.profiles.filter((pro) => {
    if (!profileVisible(pro, input.mode, input.orgId)) return false;
    if (input.categoryId && !pro.categoryIds.includes(input.categoryId)) return false;
    if (!covers(areas, input.placeId, pro.areaIds)) return false;
    if (input.language && !pro.languages.includes(input.language)) return false;
    if (input.verified) {
      const earned = pro.checks.phone || pro.checks.identity || pro.checks.business;
      if (!earned) return false;
    }
    if (input.available && !pro.available) return false;
    if (q && !`${pro.name} ${pro.description}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

export function reviewAverage(reviews: ProReview[], profileId: string) {
  const rows = reviews.filter((r) => r.profileId === profileId);
  if (!rows.length) return null;
  return rows.reduce((sum, row) => sum + row.stars, 0) / rows.length;
}

export function sortOrganic(pros: ProProfile[], reviews: ProReview[]) {
  return [...pros].sort((a, b) => {
    const left = reviewAverage(reviews, a.id);
    const right = reviewAverage(reviews, b.id);
    if (left == null && right != null) return 1;
    if (right == null && left != null) return -1;
    if (left != null && right != null && right !== left) return right - left;
    return a.name.localeCompare(b.name);
  });
}

export function matchPros(state: ProsState, request: Pick<ProRequest, "categoryId" | "areaId" | "language" | "orgId">) {
  return filterPros(state, {
    mode: "team",
    orgId: request.orgId,
    placeId: request.areaId,
    categoryId: request.categoryId,
    language: request.language,
  }).filter((pro) => pro.available && pro.status === "active");
}

export function jobsFor(jobs: ProJob[], profileId: string) {
  return jobs.filter((job) => job.profileId === profileId);
}

export function offerHasReply(offer: ProOffer) {
  return offer.status === "declined" || offer.amount != null || Boolean(offer.message.trim()) || Boolean(offer.proposedTime);
}

export function nextKey(status: ProRequest["status"]) {
  switch (status) {
    case "requested":
      return "nextRequested" as const;
    case "offers_received":
      return "nextOffers" as const;
    case "chosen":
      return "nextChosen" as const;
    case "scheduled":
      return "nextScheduled" as const;
    case "in_progress":
      return "nextProgress" as const;
    case "awaiting_approval":
      return "nextApproval" as const;
    case "completed":
      return "nextDone" as const;
    default:
      return "nextCancelled" as const;
  }
}

export function responseMinutes(request: ProRequest, offers: ProOffer[]) {
  const first = offers
    .filter((o) => o.requestId === request.id && offerHasReply(o))
    .map((o) => new Date(o.createdAt).getTime())
    .sort((a, b) => a - b)[0];
  if (!first) return null;
  return Math.max(1, Math.round((first - new Date(request.createdAt).getTime()) / 60000));
}
