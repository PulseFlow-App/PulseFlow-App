"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Camera,
  Phone,
  MessageCircle,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PulseIcon } from "@/components/icons/pulse-icon";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { EmptyState, LoadingState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { StarsPicker } from "@/components/endorsements/stars";
import { useData } from "@/lib/data/use-app-data";
import { contactReachability } from "@/lib/notifications";
import { weekKey } from "@/lib/endorsements";
import {
  canBookServices,
  canBrowseTalent,
  canCastEndorsement,
  canEditContacts,
  isGuestApp,
  isStaffApp,
} from "@/lib/roles";
import { cn, lineDeepLink, phoneToWaMe, telegramDeepLink } from "@/lib/utils";
import type { Contact, ContactMessenger } from "@/lib/types";
import { capitalizeLabel } from "@/lib/format-label";
import type { ContactMessengerKind, TaskPriority } from "@/lib/design-tokens";
import {
  CONTACT_MESSENGER_KINDS,
  contactMessengers,
  messengerNeedsHandle,
  syncContactMessengerFields,
} from "@/lib/contacts/messengers";
import { useI18n } from "@/lib/i18n/provider";
import { useLocalizedDemoText } from "@/lib/demo/use-localized-demo-text";
import {
  WorkScheduleFields,
  emptyWorkSchedule,
} from "@/components/schedule/work-schedule-fields";
import {
  resolveWorkSchedule,
  schedulePayloadFromResolved,
} from "@/lib/work-schedule";

const ROLE_ORDER = [
  "cleaning",
  "plumbing",
  "electrical",
  "pool",
  "garden",
  "AC/appliance repair",
];

export default function ContactsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ContactsPageInner />
    </Suspense>
  );
}

function ContactsPageInner() {
  const data = useData();
  const { t } = useI18n();
  const label = useLocalizedDemoText();
  const router = useRouter();
  const searchParams = useSearchParams();
  const canEdit = data.profile ? canEditContacts(data.profile.role) : false;
  const canBook = data.profile
    ? canBookServices(data.profile.role, data.orgKind)
    : false;
  const canReview = data.profile
    ? canCastEndorsement(data.profile.role, data.orgKind)
    : false;
  const showTalentBrowse = data.profile
    ? canBrowseTalent(data.profile.role, data.orgKind)
    : false;
  const isPersonal = data.orgKind === "personal";
  const staff = data.profile ? isStaffApp(data.profile.role) : false;

  useEffect(() => {
    if (data.profile && isGuestApp(data.profile.role)) {
      router.replace("/home");
    }
  }, [data.profile, router]);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Contact | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [ordering, setOrdering] = useState<Contact | null>(null);
  const [orderPrefill, setOrderPrefill] = useState<{
    villaId?: string;
    date?: string;
    service?: string;
  } | null>(null);
  const [reviewing, setReviewing] = useState<Contact | null>(null);
  const currentWeek = weekKey();

  useEffect(() => {
    if (!data.ready || !canBook || ordering) return;
    const orderProfile = searchParams.get("orderProfile")?.trim();
    if (orderProfile) {
      const match = data.contacts.find(
        (c) => c.linked_profile_id === orderProfile,
      );
      if (match) {
        setOrdering(match);
        return;
      }
    }
    const villaId = searchParams.get("bookVilla")?.trim();
    if (!villaId) return;
    const date = searchParams.get("date")?.trim() || undefined;
    const service = searchParams.get("service")?.trim() || undefined;
    const preferred =
      data.contacts.find(
        (c) =>
          c.linked_profile_id &&
          /clean|housekeep|turnover/i.test(c.role ?? ""),
      ) ?? data.contacts.find((c) => Boolean(c.linked_profile_id));
    if (!preferred) return;
    setOrderPrefill({ villaId, date, service });
    setOrdering(preferred);
  }, [data.ready, data.contacts, canBook, ordering, searchParams]);

  const reviewedThisWeek = useMemo(() => {
    if (!data.profile) return new Set<string>();
    return new Set(
      data.endorsements
        .filter(
          (e) =>
            e.org_id === data.profile!.org_id &&
            e.from_profile_id === data.profile!.id &&
            e.week_key === currentWeek,
        )
        .map((e) => e.to_profile_id),
    );
  }, [data.endorsements, data.profile, currentWeek]);

  const grouped = useMemo(() => {
    const map = new Map<string, Contact[]>();
    for (const c of data.contacts) {
      const list = map.get(c.role) ?? [];
      list.push(c);
      map.set(c.role, list);
    }
    const roles = [
      ...ROLE_ORDER.filter((r) => map.has(r)),
      ...[...map.keys()].filter((r) => !ROLE_ORDER.includes(r)).sort(),
    ];
    return roles.map((role) => ({ role, contacts: map.get(role)! }));
  }, [data.contacts]);

  const linkableProfiles = useMemo(
    () =>
      data.profiles.filter(
        (p) => p.role === "cleaner" || p.role === "staff" || p.role === "manager",
      ),
    [data.profiles],
  );

  if (!data.ready) return <LoadingState />;

  if (staff) {
    return (
      <div className="space-y-4 animate-rise">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">
            {t("contacts.title")}
          </h1>
          <p className="text-sm text-muted">{t("contacts.subtitleStaff")}</p>
        </div>
        <EmptyState
          title={t("contacts.fieldApp")}
          description={t("contacts.fieldAppHint")}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-rise">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="type-title">
            {t("contacts.title")}
          </h1>
          <p className="type-meta mt-1">
            {isPersonal
              ? t("contacts.subtitlePersonal")
              : t("contacts.subtitleCompany")}
          </p>
        </div>
        {canEdit ? (
          <Button size="xs" className="shrink-0" onClick={() => setCreating(true)}>
            <Plus className="size-3.5" strokeWidth={2.4} /> {t("common.addNew")}
          </Button>
        ) : null}
      </div>

      {showTalentBrowse ? (
        <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="font-display text-sm font-bold text-ink">
              {t("talent.title")}
            </p>
            <p className="text-xs text-muted">{t("talent.subtitle")}</p>
          </div>
          <Link href="/talent" className="shrink-0 self-stretch sm:self-auto">
            <Button
              size="sm"
              variant="secondary"
              className="w-full min-w-[10.5rem] px-5 sm:w-auto"
            >
              <PulseIcon name="search" className="size-4" surface="inverse" />
              {t("talent.browseLink")}
            </Button>
          </Link>
        </Card>
      ) : null}

      {ordering && canBook && ordering.linked_profile_id ? (
        <OrderForm
          contact={ordering}
          prefill={orderPrefill}
          villas={data.villas}
          onCancel={() => {
            setOrdering(null);
            setOrderPrefill(null);
          }}
          onSave={async (values) => {
            await data.createServiceOrder({
              contact_id: ordering.id,
              ...values,
            });
            setOrdering(null);
            setOrderPrefill(null);
          }}
        />
      ) : null}

      {reviewing && canReview && reviewing.linked_profile_id ? (
        <ReviewForm
          contact={reviewing}
          alreadyDone={reviewedThisWeek.has(reviewing.linked_profile_id)}
          onCancel={() => setReviewing(null)}
          onSave={async (stars, note) => {
            await data.castEndorsement(
              reviewing.linked_profile_id!,
              stars,
              note,
            );
            setReviewing(null);
          }}
        />
      ) : null}

      {(creating || editing) && canEdit ? (
        <ContactForm
          initial={editing}
          linkableProfiles={isPersonal ? [] : linkableProfiles}
          allowAppLink={!isPersonal}
          onCancel={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSave={async (values) => {
            if (editing) {
              await data.updateContact(editing.id, values);
            } else {
              await data.createContact(values);
            }
            setCreating(false);
            setEditing(null);
          }}
        />
      ) : null}

      {grouped.length === 0 ? (
        <EmptyState
          title={t("contacts.empty")}
          description={
            isPersonal
              ? t("contacts.emptyHint.personal")
              : t("contacts.emptyHint")
          }
        />
      ) : (
        grouped.map((group) => (
          <section key={group.role} className="space-y-2">
            <h2 className="text-sm font-semibold capitalize text-muted">
              {group.role}
            </h2>
            {group.contacts.map((contact) => {
              const reach = contactReachability(
                contact,
                data.serviceOrders,
                contact.id,
              );
              return (
                <Card key={contact.id} className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-ink">{contact.name}</p>
                      {contact.notes ? (
                        <p className="text-xs text-muted">{contact.notes}</p>
                      ) : null}
                      {!isPersonal ? (
                        <p
                          className={cn(
                            "mt-1 text-[11px] font-bold uppercase tracking-wide",
                            reach === "awaiting_ack"
                              ? "text-warning-dark"
                              : reach === "not_on_app"
                                ? "text-muted"
                                : "text-secondary",
                          )}
                        >
                          {reach === "awaiting_ack"
                            ? t("contacts.reach.awaiting")
                            : reach === "not_on_app"
                              ? t("contacts.reach.offline")
                              : t("contacts.reach.ok")}
                        </p>
                      ) : contact.phone ? (
                        <p className="mt-1 text-xs text-muted">{contact.phone}</p>
                      ) : null}
                    </div>
                    {canEdit ? (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          className="rounded-lg p-2 text-muted transition hover:bg-sand active:scale-[0.96]"
                          onClick={() => setEditing(contact)}
                          aria-label="Edit"
                        >
                          <PulseIcon name="edit" className="size-4" />
                        </button>
                        <button
                          type="button"
                          className="rounded-lg p-2 text-danger transition hover:bg-sand active:scale-[0.96]"
                          onClick={() => setDeleting(contact)}
                          aria-label={t("common.delete")}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    ) : null}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {canBook && contact.linked_profile_id ? (
                      <button
                        type="button"
                        onClick={() => {
                          setReviewing(null);
                          setOrdering(contact);
                        }}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-pill)] bg-sky px-3 py-2.5 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(33,158,188,0.28)] transition hover:brightness-95 active:scale-[0.98]"
                      >
                        <PulseIcon name="order" className="size-4" surface="inverse" />{" "}
                        {t("contacts.order")}
                      </button>
                    ) : null}
                    {canReview && contact.linked_profile_id ? (
                      <button
                        type="button"
                        onClick={() => {
                          setOrdering(null);
                          setReviewing(contact);
                        }}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-pill)] bg-primary px-3 py-2.5 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(242,106,54,0.28)] transition hover:bg-primary-dark active:scale-[0.98]"
                      >
                        <PulseIcon name="star" className="size-4" surface="inverse" />
                        {reviewedThisWeek.has(contact.linked_profile_id)
                          ? t("contacts.reviewDone")
                          : t("contacts.review")}
                      </button>
                    ) : null}
                    {contact.phone ? (
                      <a
                        href={`tel:${contact.phone}`}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-card px-3 py-2.5 text-sm font-semibold text-ink shadow-[var(--shadow-soft)] transition hover:bg-sand active:scale-[0.98]"
                      >
                        <Phone className="size-4" /> Call
                      </a>
                    ) : null}
                    {!isPersonal
                      ? contactMessengers(contact).map((m) => {
                          if (m.kind === "whatsapp" && contact.phone) {
                            return (
                              <a
                                key={m.kind}
                                href={phoneToWaMe(contact.phone)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-canvas-deep px-3 py-2 text-sm font-semibold text-ink"
                              >
                                <MessageCircle className="size-4" /> WhatsApp
                              </a>
                            );
                          }
                          if (m.kind === "line" && m.handle) {
                            return (
                              <a
                                key={m.kind}
                                href={lineDeepLink(m.handle)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-canvas-deep px-3 py-2 text-sm font-semibold text-ink"
                              >
                                <MessageCircle className="size-4" /> LINE
                              </a>
                            );
                          }
                          if (m.kind === "telegram" && m.handle) {
                            return (
                              <a
                                key={m.kind}
                                href={telegramDeepLink(m.handle)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-canvas-deep px-3 py-2 text-sm font-semibold text-ink"
                              >
                                <MessageCircle className="size-4" /> Telegram
                              </a>
                            );
                          }
                          return null;
                        })
                      : null}
                  </div>
                </Card>
              );
            })}
          </section>
        ))
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title={t("contacts.deleteTitle")}
        description={
          deleting
            ? t("contacts.deleteHint", { name: deleting.name })
            : undefined
        }
        confirmLabel={t("contacts.deleteConfirm")}
        busy={deleteBusy}
        onConfirm={() => {
          if (!deleting) return;
          setDeleteBusy(true);
          void data
            .deleteContact(deleting.id)
            .then(() => setDeleting(null))
            .catch(() => undefined)
            .finally(() => setDeleteBusy(false));
        }}
        onClose={() => {
          if (!deleteBusy) setDeleting(null);
        }}
      />
    </div>
  );
}

function ReviewForm({
  contact,
  alreadyDone,
  onCancel,
  onSave,
}: {
  contact: Contact;
  alreadyDone: boolean;
  onCancel: () => void;
  onSave: (stars: 1 | 2 | 3 | 4 | 5, note: string) => Promise<void>;
}) {
  const { t } = useI18n();
  const [stars, setStars] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  return (
    <Card className="space-y-3 p-4">
      <div>
        <h2 className="text-lg font-bold text-ink">
          {t("contacts.reviewTitle", { name: contact.name })}
        </h2>
        <p className="text-sm text-muted">{t("contacts.reviewHint")}</p>
      </div>
      {alreadyDone ? (
        <p className="text-sm font-semibold text-secondary">
          {t("contacts.reviewDone")}
        </p>
      ) : (
        <>
          <StarsPicker value={stars} onChange={setStars} />
          <div>
            <Label>{t("contacts.reviewNote")}</Label>
            <Textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("contacts.reviewNotePlaceholder")}
            />
          </div>
        </>
      )}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {ok ? <p className="text-sm font-semibold text-secondary">{ok}</p> : null}
      <div className="flex gap-2">
        <Button variant="ghost" className="flex-1" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
        {!alreadyDone ? (
          <Button
            className="flex-1"
            busy={saving}
            onClick={() => {
              setSaving(true);
              setError(null);
              void onSave(stars, note)
                .then(() => setOk(t("contacts.reviewSaved")))
                .catch((e: unknown) =>
                  setError(
                    e instanceof Error ? e.message : t("common.error"),
                  ),
                )
                .finally(() => setSaving(false));
            }}
          >
            {saving
              ? t("common.loading")
              : t("contacts.reviewSubmit", { stars })}
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

function OrderForm({
  contact,
  villas,
  prefill,
  onCancel,
  onSave,
}: {
  contact: Contact;
  villas: { id: string; name: string }[];
  prefill?: { villaId?: string; date?: string; service?: string } | null;
  onCancel: () => void;
  onSave: (values: {
    villa_id: string | null;
    service_type: string;
    details?: string | null;
    scheduled_date?: string | null;
    time_start?: string | null;
    time_end?: string | null;
    schedule_mode?: "window" | "slots";
    time_slots?: string[] | null;
    recurrence?: "once" | "daily" | "weekdays";
    recurrence_count?: number | null;
    priority?: TaskPriority;
    photo_url?: string | null;
  }) => Promise<void>;
}) {
  const { t } = useI18n();
  const data = useData();
  const label = useLocalizedDemoText();
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(() =>
    capitalizeLabel(prefill?.service?.trim() || label(contact.role)),
  );
  const [villaId, setVillaId] = useState(
    prefill?.villaId && villas.some((v) => v.id === prefill.villaId)
      ? prefill.villaId
      : "",
  );
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [schedule, setSchedule] = useState(() =>
    emptyWorkSchedule(
      prefill?.date
        ? { date: prefill.date, endDate: prefill.date }
        : undefined,
    ),
  );
  const [notes, setNotes] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const onPickPhoto = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await data.uploadChatAttachment(file);
      if (!url) throw new Error(t("common.error"));
      setPhotoUrl(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="space-y-3 p-4">
      <div>
        <h2 className="text-lg font-bold text-ink">
          {t("contacts.orderTitle", { name: contact.name })}
        </h2>
        <p className="text-sm text-muted">{t("contacts.orderHint")}</p>
      </div>
      <div>
        <Label>{t("tasks.titleField")}</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => setTitle((v) => capitalizeLabel(v))}
          placeholder={t("tasks.titlePlaceholder")}
        />
      </div>
      <div>
        <Label>{t("tasks.villa")}</Label>
        <Select value={villaId} onChange={(e) => setVillaId(e.target.value)}>
          <option value="">{t("common.general")}</option>
          {villas.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label>{t("tasks.priority")}</Label>
        <Select
          value={priority}
          onChange={(e) => setPriority(e.target.value as TaskPriority)}
        >
          <option value="normal">{t("tasks.priority.normal")}</option>
          <option value="urgent">{t("tasks.priority.urgent")}</option>
        </Select>
      </div>
      <WorkScheduleFields value={schedule} onChange={setSchedule} />
      <div>
        <Label>{t("tasks.assignee")}</Label>
        <Input value={contact.name} disabled readOnly />
      </div>
      <div>
        <Label>
          {t("common.notes")}{" "}
          <span className="font-normal text-muted">
            ({t("common.optional")})
          </span>
        </Label>
        <Textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t("tasks.notesPlaceholder")}
        />
      </div>
      <div>
        <Label>
          {t("tasks.examplePhoto")}{" "}
          <span className="font-normal text-muted">
            ({t("common.optional")})
          </span>
        </Label>
        {t("tasks.examplePhotoHint") ? (
          <p className="mb-2 text-xs text-muted">{t("tasks.examplePhotoHint")}</p>
        ) : null}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void onPickPhoto(e.target.files?.[0] ?? null)}
        />
        {photoUrl ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl}
              alt=""
              className="size-16 rounded-xl object-cover"
            />
            <button
              type="button"
              className="text-xs font-semibold text-danger"
              onClick={() => setPhotoUrl(null)}
            >
              {t("common.remove")}
            </button>
          </div>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            <Camera className="size-4" />
            {uploading ? t("common.saving") : t("tasks.addPhoto")}
          </Button>
        )}
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="flex gap-2">
        <Button variant="ghost" className="flex-1" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
        <Button
          className="flex-1"
          busy={saving}
          onClick={() => {
            if (!title.trim()) {
              setError("Title is required.");
              return;
            }
            const resolved = resolveWorkSchedule(schedule);
            setSaving(true);
            void onSave({
              villa_id: villaId || null,
              service_type: capitalizeLabel(title),
              details: notes.trim() || null,
              scheduled_date: resolved.date,
              ...schedulePayloadFromResolved(resolved),
              priority,
              photo_url: photoUrl,
            })
              .catch((e: unknown) => {
                const message =
                  e instanceof Error
                    ? e.message
                    : typeof e === "object" &&
                        e &&
                        "message" in e &&
                        typeof (e as { message: unknown }).message === "string"
                      ? (e as { message: string }).message
                      : "Could not book.";
                setError(message);
              })
              .finally(() => setSaving(false));
          }}
        >
          {saving ? t("common.saving") : t("contacts.sendOrder")}
        </Button>
      </div>
    </Card>
  );
}

function messengerLabel(kind: ContactMessengerKind) {
  if (kind === "whatsapp") return "WhatsApp";
  if (kind === "line") return "LINE";
  return "Telegram";
}

function ContactForm({
  initial,
  linkableProfiles,
  allowAppLink = true,
  onCancel,
  onSave,
}: {
  initial: Contact | null;
  linkableProfiles: { id: string; full_name: string }[];
  allowAppLink?: boolean;
  onCancel: () => void;
  onSave: (values: Omit<Contact, "id" | "org_id">) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [role, setRole] = useState(initial?.role ?? "cleaning");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [messengers, setMessengers] = useState<ContactMessenger[]>(() =>
    initial ? contactMessengers(initial) : [],
  );
  const [draftKind, setDraftKind] = useState<ContactMessengerKind | "">("");
  const [draftHandle, setDraftHandle] = useState("");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [linkedId, setLinkedId] = useState(initial?.linked_profile_id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const availableKinds = CONTACT_MESSENGER_KINDS.filter(
    (k) => !messengers.some((m) => m.kind === k),
  );

  function addMessenger() {
    if (!draftKind) return;
    if (messengerNeedsHandle(draftKind) && !draftHandle.trim()) {
      setError(
        draftKind === "telegram"
          ? "Telegram needs a username."
          : "LINE needs an ID.",
      );
      return;
    }
    setError(null);
    setMessengers((prev) => [
      ...prev,
      {
        kind: draftKind,
        handle: messengerNeedsHandle(draftKind)
          ? draftHandle.trim() || null
          : null,
      },
    ]);
    setDraftKind("");
    setDraftHandle("");
  }

  return (
    <Card className="space-y-3 p-4">
      {allowAppLink ? (
        <div>
          <Label>PulseFlow user (for in-app booking)</Label>
          <Select
            value={linkedId}
            onChange={(e) => {
              const nextId = e.target.value;
              setLinkedId(nextId);
              if (!nextId) return;
              const picked = linkableProfiles.find((p) => p.id === nextId);
              if (picked) setName(picked.full_name);
            }}
          >
            <option value="">Not on app - phone only</option>
            {linkableProfiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </Select>
        </div>
      ) : null}
      <div>
        <Label>Name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setName((v) => capitalizeLabel(v))}
        />
      </div>
      <div>
        <Label>Role</Label>
        <Select value={role} onChange={(e) => setRole(e.target.value)}>
          {ROLE_ORDER.map((r) => (
            <option key={r} value={r}>
              {capitalizeLabel(r)}
            </option>
          ))}
          <option value="other">{capitalizeLabel("other")}</option>
        </Select>
      </div>
      <div>
        <Label>Phone</Label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      {allowAppLink ? (
        <div className="space-y-2">
          <Label>Messengers</Label>
          {messengers.length > 0 ? (
            <ul className="space-y-1.5">
              {messengers.map((m) => (
                <li
                  key={m.kind}
                  className="flex items-center justify-between gap-2 rounded-xl bg-canvas-deep px-3 py-2 text-sm"
                >
                  <span className="font-semibold text-ink">
                    {messengerLabel(m.kind)}
                    {m.handle ? (
                      <span className="font-normal text-muted">
                        {" "}
                        · @{m.handle.replace(/^@/, "")}
                      </span>
                    ) : null}
                  </span>
                  <button
                    type="button"
                    className="rounded-lg p-1 text-muted hover:bg-white hover:text-danger"
                    aria-label={`Remove ${messengerLabel(m.kind)}`}
                    onClick={() =>
                      setMessengers((prev) =>
                        prev.filter((x) => x.kind !== m.kind),
                      )
                    }
                  >
                    <X className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted">Add contacts below</p>
          )}
          {availableKinds.length > 0 ? (
            <div className="space-y-2 rounded-xl border border-black/5 p-3">
              <Select
                value={draftKind}
                onChange={(e) => {
                  const next = e.target.value as ContactMessengerKind | "";
                  setDraftKind(next);
                  setDraftHandle("");
                  setError(null);
                }}
              >
                <option value="">Add contact…</option>
                {availableKinds.map((k) => (
                  <option key={k} value={k}>
                    {messengerLabel(k)}
                  </option>
                ))}
              </Select>
              {draftKind === "telegram" ? (
                <div>
                  <Label>Telegram username</Label>
                  <Input
                    value={draftHandle}
                    placeholder="@username"
                    onChange={(e) => setDraftHandle(e.target.value)}
                  />
                </div>
              ) : null}
              {draftKind === "line" ? (
                <div>
                  <Label>LINE ID</Label>
                  <Input
                    value={draftHandle}
                    placeholder="line.id"
                    onChange={(e) => setDraftHandle(e.target.value)}
                  />
                </div>
              ) : null}
              {draftKind === "whatsapp" ? (
                <p className="text-xs text-muted">
                  WhatsApp uses the phone number above.
                </p>
              ) : null}
              {draftKind ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={addMessenger}
                >
                  <Plus className="size-4" /> Add {messengerLabel(draftKind)}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
      <div>
        <Label>Notes</Label>
        <Textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="flex gap-2">
        <Button variant="ghost" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          className="flex-1"
          busy={saving}
          onClick={() => {
            if (!name.trim()) {
              setError("Name is required.");
              return;
            }
            if (
              allowAppLink &&
              messengers.some((m) => m.kind === "whatsapp") &&
              !phone.trim()
            ) {
              setError("Add a phone number for WhatsApp.");
              return;
            }
            setSaving(true);
            const synced = allowAppLink
              ? syncContactMessengerFields(messengers)
              : syncContactMessengerFields([]);
            void onSave({
              name: capitalizeLabel(name),
              role,
              phone: phone || null,
              ...synced,
              notes: notes || null,
              linked_profile_id: allowAppLink ? linkedId || null : null,
            }).finally(() => setSaving(false));
          }}
        >
          Save
        </Button>
      </div>
    </Card>
  );
}

