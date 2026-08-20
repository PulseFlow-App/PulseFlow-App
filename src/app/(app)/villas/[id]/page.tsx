"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/empty-state";
import { VillaPhotoThumb } from "@/components/villas/villa-photo";
import { useData } from "@/lib/data/use-app-data";
import type { CleaningStatus, VillaStatus } from "@/lib/design-tokens";
import { ROLE_LABELS, canEditVillaCore, isStaffApp } from "@/lib/roles";
import { isValidLocationUrl, normalizeLocationUrl } from "@/lib/utils";
import { formatWorkWindow } from "@/lib/notifications";
import { formatOrderWhen } from "@/lib/service-orders";

export default function VillaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const data = useData();
  const villaItem = data.villaList.find((v) => v.id === id);
  const villa =
    villaItem ??
    data.villas.find((v) => v.id === id) ??
    data.allOrgVillas.find((v) => v.id === id);
  const isOwner = data.profile?.role === "owner";
  const staff = data.profile ? isStaffApp(data.profile.role) : false;
  const canEditCore = data.profile
    ? canEditVillaCore(data.profile.role)
    : false;
  const villaJobs = data.serviceOrders.filter(
    (o) =>
      o.villa_id === id &&
      o.status !== "cancelled" &&
      (!staff || o.staff_profile_id === data.profile?.id),
  );
  const villaTasks = data.tasks.filter(
    (t) =>
      t.villa_id === id &&
      t.status === "open" &&
      (!staff || t.assigned_to === data.profile?.id),
  );
  const isPersonal =
    villaItem?.bucket === "personal" ||
    (data.profile?.personal_org_id != null &&
      villa?.org_id === data.profile.personal_org_id &&
      data.profile.org_id !== data.profile.personal_org_id);
  const canMerge =
    Boolean(isPersonal) &&
    data.orgKind === "company" &&
    data.profile?.role !== "owner";

  const [status, setStatus] = useState<VillaStatus>("available");
  const [cleaning, setCleaning] = useState<CleaningStatus>("not_needed");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [notes, setNotes] = useState("");
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [locationUrl, setLocationUrl] = useState("");
  const [description, setDescription] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const team = useMemo(
    () => data.profiles.filter((p) => p.role !== "owner"),
    [data.profiles],
  );

  const storedAssigneeKey = useMemo(() => {
    if (!villa) return "";
    return data.villaAssignments
      .filter((a) => a.villa_id === villa.id)
      .map((a) => a.profile_id)
      .sort()
      .join(",");
  }, [villa?.id, data.villaAssignments]);

  useEffect(() => {
    if (!villa) return;
    setStatus(villa.status);
    setCleaning(villa.cleaning_status);
    setCheckIn(villa.check_in ?? "");
    setCheckOut(villa.check_out ?? "");
    setNotes(villa.notes ?? "");
    setName(villa.name);
    setArea(villa.area ?? "");
    setLocationUrl(villa.location_url ?? "");
    setDescription(villa.description ?? "");
    setPhotoUrl(villa.photo_url ?? null);
    // Only hydrate when opening a villa — re-syncing on every server refresh
    // would wipe a just-uploaded photo before Save.
  }, [villa?.id]);

  useEffect(() => {
    if (!villa?.id) return;
    setAssigneeIds(storedAssigneeKey ? storedAssigneeKey.split(",") : []);
  }, [villa?.id, storedAssigneeKey]);

  if (!data.ready) return <LoadingState />;
  if (!villa) {
    return (
      <div className="space-y-3">
        <Link href="/villas" className="text-sm font-semibold text-primary">
          ← Back to villas
        </Link>
        <p className="text-muted">Villa not found.</p>
      </div>
    );
  }

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      if (!isValidLocationUrl(locationUrl)) {
        setError("Add a valid location / maps link.");
        setSaving(false);
        return;
      }
      await data.updateVilla(villa.id, {
        status,
        cleaning_status: cleaning,
        check_in: checkIn || null,
        check_out: checkOut || null,
        notes: notes || null,
        location_url: normalizeLocationUrl(locationUrl),
        description: description.trim() || null,
        photo_url: photoUrl,
        ...(canEditCore ? { name, area: area || null } : {}),
      });
      if (isOwner && !isPersonal) {
        await data.setVillaAssignees(villa.id, assigneeIds);
      }
      router.push("/villas");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 animate-rise">
      <Link
        href="/villas"
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted"
      >
        <ArrowLeft className="size-4" /> Villas
      </Link>

      <Card className="space-y-4 p-5">
        {villa.photo_url || canEditCore ? (
          <div className="space-y-2">
            <VillaPhotoThumb src={photoUrl ?? villa.photo_url} alt={villa.name} />
            {canEditCore ? (
              <div>
                <Label>Property photo</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    void data
                      .uploadVillaPhoto(file)
                      .then((url) => setPhotoUrl(url))
                      .catch(() => setError("Could not upload photo."));
                  }}
                />
                <p className="mt-1 text-xs text-muted">
                  Upload from your gallery or take a photo. Employees see this
                  when accepting jobs at this property.
                </p>
                {photoUrl ? (
                  <button
                    type="button"
                    className="mt-1 text-xs font-semibold text-danger"
                    onClick={() => setPhotoUrl(null)}
                  >
                    Remove photo
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {canEditCore ? (
          <>
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Area</Label>
              <Input value={area} onChange={(e) => setArea(e.target.value)} />
            </div>
            <div>
              <Label>Location link</Label>
              <Input
                value={locationUrl}
                onChange={(e) => setLocationUrl(e.target.value)}
                placeholder="https://maps.google.com/?q=..."
                inputMode="url"
              />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </>
        ) : (
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">
              {villa.name}
            </h1>
            <p className="text-sm text-muted">{villa.area}</p>
            {villa.description ? (
              <p className="mt-2 text-sm text-muted">{villa.description}</p>
            ) : null}
            {villa.location_url ? (
              <a
                href={normalizeLocationUrl(villa.location_url)}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
              >
                <ExternalLink className="size-3.5" />
                Open location
              </a>
            ) : null}
            <div className="mt-4 space-y-3">
              <div>
                <Label>Location link</Label>
                <Input
                  value={locationUrl}
                  onChange={(e) => setLocationUrl(e.target.value)}
                  inputMode="url"
                />
              </div>
              <div>
                <Label>Description (optional)</Label>
                <Textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {villaItem && data.orgKind === "company" ? (
          <div className="rounded-2xl bg-[#F7F5F1] px-3 py-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Belongs to
            </p>
            <p className="mt-0.5 font-semibold text-ink">{villaItem.orgLabel}</p>
            {isPersonal ? (
              <p className="mt-1 text-xs text-muted">
                Personal / side work. To put this on another company&apos;s
                books, that owner must register on PulseFlow and invite you -
                then merge it below.
              </p>
            ) : null}
          </div>
        ) : null}

        {canMerge ? (
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              void data
                .mergeVillaToCompany(villa.id)
                .then(() => setSaved(true))
                .catch((e: unknown) =>
                  setError(e instanceof Error ? e.message : "Could not merge."),
                );
            }}
          >
            Merge into {data.orgName}
          </Button>
        ) : null}

        {isOwner && !isPersonal && data.orgKind === "company" ? (
          <div>
            <Label>Assigned to</Label>
            <p className="mb-2 text-xs text-muted">
              Who can see and update this villa
            </p>
            <ul className="space-y-2">
              {team.map((person) => {
                const checked = assigneeIds.includes(person.id);
                return (
                  <li key={person.id}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-[#F7F5F1] px-3 py-2.5 text-sm">
                      <input
                        type="checkbox"
                        className="size-5 shrink-0 accent-primary"
                        checked={checked}
                        onChange={() => {
                          setAssigneeIds((prev) =>
                            checked
                              ? prev.filter((x) => x !== person.id)
                              : [...prev, person.id],
                          );
                        }}
                      />
                      <span className="font-semibold text-ink">
                        {person.full_name}
                      </span>
                      <span className="text-muted">
                        {ROLE_LABELS[person.role]}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
            {team.length === 0 ? (
              <p className="text-sm text-muted">
                Invite a manager or staff member first.
              </p>
            ) : null}
          </div>
        ) : null}

        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as VillaStatus)}
          >
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="turnover">Turnover</option>
            <option value="maintenance">Maintenance</option>
          </Select>
        </div>

        {staff ? (
          <div className="space-y-2 rounded-2xl bg-[#F7F5F1] px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Your jobs here
            </p>
            {villaJobs.length === 0 && villaTasks.length === 0 ? (
              <p className="text-sm text-muted">No open jobs for this villa.</p>
            ) : null}
            {villaJobs.map((o) => (
              <p key={o.id} className="text-sm font-semibold text-ink">
                {o.service_type} · {formatOrderWhen(o)}
              </p>
            ))}
            {villaTasks.map((t) => (
              <p key={t.id} className="text-sm text-ink">
                {t.title}
                {formatWorkWindow(t.due_date, t.time_start, t.time_end)
                  ? ` · ${formatWorkWindow(t.due_date, t.time_start, t.time_end)}`
                  : ""}
              </p>
            ))}
            <p className="text-xs text-muted">
              Guest check-in/out is for owners - you only need your work window.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="check_in">Check-in</Label>
              <Input
                id="check_in"
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="check_out">Check-out</Label>
              <Input
                id="check_out"
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
              />
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="cleaning">Cleaning</Label>
          <Select
            id="cleaning"
            value={cleaning}
            onChange={(e) => setCleaning(e.target.value as CleaningStatus)}
          >
            <option value="not_needed">Not needed</option>
            <option value="in_progress">In progress</option>
            <option value="done">Done</option>
          </Select>
        </div>

        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {saved ? (
          <p className="text-sm font-semibold text-secondary">Saved.</p>
        ) : null}

        <Button onClick={() => void save()} disabled={saving} className="w-full">
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </Card>
    </div>
  );
}
