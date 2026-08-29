"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Phone,
  MessageCircle,
  Plus,
  Pencil,
  Trash2,
  CalendarPlus,
  Star,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { EmptyState, LoadingState } from "@/components/ui/empty-state";
import { StarsPicker } from "@/components/endorsements/stars";
import { useData } from "@/lib/data/use-app-data";
import { contactReachability } from "@/lib/notifications";
import { weekKey } from "@/lib/endorsements";
import {
  canBookServices,
  canBrowseTalent,
  canCastEndorsement,
  canEditContacts,
  isStaffApp,
} from "@/lib/roles";
import { cn, lineDeepLink, phoneToWaMe } from "@/lib/utils";
import type { Contact } from "@/lib/types";
import { capitalizeLabel } from "@/lib/format-label";
import type { Messenger } from "@/lib/design-tokens";
import { useI18n } from "@/lib/i18n/provider";
import { useLocalizedDemoText } from "@/lib/demo/use-localized-demo-text";

const ROLE_ORDER = [
  "cleaning",
  "plumbing",
  "electrical",
  "pool",
  "garden",
  "AC/appliance repair",
];

export default function ContactsPage() {
  const data = useData();
  const { t } = useI18n();
  const label = useLocalizedDemoText();
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
  const [editing, setEditing] = useState<Contact | null>(null);
  const [creating, setCreating] = useState(false);
  const [ordering, setOrdering] = useState<Contact | null>(null);
  const [reviewing, setReviewing] = useState<Contact | null>(null);
  const currentWeek = weekKey();

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
          <h1 className="font-display text-2xl font-bold text-ink">
            {t("contacts.title")}
          </h1>
          <p className="text-sm text-muted">
            {isPersonal
              ? t("contacts.subtitlePersonal")
              : t("contacts.subtitleCompany")}
          </p>
        </div>
        {canEdit ? (
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="size-4" /> {t("common.add")}
          </Button>
        ) : null}
      </div>

      {showTalentBrowse ? (
        <Card className="flex items-center justify-between gap-3 p-4">
          <div>
            <p className="font-display text-sm font-bold text-ink">
              {t("talent.title")}
            </p>
            <p className="text-xs text-muted">{t("talent.subtitle")}</p>
          </div>
          <Link href="/talent">
            <Button size="sm" variant="secondary">
              {t("talent.browseLink")}
            </Button>
          </Link>
        </Card>
      ) : null}

      {ordering && canBook && ordering.linked_profile_id ? (
        <OrderForm
          contact={ordering}
          villas={data.villas}
          onCancel={() => setOrdering(null)}
          onSave={async (values) => {
            await data.createServiceOrder({
              contact_id: ordering.id,
              ...values,
            });
            setOrdering(null);
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
          title="No contacts"
          description={
            isPersonal
              ? "Add cleaners, plumbers, and other numbers you use often."
              : "Add cleaning, plumbing, and other vendors."
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
                            ? "Not contacted - awaiting Read & agreed"
                            : reach === "not_on_app"
                              ? "Not on app - call to reach"
                              : "Reachable in app"}
                        </p>
                      ) : contact.phone ? (
                        <p className="mt-1 text-xs text-muted">{contact.phone}</p>
                      ) : null}
                    </div>
                    {canEdit ? (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          className="rounded-lg p-2 text-muted hover:bg-sand"
                          onClick={() => setEditing(contact)}
                          aria-label="Edit"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          className="rounded-lg p-2 text-danger hover:bg-sand"
                          onClick={() => void data.deleteContact(contact.id)}
                          aria-label="Delete"
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
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-primary/10 px-3 py-2 text-sm font-semibold text-primary"
                      >
                        <CalendarPlus className="size-4" /> {t("contacts.order")}
                      </button>
                    ) : null}
                    {canReview && contact.linked_profile_id ? (
                      <button
                        type="button"
                        onClick={() => {
                          setOrdering(null);
                          setReviewing(contact);
                        }}
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-primary-soft px-3 py-2 text-sm font-semibold text-primary"
                      >
                        <Star className="size-4" />
                        {reviewedThisWeek.has(contact.linked_profile_id)
                          ? t("contacts.reviewDone")
                          : t("contacts.review")}
                      </button>
                    ) : null}
                    {contact.phone ? (
                      <a
                        href={`tel:${contact.phone}`}
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-secondary/10 px-3 py-2 text-sm font-semibold text-secondary"
                      >
                        <Phone className="size-4" /> Call
                      </a>
                    ) : null}
                    {!isPersonal &&
                    contact.messenger === "whatsapp" &&
                    contact.phone ? (
                      <a
                        href={phoneToWaMe(contact.phone)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-[#F7F5F1] px-3 py-2 text-sm font-semibold text-ink"
                      >
                        <MessageCircle className="size-4" /> WhatsApp
                      </a>
                    ) : null}
                    {!isPersonal &&
                    contact.messenger === "line" &&
                    contact.messenger_handle ? (
                      <a
                        href={lineDeepLink(contact.messenger_handle)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-[#F7F5F1] px-3 py-2 text-sm font-semibold text-ink"
                      >
                        <MessageCircle className="size-4" /> LINE
                      </a>
                    ) : null}
                  </div>
                </Card>
              );
            })}
          </section>
        ))
      )}
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
            disabled={saving}
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
  onCancel,
  onSave,
}: {
  contact: Contact;
  villas: { id: string; name: string }[];
  onCancel: () => void;
  onSave: (values: {
    villa_id: string | null;
    location_label?: string | null;
    service_type: string;
    details?: string | null;
    scheduled_date: string;
    time_start?: string | null;
    time_end?: string | null;
  }) => Promise<void>;
}) {
  const { t } = useI18n();
  const label = useLocalizedDemoText();
  const [serviceType, setServiceType] = useState(
    label(contact.role),
  );
  const [villaId, setVillaId] = useState(villas[0]?.id ?? "");
  const [locationLabel, setLocationLabel] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [timeStart, setTimeStart] = useState("09:00");
  const [timeEnd, setTimeEnd] = useState("12:00");
  const [details, setDetails] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  return (
    <Card className="space-y-3 p-4">
      <div>
        <h2 className="text-lg font-bold text-ink">Order {contact.name}</h2>
        <p className="text-sm text-muted">
          Sends chat + notification. They must tap Read & agreed.
        </p>
      </div>
      <div>
        <Label>For what</Label>
        <Input
          value={serviceType}
          onChange={(e) => setServiceType(e.target.value)}
          placeholder="Turnover clean, AC repair…"
        />
      </div>
      <div>
        <Label>Where (villa)</Label>
        <Select value={villaId} onChange={(e) => setVillaId(e.target.value)}>
          <option value="">Other / custom</option>
          {villas.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </Select>
      </div>
      {!villaId ? (
        <div>
          <Label>Location label</Label>
          <Input
            value={locationLabel}
            onChange={(e) => setLocationLabel(e.target.value)}
            placeholder="Address or property name"
          />
        </div>
      ) : null}
      <div>
        <Label>When (date)</Label>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>From</Label>
          <Input
            type="time"
            value={timeStart}
            onChange={(e) => setTimeStart(e.target.value)}
          />
        </div>
        <div>
          <Label>Until</Label>
          <Input
            type="time"
            value={timeEnd}
            onChange={(e) => setTimeEnd(e.target.value)}
          />
        </div>
      </div>
      <div>
        <Label>Details</Label>
        <Textarea
          rows={2}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="What needs doing?"
        />
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="flex gap-2">
        <Button variant="ghost" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          className="flex-1"
          disabled={saving}
          onClick={() => {
            if (!serviceType.trim() || !date) {
              setError("Service and date are required.");
              return;
            }
            if (!villaId && !locationLabel.trim()) {
              setError("Pick a property or enter a location.");
              return;
            }
            setSaving(true);
            void onSave({
              villa_id: villaId || null,
              location_label: locationLabel.trim() || null,
              service_type: capitalizeLabel(serviceType),
              details: details.trim() || null,
              scheduled_date: date,
              time_start: timeStart || null,
              time_end: timeEnd || null,
            })
              .catch((e: unknown) =>
                setError(e instanceof Error ? e.message : "Could not book."),
              )
              .finally(() => setSaving(false));
          }}
        >
          {saving ? "Sending…" : "Send order"}
        </Button>
      </div>
    </Card>
  );
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
  const [messenger, setMessenger] = useState<Messenger>(
    initial?.messenger ?? "whatsapp",
  );
  const [handle, setHandle] = useState(initial?.messenger_handle ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [linkedId, setLinkedId] = useState(initial?.linked_profile_id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  return (
    <Card className="space-y-3 p-4">
      <div>
        <Label>Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <Label>Role</Label>
        <Select value={role} onChange={(e) => setRole(e.target.value)}>
          {ROLE_ORDER.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
          <option value="other">other</option>
        </Select>
      </div>
      {allowAppLink ? (
        <div>
          <Label>PulseFlow user (for in-app booking)</Label>
          <Select value={linkedId} onChange={(e) => setLinkedId(e.target.value)}>
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
        <Label>Phone</Label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      {allowAppLink ? (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Messenger</Label>
            <Select
              value={messenger}
              onChange={(e) => setMessenger(e.target.value as Messenger)}
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="line">LINE</option>
              <option value="none">None</option>
            </Select>
          </div>
          <div>
            <Label>Handle</Label>
            <Input value={handle} onChange={(e) => setHandle(e.target.value)} />
          </div>
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
          disabled={saving}
          onClick={() => {
            if (!name.trim()) {
              setError("Name is required.");
              return;
            }
            setSaving(true);
            void onSave({
              name: name.trim(),
              role,
              phone: phone || null,
              messenger: allowAppLink ? messenger : "none",
              messenger_handle: allowAppLink ? handle || null : null,
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
