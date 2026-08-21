"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Building2, ExternalLink, MapPin, Plus, UserRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { StatusPill } from "@/components/ui/status-pill";
import { EmptyState, LoadingState } from "@/components/ui/empty-state";
import { VillaPhotoThumb } from "@/components/properties/property-photo";
import { useData } from "@/lib/data/use-app-data";
import {
  formatShortDate,
  isValidLocationUrl,
  normalizeLocationUrl,
} from "@/lib/utils";
import { canCreateVillas, isStaffApp, personalVillasOnly } from "@/lib/roles";
import type { VillaListItem } from "@/lib/types";

export default function VillasPage() {
  const data = useData();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [locationUrl, setLocationUrl] = useState("");
  const [description, setDescription] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [scope, setScope] = useState<"company" | "personal">("personal");
  const [error, setError] = useState<string | null>(null);

  const canAdd = data.profile ? canCreateVillas(data.profile.role) : false;
  const isOwner = data.profile?.role === "owner";
  const staff = data.profile ? isStaffApp(data.profile.role) : false;
  const personalOnly = data.profile
    ? personalVillasOnly(data.profile.role, data.orgKind)
    : false;
  const inCompany = data.orgKind === "company";
  const isPersonalWorkspace = data.orgKind === "personal";

  const companyVillas = useMemo(
    () => data.villaList.filter((v) => v.bucket === "company"),
    [data.villaList],
  );
  const personalVillas = useMemo(
    () => data.villaList.filter((v) => v.bucket === "personal"),
    [data.villaList],
  );

  if (!data.ready) return <LoadingState />;

  const assigneesFor = (villaId: string) =>
    data.villaAssignments
      .filter((a) => a.villa_id === villaId)
      .map((a) => data.profiles.find((p) => p.id === a.profile_id)?.full_name)
      .filter(Boolean) as string[];

  const defaultScope =
    isOwner && inCompany ? "company" : "personal";

  return (
    <div className="relative space-y-4 animate-rise">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Properties</h1>
          <p className="text-sm text-muted">
            {isPersonalWorkspace
              ? "Your properties and rental work"
              : staff
                ? "Assigned company properties + your own personal list"
                : "Company inventory first, then your personal list"}
          </p>
        </div>
        {canAdd ? (
          <Button
            size="sm"
            onClick={() => {
              setScope(defaultScope);
              setShowAdd(true);
            }}
          >
            <Plus className="size-4" /> Add new
          </Button>
        ) : null}
      </div>

      {canAdd ? (
        <Button
          className="w-full"
          size="lg"
          onClick={() => {
            setScope(defaultScope);
            setShowAdd(true);
          }}
        >
          <Plus className="size-5" /> Add new villa
        </Button>
      ) : null}

      {showAdd ? (
        <Card className="space-y-3 p-5">
          <h2 className="font-display text-lg font-bold text-ink">New villa</h2>
          {inCompany && isOwner ? (
            <div>
              <Label>Belongs to</Label>
              <Select
                value={scope}
                onChange={(e) =>
                  setScope(e.target.value as "company" | "personal")
                }
              >
                <option value="company">{data.orgName} (company)</option>
                <option value="personal">No company (personal)</option>
              </Select>
            </div>
          ) : null}
          {inCompany && personalOnly && canAdd ? (
            <p className="rounded-2xl bg-[#F7F5F1] px-3 py-2 text-xs text-muted">
              New villas you add go to <strong>No company</strong> (your own
              list). Company villas appear when the owner assigns them - or when
              they Order you for a job.
            </p>
          ) : null}
          <div>
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Lotus House"
            />
          </div>
          <div>
            <Label>Area</Label>
            <Input
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="Srithanu"
            />
          </div>
          <div>
            <Label>Location link</Label>
            <Input
              value={locationUrl}
              onChange={(e) => setLocationUrl(e.target.value)}
              placeholder="https://maps.google.com/?q=..."
              inputMode="url"
            />
            <p className="mt-1 text-xs text-muted">
              Paste a Google Maps / Apple Maps pin link for the exact spot.
            </p>
          </div>
          <div>
            <Label>Description (optional)</Label>
            <Textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short notes about the property…"
            />
          </div>
          <div>
            <Label>Property photo</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) {
                  setPhotoUrl(null);
                  return;
                }
                void data
                  .uploadVillaPhoto(file)
                  .then((url) => setPhotoUrl(url))
                  .catch(() => setError("Could not upload photo."));
              }}
            />
            <p className="mt-1 text-xs text-muted">
              Upload from your gallery or take a photo. Staff see this when
              accepting a job so they can recognize the place.
            </p>
            {photoUrl ? (
              <VillaPhotoThumb
                src={photoUrl}
                alt="New property preview"
                className="mt-2"
              />
            ) : null}
          </div>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => setShowAdd(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                if (!name.trim()) {
                  setError("Name is required.");
                  return;
                }
                if (!isValidLocationUrl(locationUrl)) {
                  setError("Add a valid location / maps link.");
                  return;
                }
                void data
                  .createVilla({
                    name: name.trim(),
                    area: area.trim() || undefined,
                    location_url: normalizeLocationUrl(locationUrl),
                    description: description.trim() || undefined,
                    photo_url: photoUrl,
                    scope:
                      inCompany && isOwner
                        ? scope
                        : "personal",
                  })
                  .then(() => {
                    setName("");
                    setArea("");
                    setLocationUrl("");
                    setDescription("");
                    setPhotoUrl(null);
                    setShowAdd(false);
                    setError(null);
                  })
                  .catch((e: unknown) =>
                    setError(e instanceof Error ? e.message : "Could not add."),
                  );
              }}
            >
              Save villa
            </Button>
          </div>
        </Card>
      ) : null}

      {data.villaList.length === 0 ? (
        <EmptyState
          title="No properties yet"
          description={
            canAdd
              ? isPersonalWorkspace
                ? "Add your first property to start tracking work."
                : "Add a company property or a personal one you manage on the side."
              : "Ask your owner to assign company properties to you."
          }
        />
      ) : isPersonalWorkspace ? (
        <VillaSection
          title={data.orgName || "Your properties"}
          subtitle="Personal workspace"
          icon="personal"
          villas={data.villaList}
          showAssignees={false}
          assigneesFor={assigneesFor}
          hideBucketBadge
        />
      ) : (
        <>
          {companyVillas.length > 0 ? (
            <VillaSection
              title={companyVillas[0]?.orgLabel ?? data.orgName}
              subtitle="Company-owned"
              icon="company"
              villas={companyVillas}
              showAssignees={isOwner}
              assigneesFor={assigneesFor}
            />
          ) : null}

          {personalVillas.length > 0 ? (
            <VillaSection
              title="No company"
              subtitle="Your personal / side work - not on the company books"
              icon="personal"
              villas={personalVillas}
              showAssignees={false}
              assigneesFor={assigneesFor}
            />
          ) : null}
        </>
      )}

      {canAdd ? (
        <button
          type="button"
          aria-label="Add new property"
          onClick={() => {
            setScope(defaultScope);
            setShowAdd(true);
          }}
          className="fixed bottom-24 right-5 z-40 flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-dark text-white shadow-[0_12px_28px_rgba(240,122,58,0.45)]"
        >
          <Plus className="size-7" strokeWidth={2.5} />
        </button>
      ) : null}
    </div>
  );
}

function VillaSection({
  title,
  subtitle,
  icon,
  villas,
  showAssignees,
  assigneesFor,
  hideBucketBadge = false,
}: {
  title: string;
  subtitle: string;
  icon: "company" | "personal";
  villas: VillaListItem[];
  showAssignees: boolean;
  assigneesFor: (id: string) => string[];
  hideBucketBadge?: boolean;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <span
          className={
            icon === "company"
              ? "flex size-8 items-center justify-center rounded-full bg-secondary-soft text-secondary-dark"
              : "flex size-8 items-center justify-center rounded-full bg-[#F7F5F1] text-muted"
          }
        >
          {icon === "company" ? (
            <Building2 className="size-4" />
          ) : (
            <UserRound className="size-4" />
          )}
        </span>
        <div>
          <h2 className="font-display text-base font-bold text-ink">{title}</h2>
          <p className="text-xs text-muted">{subtitle}</p>
        </div>
      </div>
      <ul className="space-y-3">
        {villas.map((villa) => {
          const assignees = assigneesFor(villa.id);
          return (
            <li key={villa.id}>
              <Link href={`/villas/${villa.id}`}>
                <Card className="overflow-hidden p-0 transition hover:-translate-y-0.5">
                  {villa.photo_url ? (
                    <VillaPhotoThumb
                      src={villa.photo_url}
                      alt={villa.name}
                      className="rounded-none"
                    />
                  ) : null}
                  <div className="p-5">
                  <div className="mb-3 flex flex-wrap gap-2">
                    {!hideBucketBadge ? (
                      <span
                        className={
                          villa.bucket === "company"
                            ? "rounded-full bg-secondary-soft px-2.5 py-1 text-[11px] font-semibold text-secondary-dark"
                            : "rounded-full bg-[#F0EDE6] px-2.5 py-1 text-[11px] font-semibold text-muted"
                        }
                      >
                        {villa.orgLabel}
                      </span>
                    ) : null}
                    <StatusPill status={villa.status} />
                  </div>
                  <h3 className="font-display text-lg font-bold text-ink">
                    {villa.name}
                  </h3>
                  {villa.area ? (
                    <p className="mt-1 flex items-center gap-1 text-sm text-muted">
                      <MapPin className="size-3.5" />
                      {villa.area}
                    </p>
                  ) : null}
                  {villa.description ? (
                    <p className="mt-2 line-clamp-2 text-sm text-muted">
                      {villa.description}
                    </p>
                  ) : null}
                  {villa.location_url ? (
                    <span
                      role="link"
                      tabIndex={0}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.open(
                          normalizeLocationUrl(villa.location_url!),
                          "_blank",
                          "noopener,noreferrer",
                        );
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          window.open(
                            normalizeLocationUrl(villa.location_url!),
                            "_blank",
                            "noopener,noreferrer",
                          );
                        }
                      }}
                      className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
                    >
                      <ExternalLink className="size-3.5" />
                      Open location
                    </span>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
                    <span>In {formatShortDate(villa.check_in)}</span>
                    <span>Out {formatShortDate(villa.check_out)}</span>
                  </div>
                  {showAssignees ? (
                    <div className="mt-3 flex items-center gap-2 rounded-2xl bg-[#F7F5F1] px-3 py-2 text-sm">
                      <span className="text-muted">Assigned to</span>
                      <span className="font-semibold text-ink">
                        {assignees.length ? assignees.join(", ") : "Unassigned"}
                      </span>
                    </div>
                  ) : null}
                  </div>
                </Card>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
