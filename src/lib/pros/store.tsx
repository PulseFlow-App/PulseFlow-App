"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { getDemoProfile } from "@/lib/demo/store";
import { hasDemoUserCookie, isDemoMode } from "@/lib/env";
import { useI18n } from "@/lib/i18n/provider";
import { createSeedState, SEED_PROFILES } from "@/lib/pros/catalog";
import { AGREED_REPLY } from "@/lib/pros/delivery";
import { PROS_EVENT, PROS_STORAGE_KEY, writeProsState } from "@/lib/pros/jobs";
import { prosT, type ProsKey } from "@/lib/pros/i18n";
import { matchPros } from "@/lib/pros/matching";
import {
  answersToComment,
  orderAllowance,
  readServicePlan,
  readServicesCustomer,
  saveServicePlan,
  SERVICES_CUSTOMER_EVENT,
  SERVICES_PLAN_EVENT,
  starsFromAnswers,
  type ServiceAnswers,
  type ServicePlan,
} from "@/lib/pros/trial";
import type {
  ProOffer,
  ProProfile,
  ProRequest,
  ProsActor,
  ProsState,
  ProsUrgency,
} from "@/lib/pros/types";

type RequestInput = {
  categoryId: string;
  title: string;
  description: string;
  photos: string[];
  areaId: string | null;
  areaLabel: string | null;
  shareLocation: string | null;
  urgency: ProsUrgency;
  preferredDate: string | null;
  preferredTime: string;
  language: string | null;
  taskId: string | null;
  orgId: string | null;
  villaId: string | null;
  invitedProfileId: string | null;
};

type StoreResult = { ok: true; id?: string } | { ok: false; error: "auth" | "short" | "rate" | "duplicate" | "consent" | "missing" | "review" | "finish" | "plan" | "nextMonth" };

type Api = {
  ready: boolean;
  actor: ProsActor | null;
  actorReady: boolean;
  isAdmin: boolean;
  adminReady: boolean;
  state: ProsState;
  plan: ServicePlan;
  setPlan: (next: { premium?: boolean; pro?: boolean }) => void;
  t: (key: ProsKey, params?: Record<string, string | number>) => string;
  setPlace: (id: string | null) => void;
  createRequest: (input: RequestInput) => StoreResult & { matches?: ProOffer[] };
  reply: (input: {
    token: string;
    action: "quote" | "decline" | "time" | "agree";
    amount: number | null;
    currency: string | null;
    message: string;
    proposedTime: string | null;
  }) => StoreResult;
  chooseOffer: (offerId: string) => void;
  setRequestStatus: (id: string, status: ProRequest["status"]) => void;
  saveProfile: (input: ProProfile, consent: boolean) => StoreResult;
  deleteProfile: (id: string) => void;
  setProfileStatus: (id: string, status: ProProfile["status"]) => void;
  setCheck: (id: string, check: keyof ProProfile["checks"], on: boolean) => void;
  claim: (token: string) => boolean;
  addReview: (input: { requestId: string; answers: ServiceAnswers }) => StoreResult;
  report: (target: "profile" | "review", targetId: string, reason: string) => void;
  rememberTranslation: (kind: "request" | "offer" | "profile" | "review", id: string, locale: string, text: string) => void;
  addCategory: (name: string) => void;
  addArea: (name: string, parentId: string | null) => void;
  setCategoryActive: (id: string, active: boolean) => void;
  toggleFavourite: (profileId: string) => void;
  recordCost: (requestId: string, input: { amount: number | null; currency: string | null; paid: boolean }) => void;
};

const Ctx = createContext<Api | null>(null);

function mergeSeed(saved: ProProfile[]) {
  const byId = new Map(saved.map((row) => [row.id, row]));
  for (const seed of SEED_PROFILES) {
    if (!byId.has(seed.id)) byId.set(seed.id, seed);
  }
  return [...byId.values()];
}

function load(): ProsState {
  try {
    const raw = localStorage.getItem(PROS_STORAGE_KEY);
    if (!raw) return createSeedState();
    const parsed = JSON.parse(raw) as ProsState;
    if (parsed?.version !== 1 || !Array.isArray(parsed.profiles)) return createSeedState();
    const base = createSeedState();
    return {
      ...base,
      ...parsed,
      profiles: mergeSeed(parsed.profiles).map((pro) => ({
        ...pro,
        checks: { ...base.profiles[0]!.checks, ...pro.checks },
      })),
      requests: (parsed.requests ?? []).map((row) => ({
        ...row,
        source: row.source ?? "open",
        invitedProfileId: row.invitedProfileId ?? null,
        finalAmount: row.finalAmount ?? null,
        finalCurrency: row.finalCurrency ?? null,
        paidAt: row.paidAt ?? null,
      })),
      favourites: parsed.favourites ?? {},
    };
  } catch {
    return createSeedState();
  }
}

export function ProsProvider({ children }: { children: ReactNode }) {
  const { locale } = useI18n();
  const [state, setState] = useState<ProsState>(createSeedState);
  const [ready, setReady] = useState(false);
  const [actor, setActor] = useState<ProsActor | null>(null);
  const [actorReady, setActorReady] = useState(false);
  const remoteProfiles = useRef<ProProfile[]>([]);

  const withRemote = useCallback((base: ProsState) => {
    const remote = remoteProfiles.current;
    const remoteIds = new Set(remote.map((row) => row.id));
    const remotePeople = new Set(
      remote.map((row) => row.linkedProfileId).filter((id): id is string => Boolean(id)),
    );
    // Keep device-only listings, but never shadow a server listing for the same person.
    const local = base.profiles.filter((row) => {
      if (row.consentNote === "Listed on Pulseflow Services.") return false;
      if (remoteIds.has(row.id)) return false;
      if (row.linkedProfileId && remotePeople.has(row.linkedProfileId)) return false;
      return true;
    });
    const ids = new Set(local.map((row) => row.id));
    const extra = remote.filter((row) => !ids.has(row.id));
    return { ...base, profiles: [...extra, ...local] };
  }, []);

  useEffect(() => {
    setState(withRemote(load()));
    setReady(true);
    const sync = () => setState(withRemote(load()));
    window.addEventListener(PROS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PROS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [withRemote]);

  useEffect(() => {
    if (!ready) return;
    let cancel = false;
    const pull = () => {
      void fetch("/api/public/services")
        .then((res) => (res.ok ? res.json() : null))
        .then((payload: { profiles?: ProProfile[] } | null) => {
          if (cancel || !payload) return;
          remoteProfiles.current = payload.profiles ?? [];
          setState((prev) => withRemote(prev));
        })
        .catch(() => undefined);
    };
    pull();
    window.addEventListener("pros-refresh", pull);
    return () => {
      cancel = true;
      window.removeEventListener("pros-refresh", pull);
    };
  }, [ready, withRemote]);

  // Drop unfinished phone-only drafts once the server has nothing open for them,
  // so a stuck local job cannot block the next order.
  useEffect(() => {
    if (!ready || !actor || actor.id.startsWith("local") || actor.role === "guest") return;
    let cancel = false;
    void fetch("/api/services/requests", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { requests: [] }))
      .then(
        (payload: {
          requests?: Array<{ request_id: string; created_by: string; cancelled_at?: string | null }>;
        }) => {
          if (cancel) return;
          const live = new Set(
            (payload.requests ?? [])
              .filter((row) => row.created_by === actor.id && !row.cancelled_at)
              .map((row) => row.request_id),
          );
          setState((prev) => {
            let changed = false;
            const requests = prev.requests.map((row) => {
              if (row.createdBy !== actor.id) return row;
              if (row.status === "completed" || row.status === "cancelled") return row;
              if (live.has(row.id)) return row;
              changed = true;
              return { ...row, status: "cancelled" as const };
            });
            if (!changed) return prev;
            return withRemote({ ...prev, requests });
          });
        },
      )
      .catch(() => undefined);
    return () => {
      cancel = true;
    };
  }, [ready, actor, withRemote]);

  useEffect(() => {
    if (!ready) return;
    writeProsState(
      {
        ...state,
        profiles: state.profiles.filter((row) => row.consentNote !== "Listed on Pulseflow Services."),
      },
      false,
    );
  }, [ready, state]);

  useEffect(() => {
    const apply = (next: ProsActor | null) => {
      setActor(next);
      setActorReady(true);
    };
    const localCustomer = () => {
      const customer = readServicesCustomer();
      return customer
        ? { id: customer.id, name: customer.name, role: "guest", orgId: null, intent: null }
        : null;
    };
    const onCustomer = () => {
      if (isDemoMode() || hasDemoUserCookie()) return;
      apply(localCustomer());
    };
    if (isDemoMode() || hasDemoUserCookie()) {
      const profile = getDemoProfile();
      apply(
        profile
          ? { id: profile.id, name: profile.full_name, role: profile.role, orgId: profile.org_id, intent: null }
          : null,
      );
      return;
    }
    const onLogo = (event: Event) => {
      const url = (event as CustomEvent<string | null>).detail;
      setActor((prev) => (prev ? { ...prev, logoUrl: url } : prev));
    };
    window.addEventListener("pulseflow-logo", onLogo);
    window.addEventListener(SERVICES_CUSTOMER_EVENT, onCustomer);
    const supabase = createClient();
    const loadAuthUser = async (userId: string | null, email: string | null) => {
      if (!userId) {
        apply(localCustomer());
        return;
      }
      const columns = "id, full_name, role, org_id, services_intent";
      const withLogo = await supabase
        .from("profiles")
        .select(`${columns}, logo_url`)
        .eq("id", userId)
        .maybeSingle();
      const loaded =
        withLogo.error && /logo_url/.test(withLogo.error.message)
          ? await supabase.from("profiles").select(columns).eq("id", userId).maybeSingle()
          : withLogo;
      const profile = loaded.data as {
        id: string;
        full_name: string;
        role: string;
        org_id: string | null;
        services_intent: string | null;
        logo_url?: string | null;
      } | null;
      const logoUrl = typeof profile?.logo_url === "string" ? profile.logo_url : null;
      apply(
        profile
          ? {
              id: profile.id,
              name: profile.full_name,
              role: profile.role,
              orgId: profile.org_id,
              intent:
                profile.services_intent === "hire" || profile.services_intent === "work"
                  ? profile.services_intent
                  : null,
              logoUrl,
            }
          : { id: userId, name: email ?? "User", role: "owner", orgId: null, intent: null },
      );
    };
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user.id ?? null;
      const email = session?.user.email ?? null;
      window.setTimeout(() => {
        void loadAuthUser(userId, email);
      }, 0);
    });
    return () => {
      window.removeEventListener("pulseflow-logo", onLogo);
      window.removeEventListener(SERVICES_CUSTOMER_EVENT, onCustomer);
      authListener.subscription.unsubscribe();
    };
  }, []);

  const persist = useCallback((updater: (prev: ProsState) => ProsState) => {
    setState((prev) => updater(prev));
  }, []);

  const [plan, setPlanState] = useState<ServicePlan>({ premium: false, pro: false });
  useEffect(() => {
    const read = () => setPlanState(readServicePlan(actor?.id));
    read();
    window.addEventListener(SERVICES_PLAN_EVENT, read);
    return () => window.removeEventListener(SERVICES_PLAN_EVENT, read);
  }, [actor?.id]);

  const [isAdmin, setIsAdmin] = useState(false);
  const [adminReady, setAdminReady] = useState(false);

  useEffect(() => {
    let cancel = false;
    const read = () => {
      void fetch("/api/admin/session")
        .then((res) => res.json())
        .then((payload: { ok?: boolean }) => {
          if (!cancel) setIsAdmin(Boolean(payload.ok));
        })
        .catch(() => {
          if (!cancel) setIsAdmin(false);
        })
        .finally(() => {
          if (!cancel) setAdminReady(true);
        });
    };
    read();
    window.addEventListener("pros-admin", read);
    return () => {
      cancel = true;
      window.removeEventListener("pros-admin", read);
    };
  }, []);

  const t = useCallback(
    (key: ProsKey, params?: Record<string, string | number>) => prosT(locale, key, params),
    [locale],
  );

  const api = useMemo<Api>(() => {
    return {
      ready,
      actor,
      actorReady,
      isAdmin,
      adminReady,
      state,
      plan,
      setPlan: (next) => {
        if (!actor) return;
        setPlanState(saveServicePlan(actor.id, next));
      },
      t,
      setPlace: (id) => persist((prev) => ({ ...prev, placeId: id })),
      createRequest: (input) => {
        if (!actor) return { ok: false, error: "auth" };
        const allowance = orderAllowance(state.requests, state.reviews, actor.id, new Date(), plan.premium);
        if (!allowance.ok) return { ok: false, error: allowance.error };
        const description = input.description.trim();
        const title = input.title.trim();
        if (description.length < 12 || title.length < 3) return { ok: false, error: "short" };
        const hourAgo = Date.now() - 60 * 60 * 1000;
        const recent = state.requests.filter(
          (row) => row.createdBy === actor.id && new Date(row.createdAt).getTime() > hourAgo,
        );
        if (recent.length >= 8) return { ok: false, error: "rate" };
        const tenMin = Date.now() - 10 * 60 * 1000;
        if (
          recent.some(
            (row) =>
              row.title === title &&
              row.description === description &&
              new Date(row.createdAt).getTime() > tenMin,
          )
        ) {
          return { ok: false, error: "duplicate" };
        }
        const request: ProRequest = {
          id: crypto.randomUUID(),
          createdBy: actor.id,
          orgId: input.orgId ?? actor.orgId,
          taskId: input.taskId,
          villaId: input.villaId,
          categoryId: input.categoryId,
          title,
          description,
          originalLocale: locale,
          translations: {},
          photos: input.photos.slice(0, 3),
          areaId: input.areaId,
          areaLabel: input.areaLabel?.trim() || null,
          shareLocation: input.shareLocation?.trim() || null,
          urgency: input.urgency,
          preferredDate: input.preferredDate,
          preferredTime: input.preferredTime,
          language: input.language,
          status: "requested",
          source: input.invitedProfileId ? "direct" : "open",
          invitedProfileId: input.invitedProfileId,
          chosenProfileId: null,
          finalAmount: null,
          finalCurrency: null,
          paidAt: null,
          createdAt: new Date().toISOString(),
        };
        const invited = input.invitedProfileId
          ? state.profiles.find((pro) => pro.id === input.invitedProfileId && pro.status === "active")
          : null;
        if (input.invitedProfileId && !invited) return { ok: false, error: "missing" };
        const matches = invited
          ? [invited]
          : matchPros({ ...state, requests: [...state.requests, request] }, request);
        const offers: ProOffer[] = matches.map((pro) => ({
          id: crypto.randomUUID(),
          requestId: request.id,
          profileId: pro.id,
          token: crypto.randomUUID(),
          amount: null,
          currency: null,
          message: "",
          originalLocale: locale,
          translations: {},
          proposedTime: null,
          status: "pending",
          createdAt: new Date().toISOString(),
        }));
        persist((prev) => ({
          ...prev,
          requests: [request, ...prev.requests],
          offers: [...offers, ...prev.offers],
          events: [
            { id: crypto.randomUUID(), name: "request_created", actorId: actor.id, ref: request.id, at: request.createdAt },
            ...prev.events,
          ],
        }));
        const linked = matches.filter((pro) => pro.linkedProfileId && request.orgId);
        const targets = matches
          .filter((pro) => pro.linkedProfileId)
          .map((pro) => ({ profileId: pro.linkedProfileId as string, name: pro.name }));
        if (targets.length) {
          const whenLabel = [request.preferredDate, request.preferredTime].filter(Boolean).join(" · ");
          void fetch("/api/services/requests", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              requestId: request.id,
              title: request.title,
              description: request.description,
              whenLabel,
              areaLabel: request.areaLabel,
              shareLocation: request.shareLocation,
              photos: request.photos,
              targets,
            }),
          });
        }
        return { ok: true, id: request.id, matches: offers };
      },
      reply: (input) => {
        const offer = state.offers.find((row) => row.token === input.token);
        if (!offer || offer.status !== "pending") return { ok: false, error: "missing" };
        if (
          input.action !== "decline" &&
          input.action !== "agree" &&
          input.amount == null &&
          !input.message.trim() &&
          !input.proposedTime
        ) {
          return { ok: false, error: "short" };
        }
        const now = new Date().toISOString();
        persist((prev) => ({
          ...prev,
          offers: prev.offers.map((row) =>
            row.token === input.token
              ? {
                  ...row,
                  status: input.action === "decline" ? "declined" : "pending",
                  amount: input.action === "quote" ? input.amount : row.amount,
                  currency: input.action === "quote" ? input.currency : row.currency,
                  message:
                    input.action === "decline"
                      ? row.message
                      : input.action === "agree"
                        ? AGREED_REPLY
                        : input.message.trim(),
                  proposedTime: input.proposedTime,
                  originalLocale: locale,
                  createdAt: now,
                }
              : row,
          ),
          requests: prev.requests.map((row) =>
            row.id === offer.requestId && row.status === "requested"
              ? { ...row, status: "offers_received" }
              : row,
          ),
          events: [
            { id: crypto.randomUUID(), name: "offer_sent", actorId: null, ref: offer.id, at: now },
            ...prev.events,
          ],
        }));
        return { ok: true, id: offer.id };
      },
      chooseOffer: (offerId) => {
        const offer = state.offers.find((row) => row.id === offerId);
        if (!offer || !actor) return;
        const request = state.requests.find((row) => row.id === offer.requestId);
        if (!request || request.createdBy !== actor.id) return;
        persist((prev) => ({
          ...prev,
          offers: prev.offers.map((row) =>
            row.requestId !== offer.requestId
              ? row
              : { ...row, status: row.id === offer.id ? "accepted" : row.status === "pending" ? "declined" : row.status },
          ),
          requests: prev.requests.map((row) =>
            row.id === offer.requestId
              ? { ...row, status: "chosen", chosenProfileId: offer.profileId }
              : row,
          ),
          events: [
            { id: crypto.randomUUID(), name: "offer_chosen", actorId: actor.id, ref: offer.id, at: new Date().toISOString() },
            ...prev.events,
          ],
        }));
      },
      setRequestStatus: (id, status) => {
        if (!actor) return;
        persist((prev) => {
          const request = prev.requests.find((row) => row.id === id);
          if (!request || (request.createdBy !== actor.id && !isAdmin)) return prev;
          let jobs = prev.jobs;
          if (status === "completed" && request.chosenProfileId) {
            const exists = jobs.some((job) => job.requestId === id);
            if (!exists) {
              jobs = [
                ...jobs,
                {
                  id: crypto.randomUUID(),
                  profileId: request.chosenProfileId,
                  requestId: id,
                  taskId: request.taskId,
                  categoryId: request.categoryId,
                  completedAt: new Date().toISOString(),
                },
              ];
            }
          }
          return {
            ...prev,
            jobs,
            requests: prev.requests.map((row) => (row.id === id ? { ...row, status } : row)),
            events:
              status === "completed"
                ? [
                    { id: crypto.randomUUID(), name: "job_verified", actorId: actor.id, ref: id, at: new Date().toISOString() },
                    ...prev.events,
                  ]
                : prev.events,
          };
        });
      },
      saveProfile: (input, consent) => {
        if (!actor) return { ok: false, error: "auth" };
        const existing = state.profiles.find((row) => row.id === input.id);
        if (!existing && !consent) return { ok: false, error: "consent" };
        if (existing?.status === "suspended" && !isAdmin) return { ok: false, error: "missing" };
        const next: ProProfile = {
          ...input,
          photos: input.photos.slice(0, 3),
          listingTier: "free",
          consentAt: existing?.consentAt ?? new Date().toISOString(),
          consentBy: existing?.consentBy ?? actor.id,
          orgId: input.orgId ?? actor.orgId,
        };
        if (next.status === "suspended" && !isAdmin) next.status = "active";
        persist((prev) => ({
          ...prev,
          profiles: prev.profiles.some((row) => row.id === next.id)
            ? prev.profiles.map((row) => (row.id === next.id ? next : row))
            : [next, ...prev.profiles],
        }));
        return { ok: true, id: next.id };
      },
      deleteProfile: (id) => {
        const pro = state.profiles.find((row) => row.id === id);
        if (!pro || !actor) return;
        const mine = pro.orgId && pro.orgId === actor.orgId;
        if (!mine && !isAdmin) return;
        persist((prev) => ({ ...prev, profiles: prev.profiles.filter((row) => row.id !== id) }));
      },
      setProfileStatus: (id, status) => {
        if (!isAdmin) return;
        persist((prev) => ({
          ...prev,
          profiles: prev.profiles.map((row) => (row.id === id ? { ...row, status } : row)),
        }));
      },
      setCheck: (id, check, on) => {
        if (!isAdmin) return;
        persist((prev) => ({
          ...prev,
          profiles: prev.profiles.map((row) =>
            row.id === id
              ? { ...row, checks: { ...row.checks, [check]: on ? new Date().toISOString() : null } }
              : row,
          ),
        }));
      },
      claim: (token) => {
        const pro = state.profiles.find((row) => row.claimToken === token);
        if (!pro) return false;
        persist((prev) => ({
          ...prev,
          profiles: prev.profiles.map((row) =>
            row.claimToken === token ? { ...row, claimedAt: new Date().toISOString() } : row,
          ),
        }));
        return true;
      },
      addReview: ({ requestId, answers }) => {
        if (!actor) return { ok: false, error: "auth" };
        const request = state.requests.find((row) => row.id === requestId);
        if (!request || request.status !== "completed" || request.createdBy !== actor.id || !request.chosenProfileId) {
          return { ok: false, error: "missing" };
        }
        if (state.reviews.some((row) => row.requestId === requestId)) return { ok: true };
        persist((prev) => ({
          ...prev,
          reviews: [
            {
              id: crypto.randomUUID(),
              profileId: request.chosenProfileId!,
              requestId,
              taskId: request.taskId,
              authorId: actor.id,
              stars: starsFromAnswers(answers),
              comment: answersToComment(answers),
              answers,
              originalLocale: locale,
              translations: {},
              createdAt: new Date().toISOString(),
            },
            ...prev.reviews,
          ],
        }));
        return { ok: true };
      },
      report: (target, targetId, reason) => {
        const text = reason.trim();
        if (text.length < 3) return;
        persist((prev) => ({
          ...prev,
          reports: [
            { id: crypto.randomUUID(), target, targetId, reason: text, by: actor?.id ?? null, createdAt: new Date().toISOString() },
            ...prev.reports,
          ],
          events: [
            { id: crypto.randomUUID(), name: "report", actorId: actor?.id ?? null, ref: targetId, at: new Date().toISOString() },
            ...prev.events,
          ],
        }));
      },
      rememberTranslation: (kind, id, lang, text) => {
        persist((prev) => {
          if (kind === "request") {
            return {
              ...prev,
              requests: prev.requests.map((row) =>
                row.id === id ? { ...row, translations: { ...row.translations, [lang]: text } } : row,
              ),
            };
          }
          if (kind === "offer") {
            return {
              ...prev,
              offers: prev.offers.map((row) =>
                row.id === id ? { ...row, translations: { ...row.translations, [lang]: text } } : row,
              ),
            };
          }
          if (kind === "review") {
            return {
              ...prev,
              reviews: prev.reviews.map((row) =>
                row.id === id ? { ...row, translations: { ...row.translations, [lang]: text } } : row,
              ),
            };
          }
          return {
            ...prev,
            profiles: prev.profiles.map((row) =>
              row.id === id ? { ...row, translations: { ...row.translations, [lang]: text } } : row,
            ),
          };
        });
      },
      addCategory: (name) => {
        if (!isAdmin || name.trim().length < 2) return;
        const id = crypto.randomUUID();
        persist((prev) => ({
          ...prev,
          categoriesExtra: [
            ...prev.categoriesExtra,
            { id, slug: id.slice(0, 8), icon: "wrench", active: true, names: { en: name.trim() } },
          ],
        }));
      },
      addArea: (name, parentId) => {
        if (!isAdmin || name.trim().length < 2) return;
        const id = crypto.randomUUID();
        persist((prev) => ({
          ...prev,
          areasExtra: [
            ...prev.areasExtra,
            {
              id,
              slug: id.slice(0, 8),
              parentId,
              level: parentId ? "district" : "locality",
              countryCode: "ZZ",
              names: { en: name.trim() },
            },
          ],
        }));
      },
      toggleFavourite: (profileId) => {
        if (!actor) return;
        persist((prev) => {
          const current = prev.favourites[actor.id] ?? [];
          const next = current.includes(profileId)
            ? current.filter((id) => id !== profileId)
            : [profileId, ...current];
          return { ...prev, favourites: { ...prev.favourites, [actor.id]: next } };
        });
      },
      recordCost: (requestId, input) => {
        if (!actor) return;
        persist((prev) => ({
          ...prev,
          requests: prev.requests.map((row) =>
            row.id === requestId && row.createdBy === actor.id
              ? {
                  ...row,
                  finalAmount: input.amount,
                  finalCurrency: input.currency,
                  paidAt: input.paid ? row.paidAt ?? new Date().toISOString() : null,
                }
              : row,
          ),
        }));
      },
      setCategoryActive: (id, active) => {
        if (!isAdmin) return;
        persist((prev) => ({
          ...prev,
          categoriesExtra: prev.categoriesExtra.map((row) => (row.id === id ? { ...row, active } : row)),
        }));
      },
    };
  }, [ready, actor, actorReady, isAdmin, adminReady, state, plan, t, persist, locale]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function usePros() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePros outside provider");
  return ctx;
}
