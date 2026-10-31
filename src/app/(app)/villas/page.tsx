"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ReportsEntryLink } from "@/components/reports/reports-entry-link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { EmptyState, LoadingState } from "@/components/ui/empty-state";
import { PulseIcon } from "@/components/icons/pulse-icon";
import { VillaPhotoThumb } from "@/components/villas/villa-photo";
import { VillaDetailsFields } from "@/components/villas/villa-details-fields";
import { VillaListCard } from "@/components/villas/villa-list-card";
import {
  CompanySelectField,
  EMPTY_VILLA_QUICK_SOURCES,
  VillaQuickSources,
  quickSourcesPayload,
} from "@/components/villas/villa-quick-sources";
import {
  VillaExpandSection,
  applyVillaEnrichment,
} from "@/components/villas/villa-form-sections";
import {
  EMPTY_HOUSE_GUIDE_DRAFT,
  HouseGuideEditor,
  houseGuideHasContent,
  houseGuidePayload,
} from "@/components/villas/house-guide-editor";
import {
  EMPTY_MASTER_INFO_DRAFT,
  VillaMasterInfoEditor,
  masterInfoHasContent,
  masterInfoPayload,
} from "@/components/villas/villa-master-info-editor";
import { useVillaPhotoUpload } from "@/components/villas/use-villa-photo-upload";
import { useData } from "@/lib/data/use-app-data";
import {
  isValidLocationUrl,
  normalizeLocationUrl,
} from "@/lib/utils";
import {
  canCreateVillas,
  canEditVillaCore,
  isGuestApp,
  isStaffApp,
  personalVillasOnly,
} from "@/lib/roles";
import { GuestBookingGuide } from "@/components/home/guest-booking-guide";
import { HandoffPersonalCard } from "@/components/villas/handoff-personal-card";
import { useI18n } from "@/lib/i18n/provider";
import { labelRole, labelVillaStatus } from "@/lib/i18n/labels";
import { capitalizeLabel } from "@/lib/format-label";
import type { MessageKey } from "@/lib/i18n";
import type { VillaListItem } from "@/lib/types";
import type { VillaStatus } from "@/lib/design-tokens";
import {
  EMPTY_VILLA_DETAILS_FORM,
  formToDetails,
} from "@/lib/villas/property-details";
export default function VillasPage() {
  const data = useData();
  const { t } = useI18n();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [locationUrl, setLocationUrl] = useState("");
  const [description, setDescription] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<VillaStatus>("available");
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [houseGuide, setHouseGuide] = useState(EMPTY_HOUSE_GUIDE_DRAFT);
  const [masterInfo, setMasterInfo] = useState(EMPTY_MASTER_INFO_DRAFT);
  const [details, setDetails] = useState(EMPTY_VILLA_DETAILS_FORM);
  const [quickSources, setQuickSources] = useState(EMPTY_VILLA_QUICK_SOURCES);
  const [scope, setScope] = useState<"company" | "personal">("personal");
  const [companyOrgId, setCompanyOrgId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const photo = useVillaPhotoUpload(data.uploadVillaPhoto);

  const team = useMemo(
    () =>
      data.profiles.filter(
        (p) => p.role === "cleaner" || p.role === "staff",
      ),
    [data.profiles],
  );

  const canAdd = data.profile ? canCreateVillas(data.profile.role) : false;
  const isOwner = data.profile?.role === "owner";
  const staff = data.profile ? isStaffApp(data.profile.role) : false;
  const personalOnly = data.profile
    ? personalVillasOnly(data.profile.role, data.orgKind)
    : false;
  const inCompany = data.orgKind === "company";
  const isPersonalWorkspace = data.orgKind === "personal";
  const ownedCompanies = useMemo(() => {
    const profileId = data.profile?.id;
    if (!profileId) return [];
    return data.orgs.filter(
      (o) =>
        o.kind === "company" &&
        data.memberships.some(
          (m) =>
            m.profile_id === profileId &&
            m.org_id === o.id &&
            m.role === "owner",
        ),
    );
  }, [data.orgs, data.memberships, data.profile?.id]);

  const defaultScope =
    isOwner && inCompany ? "company" : "personal";

  useEffect(() => {
    if (!canAdd || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("add") !== "1") return;
    setScope(defaultScope);
    setCompanyOrgId(
      ownedCompanies.find((o) => o.id === data.profile?.org_id)?.id ??
        ownedCompanies[0]?.id ??
        "",
    );
    setShowAdd(true);
  }, [
    canAdd,
    defaultScope,
    ownedCompanies,
    data.profile?.org_id,
  ]);

  const companyVillas = useMemo(
    () => data.villaList.filter((v) => v.bucket === "company"),
    [data.villaList],
  );
  const companyGroups = useMemo(() => {
    const groups: { orgId: string; label: string; villas: VillaListItem[] }[] =
      [];
    for (const villa of companyVillas) {
      const existing = groups.find((g) => g.orgId === villa.org_id);
      if (existing) existing.villas.push(villa);
      else {
        groups.push({
          orgId: villa.org_id,
          label: villa.orgLabel,
          villas: [villa],
        });
      }
    }
    return groups;
  }, [companyVillas]);
  const personalVillas = useMemo(
    () => data.villaList.filter((v) => v.bucket === "personal"),
    [data.villaList],
  );

  if (!data.ready) return <LoadingState />;
  if (data.profile && isGuestApp(data.profile.role)) {
    return (
      <Suspense fallback={<LoadingState />}>
        <GuestBookingGuide />
      </Suspense>
    );
  }

  const assigneesFor = (villaId: string) =>
    data.villaAssignments
      .filter((a) => a.villa_id === villaId)
      .map((a) => data.profiles.find((p) => p.id === a.profile_id)?.full_name)
      .filter(Boolean) as string[];

  const pendingDateRequests = data.stayDateRequests.filter(
    (r) => r.status === "pending",
  ).length;
  const canManageDates =
    data.profile?.role === "owner" || data.profile?.role === "manager";
  const villasSubtitle = staff
    ? t("villas.subtitleStaff")
    : t("villas.subtitle");

  const resetAdd = () => {
    photo.resetPhoto();
    setName("");
    setArea("");
    setLocationUrl("");
    setDescription("");
    setCheckIn("");
    setCheckOut("");
    setNotes("");
    setStatus("available");
    setAssigneeIds([]);
    setHouseGuide(EMPTY_HOUSE_GUIDE_DRAFT);
    setMasterInfo(EMPTY_MASTER_INFO_DRAFT);
    setDetails(EMPTY_VILLA_DETAILS_FORM);
    setQuickSources(EMPTY_VILLA_QUICK_SOURCES);
    setShowAdd(false);
    setError(null);
  };

  return (
    <div className="relative space-y-4 animate-rise">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="type-title">{t("villas.title")}</h1>
          {villasSubtitle ? (
            <p className="type-meta mt-1">{villasSubtitle}</p>
          ) : null}
        </div>
        {!showAdd ? (
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            {canAdd ? (
              <Button
                size="xs"
                className="shrink-0"
                onClick={() => {
                  setScope(defaultScope);
                  setCompanyOrgId(
                    ownedCompanies.find((o) => o.id === data.profile?.org_id)
                      ?.id ??
                      ownedCompanies[0]?.id ??
                      "",
                  );
                  setShowAdd(true);
                }}
              >
                <Plus className="size-3.5" strokeWidth={2.4} />{" "}
                {t("villas.addNew")}
              </Button>
            ) : null}
            <ReportsEntryLink />
          </div>
        ) : null}
      </div>

      {canManageDates && pendingDateRequests > 0 && !showAdd ? (
        <Link href="/date-requests">
          <Card className="flex items-center justify-between gap-3 bg-primary-soft/50 p-4 transition hover:bg-primary-soft">
            <div>
              <p className="font-semibold text-ink">
                {t("dateRequests.title")}
              </p>
              <p className="text-sm text-muted">
                {pendingDateRequests === 1
                  ? t("dateRequests.pendingOne")
                  : t("dateRequests.pendingMany", {
                      count: pendingDateRequests,
                    })}
              </p>
            </div>
            <span className="text-sm font-bold text-primary">
              {t("common.open")}
            </span>
          </Card>
        </Link>
      ) : null}

      {showAdd ? (
        <Card className="space-y-3 p-5">
          <h2 className="font-display text-lg font-bold text-ink">
            {t("villas.addNew")}
          </h2>
          {isOwner && ownedCompanies.length > 0 ? (
            <CompanySelectField
              label={t("villas.companyName")}
              value={
                scope === "personal"
                  ? "personal"
                  : companyOrgId || ownedCompanies[0]?.id || "personal"
              }
              onChange={(v) => {
                if (v === "personal") {
                  setScope("personal");
                  return;
                }
                setScope("company");
                setCompanyOrgId(v);
              }}
              companies={ownedCompanies.map((o) => ({
                id: o.id,
                name: o.name,
              }))}
              personalLabel={t("villas.personal")}
              companyKindLabel={t("villas.company")}
            />
          ) : null}
          {inCompany && personalOnly && canAdd ? (
            <p className="pf-panel-soft rounded-2xl px-3 py-2 text-xs text-ink/70">
              {t("villas.personalHint")}
            </p>
          ) : null}

          <div>
            <Label>{t("villas.propertyName")}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setName((v) => capitalizeLabel(v))}
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-ink">
              {t("villas.photoSection")}
            </p>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) {
                  photo.removePhoto();
                  return;
                }
                photo.pickPhoto(file);
              }}
            />
            {photo.photoBusy ? (
              <p className="text-xs font-semibold text-muted">
                {t("villas.photoUploading")}
              </p>
            ) : null}
            {photo.displayUrl ? (
              <VillaPhotoThumb
                src={photo.displayUrl}
                alt="New property preview"
              />
            ) : null}
            <div>
              <Label>{t("villas.status")}</Label>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value as VillaStatus)}
              >
                <option value="available">
                  {labelVillaStatus(t, "available")}
                </option>
                <option value="occupied">
                  {labelVillaStatus(t, "occupied")}
                </option>
                <option value="turnover">
                  {labelVillaStatus(t, "turnover")}
                </option>
                <option value="maintenance">
                  {labelVillaStatus(t, "maintenance")}
                </option>
              </Select>
            </div>
          </div>

          <VillaQuickSources
            value={quickSources}
            onChange={setQuickSources}
            uploadDoc={data.uploadVillaPhoto}
            onEnrich={(enrichment) => {
              const next = applyVillaEnrichment(enrichment, {
                name,
                area,
                description,
                locationUrl,
                details,
              });
              setName(next.name);
              setArea(next.area);
              setDescription(next.description);
              setLocationUrl(next.locationUrl);
              setDetails(next.details);
            }}
          />

          <div>
            <Label>{t("villas.locationLink")}</Label>
            <Input
              value={locationUrl}
              onChange={(e) => setLocationUrl(e.target.value)}
              inputMode="url"
            />
          </div>
          <div>
            <Label>{t("villas.description")}</Label>
            <Textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <VillaDetailsFields value={details} onChange={setDetails} />

          <div className="pf-panel-soft space-y-3 rounded-2xl border border-sky/20 p-3">
            <p className="text-sm font-semibold text-ink">
              {t("villas.opsSection")}
            </p>
            {isOwner &&
            scope === "company" &&
            inCompany &&
            ownedCompanies.length > 0 ? (
              <div>
                <Label>{t("villas.assignedTo")}</Label>
                <ul className="mt-2 space-y-2">
                  {team.map((person) => {
                    const checked = assigneeIds.includes(person.id);
                    return (
                      <li key={person.id}>
                        <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-card px-3 py-2.5 text-sm">
                          <input
                            type="checkbox"
                            className="size-4 shrink-0 accent-primary"
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
                            {labelRole(t, person.role)}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
                {team.length === 0 ? (
                  <p className="mt-1 text-sm text-muted">
                    Invite a manager or staff member first.
                  </p>
                ) : null}
              </div>
            ) : null}

            {!staff ? (
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="min-w-0 overflow-hidden">
                  <Label>{t("villas.checkIn")}</Label>
                  <Input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                  />
                </div>
                <div className="min-w-0 overflow-hidden">
                  <Label>{t("villas.checkOut")}</Label>
                  <Input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                  />
                </div>
              </div>
            ) : null}

            <div>
              <Label>{t("common.notes")}</Label>
              <Textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {!staff ? (
            <VillaExpandSection title={t("villas.houseGuideSection")}>
              <HouseGuideEditor
                embed
                value={houseGuide}
                onChange={setHouseGuide}
              />
            </VillaExpandSection>
          ) : null}

          <VillaExpandSection title={t("villas.masterInfoTitle")}>
            <VillaMasterInfoEditor
              embed
              value={masterInfo}
              onChange={setMasterInfo}
            />
          </VillaExpandSection>

          {error || photo.photoError ? (
            <p className="text-sm text-danger">{error ?? photo.photoError}</p>
          ) : null}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={resetAdd}
            >
              {t("common.cancel")}
            </Button>
            <Button
              className="flex-1"
              busy={saving}
              onClick={() => {
                if (!name.trim()) {
                  setError("Name is required.");
                  return;
                }
                if (!isValidLocationUrl(locationUrl)) {
                  setError(t("villas.locationRequired"));
                  return;
                }
                setSaving(true);
                setError(null);
                void (async () => {
                  try {
                    const photoUrl = await photo.waitForPhoto();
                    const villaId = await data.createVilla({
                      name: capitalizeLabel(name),
                      area: area.trim() || undefined,
                      location_url: normalizeLocationUrl(locationUrl),
                      description: description.trim() || undefined,
                      photo_url: photoUrl,
                      status,
                      check_in: checkIn || null,
                      check_out: checkOut || null,
                      notes: notes.trim() || null,
                      ...quickSourcesPayload(quickSources),
                      ...formToDetails(details),
                      scope:
                        isOwner && ownedCompanies.length > 0
                          ? scope
                          : "personal",
                      org_id:
                        scope === "company" && companyOrgId
                          ? companyOrgId
                          : undefined,
                    });
                    if (
                      isOwner &&
                      scope === "company" &&
                      assigneeIds.length > 0
                    ) {
                      await data.setVillaAssignees(villaId, assigneeIds);
                    }
                    if (!staff && houseGuideHasContent(houseGuide)) {
                      await data.upsertHouseGuide(
                        villaId,
                        houseGuidePayload(houseGuide),
                      );
                    }
                    if (masterInfoHasContent(masterInfo)) {
                      await data.upsertVillaMasterInfo(
                        villaId,
                        masterInfoPayload(masterInfo, isOwner),
                      );
                    }
                    resetAdd();
                  } catch (e: unknown) {
                    setError(e instanceof Error ? e.message : "Could not add.");
                  } finally {
                    setSaving(false);
                  }
                })();
              }}
            >
              {saving || photo.photoBusy
                ? `${t("common.save")}…`
                : t("common.save")}
            </Button>
          </div>
        </Card>
      ) : null}

      {!showAdd && personalVillas.length > 0 ? (
        <HandoffPersonalCard personalVillas={personalVillas} />
      ) : null}

      {!showAdd && data.villaList.length === 0 ? (
        <EmptyState
          title={t("villas.empty")}
          description={t("villas.emptyHint")}
        />
      ) : null}

      {!showAdd && data.villaList.length > 0 ? (
        isPersonalWorkspace ? (
          <VillaSection
            title={data.orgName || t("villas.title")}
            subtitle={t("villas.personal")}
            icon="personal"
            villas={data.villaList}
            showAssignees={false}
            assigneesFor={assigneesFor}
            canEditCore={(v) =>
              Boolean(
                data.profile &&
                  (v.bucket === "personal" ||
                    canEditVillaCore(data.profile.role)),
              )
            }
            t={t}
          />
        ) : (
          <>
            {companyGroups.map((group) => (
              <VillaSection
                key={group.orgId}
                title={group.label}
                subtitle={t("villas.company")}
                icon="company"
                villas={group.villas}
                showAssignees={isOwner}
                assigneesFor={assigneesFor}
                canEditCore={() =>
                  Boolean(data.profile && canEditVillaCore(data.profile.role))
                }
                t={t}
              />
            ))}

            {personalVillas.length > 0 ? (
              <VillaSection
                title={t("villas.personal")}
                subtitle={t("villas.personalHint")}
                icon="personal"
                villas={personalVillas}
                showAssignees={false}
                assigneesFor={assigneesFor}
                canEditCore={() => true}
                t={t}
              />
            ) : null}
          </>
        )
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
  canEditCore,
  t,
}: {
  title: string;
  subtitle: string;
  icon: "company" | "personal";
  villas: VillaListItem[];
  showAssignees: boolean;
  assigneesFor: (id: string) => string[];
  canEditCore: (villa: VillaListItem) => boolean;
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <span
          className={
            icon === "company"
              ? "flex size-8 items-center justify-center rounded-full bg-secondary-soft text-secondary-dark"
              : "flex size-8 items-center justify-center rounded-full bg-canvas-deep text-muted"
          }
        >
          {icon === "company" ? (
            <PulseIcon name="properties" className="size-4" />
          ) : (
            <PulseIcon name="invite" soft="ink" className="size-4" />
          )}
        </span>
        <div>
          <h2 className="font-display text-base font-bold text-ink">{title}</h2>
          <p className="text-xs text-muted">{subtitle}</p>
        </div>
      </div>
      <ul className="space-y-2.5">
        {villas.map((villa) => (
          <li key={villa.id}>
            <VillaListCard
              villa={villa}
              showAssignees={showAssignees}
              assignees={assigneesFor(villa.id)}
              canEdit={canEditCore(villa)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
