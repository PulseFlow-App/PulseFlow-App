"use client";

import { useMemo, useState } from "react";
import {
  Phone,
  MessageCircle,
  Plus,
  Pencil,
  Trash2,
  CalendarPlus,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { EmptyState, LoadingState } from "@/components/ui/empty-state";
import { useData } from "@/lib/data/use-app-data";
import { contactReachability } from "@/lib/notifications";
import { canBookServices, canEditContacts, isStaffApp } from "@/lib/roles";
import { cn, lineDeepLink, phoneToWaMe } from "@/lib/utils";
import type { Contact } from "@/lib/types";
import type { Messenger } from "@/lib/design-tokens";

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
  const canEdit = data.profile ? canEditContacts(data.profile.role) : false;
  const canBook = data.profile ? canBookServices(data.profile.role) : false;
  const staff = data.profile ? isStaffApp(data.profile.role) : false;
  const [editing, setEditing] = useState<Contact | null>(null);
  const [creating, setCreating] = useState(false);
  const [ordering, setOrdering] = useState<Contact | null>(null);

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
          <h1 className="font-display text-2xl font-bold text-ink">Contacts</h1>
          <p className="text-sm text-muted">
            Team directory - owners book you from their Contacts list
          </p>
        </div>
        <EmptyState
          title="Field app"
          description="Your jobs live under Jobs. Call teammates from Chat if needed."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-rise">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Contacts</h1>
          <p className="text-sm text-muted">
            Vendors & island team - Order books them in-app
          </p>
        </div>
        {canEdit ? (
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="size-4" /> Add
          </Button>
        ) : null}
      </div>

      {ordering && canBook ? (
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

      {(creating || editing) && canEdit ? (
        <ContactForm
          initial={editing}
          linkableProfiles={linkableProfiles}
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
          description="Add cleaning, plumbing, and other vendors."
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
                    {canBook ? (
                      <button
                        type="button"
                        onClick={() => setOrdering(contact)}
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-primary/10 px-3 py-2 text-sm font-semibold text-primary"
                      >
                        <CalendarPlus className="size-4" /> Order
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
                    {contact.messenger === "whatsapp" && contact.phone ? (
                      <a
                        href={phoneToWaMe(contact.phone)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-[#F7F5F1] px-3 py-2 text-sm font-semibold text-ink"
                      >
                        <MessageCircle className="size-4" /> WhatsApp
                      </a>
                    ) : null}
                    {contact.messenger === "line" &&
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
  const [serviceType, setServiceType] = useState(contact.role);
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
            placeholder="Address or villa name"
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
              setError("Pick a villa or enter a location.");
              return;
            }
            setSaving(true);
            void onSave({
              villa_id: villaId || null,
              location_label: locationLabel.trim() || null,
              service_type: serviceType.trim(),
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
  onCancel,
  onSave,
}: {
  initial: Contact | null;
  linkableProfiles: { id: string; full_name: string }[];
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
      <div>
        <Label>Phone</Label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
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
              messenger,
              messenger_handle: handle || null,
              notes: notes || null,
              linked_profile_id: linkedId || null,
            }).finally(() => setSaving(false));
          }}
        >
          Save
        </Button>
      </div>
    </Card>
  );
}
