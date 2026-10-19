"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { VillaPhotoThumb } from "@/components/villas/villa-photo";
import { VillaFacts } from "@/components/villas/villa-facts";
import { VillaDetailsFields } from "@/components/villas/villa-details-fields";
import {
  EMPTY_VILLA_QUICK_SOURCES,
  VillaQuickSources,
  quickSourcesFromVilla,
  quickSourcesPayload,
} from "@/components/villas/villa-quick-sources";
import {
  VillaExpandSection,
  applyVillaEnrichment,
} from "@/components/villas/villa-form-sections";
import { useData } from "@/lib/data/use-app-data";
import type { VillaStatus } from "@/lib/design-tokens";
import { canDeleteVilla, canEditVillaCore, isStaffApp } from "@/lib/roles";
import { isValidLocationUrl, normalizeLocationUrl } from "@/lib/utils";
import { formatWorkWindow } from "@/lib/notifications";
import { formatOrderWhen } from "@/lib/service-orders";
import { useI18n } from "@/lib/i18n/provider";
import { LocalizedText } from "@/components/i18n/localized-text";
import { labelRole, labelVillaStatus } from "@/lib/i18n/labels";
import { HouseGuideEditor } from "@/components/villas/house-guide-editor";
import { VillaMasterInfoEditor } from "@/components/villas/villa-master-info-editor";
import { VillaMaintenanceLog } from "@/components/villas/villa-maintenance-log";
import { useVillaPhotoUpload } from "@/components/villas/use-villa-photo-upload";
import {
  detailsToForm,
  EMPTY_VILLA_DETAILS_FORM,
  formToDetails,
} from "@/lib/villas/property-details";

export default function VillaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const data = useData();
  const { t } = useI18n();
  const villaItem = data.villaList.find((v) => v.id === id);
  const villa =
    villaItem ??
    data.villas.find((v) => v.id === id) ??
    data.allOrgVillas.find((v) => v.id === id);
  const isOwner = data.profile?.role === "owner";
  const staff = data.profile ? isStaffApp(data.profile.role) : false;
  const villaJobs = data.serviceOrders.filter(
    (o) =>
      o.villa_id === id &&
      o.status !== "cancelled" &&
      (!staff || o.staff_profile_id === data.profile?.id),
  );
  const villaTasks = data.tasks.filter(
    (task) =>
      task.villa_id === id &&
      task.status === "open" &&
      (!staff || task.assigned_to === data.profile?.id),
  );
  const isPersonal =
    villaItem?.bucket === "personal" ||
    (data.profile?.personal_org_id != null &&
      villa?.org_id === data.profile.personal_org_id &&
      data.profile.org_id !== data.profile.personal_org_id);
  const canEditCore =
    Boolean(isPersonal) ||
    (data.profile ? canEditVillaCore(data.profile.role) : false);
  const canMerge =
    Boolean(isPersonal) &&
    data.orgKind === "company" &&
    data.profile?.role !== "owner";
  const canDelete = data.profile
    ? canDeleteVilla(data.profile.role, Boolean(isPersonal))
    : false;

  const [status, setStatus] = useState<VillaStatus>("available");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [notes, setNotes] = useState("");
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [locationUrl, setLocationUrl] = useState("");
  const [description, setDescription] = useState("");
  const [details, setDetails] = useState(EMPTY_VILLA_DETAILS_FORM);
  const [quickSources, setQuickSources] = useState(EMPTY_VILLA_QUICK_SOURCES);
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [openMaster, setOpenMaster] = useState(false);
  const photo = useVillaPhotoUpload(data.uploadVillaPhoto);

  const team = useMemo(
    () =>
      data.profiles.filter(
        (p) => p.role === "cleaner" || p.role === "staff",
      ),
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
    setCheckIn(villa.check_in ?? "");
    setCheckOut(villa.check_out ?? "");
    setNotes(villa.notes ?? "");
    setName(villa.name);
    setArea(villa.area ?? "");
    setLocationUrl(villa.location_url ?? "");
    setDescription(villa.description ?? "");
    photo.setPhotoUrl(villa.photo_url ?? null);
    setDetails(detailsToForm(villa));
    setQuickSources(quickSourcesFromVilla(villa));
  }, [villa?.id]);

  useEffect(() => {
    if (!villa?.id) return;
    setAssigneeIds(storedAssigneeKey ? storedAssigneeKey.split(",") : []);
  }, [villa?.id, storedAssigneeKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const section = new URLSearchParams(window.location.search).get("section");
    if (section !== "master") return;
    setOpenMaster(true);
    const timer = window.setTimeout(() => {
      document.getElementById("villa-master")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [villa?.id, data.ready]);

  if (!data.ready) return <LoadingState />;
  if (!villa) {
    return (
      <div className="space-y-3">
        <Link href="/villas" className="text-sm font-semibold text-primary">
          ← {t("common.back")}
        </Link>
        <p className="text-muted">{t("villas.notFound")}</p>
      </div>
    );
  }

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      if (!isValidLocationUrl(locationUrl)) {
        setError(t("villas.locationRequired"));
        setSaving(false);
        return;
      }
      const photoUrl = await photo.waitForPhoto();
      await data.updateVilla(villa.id, {
        status,
        check_in: checkIn || null,
        check_out: checkOut || null,
        notes: notes || null,
        location_url: normalizeLocationUrl(locationUrl),
        description: description.trim() || null,
        photo_url: photoUrl,
        ...quickSourcesPayload(quickSources),
        ...formToDetails(details),
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

  const remove = async () => {
    setDeleting(true);
    setError(null);
    try {
      await data.deleteVilla(villa.id);
      router.push("/villas");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete.");
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="space-y-4 animate-rise">
      <Link
        href="/villas"
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted"
      >
        <ArrowLeft className="size-4" /> {t("common.back")}
      </Link>

      <Card className="space-y-4 p-5">
        {canEditCore ? (
          <>
            <div>
              <Label>{t("villas.propertyName")}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-ink">
                {t("villas.photoSection")}
              </p>
              <VillaPhotoThumb
                src={photo.displayUrl ?? villa.photo_url}
                alt={villa.name}
              />
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  photo.pickPhoto(file);
                }}
              />
              {photo.photoBusy ? (
                <p className="text-xs font-semibold text-muted">
                  {t("villas.photoUploading")}
                </p>
              ) : null}
              {photo.displayUrl ? (
                <button
                  type="button"
                  className="text-xs font-semibold text-danger"
                  onClick={() => photo.removePhoto()}
                >
                  Remove photo
                </button>
              ) : null}
              <div>
                <Label htmlFor="status">{t("villas.status")}</Label>
                <Select
                  id="status"
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

            <VillaExpandSection title={t("villas.quickSources")}>
              <VillaQuickSources
                embedded
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
            </VillaExpandSection>

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
          </>
        ) : (
          <div>
            {(photo.displayUrl || villa.photo_url) && (
              <VillaPhotoThumb
                src={photo.displayUrl ?? villa.photo_url}
                alt={villa.name}
              />
            )}
            <h1 className="font-display text-2xl font-bold text-ink">
              {villa.name}
            </h1>
            <p className="text-sm text-muted">{villa.area}</p>
            {villa.description ? (
              <p className="mt-2 text-sm text-muted">
                <LocalizedText text={villa.description} />
              </p>
            ) : null}
            <VillaFacts villa={villa} className="mt-3" />
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
              {villa.location_url ? (
                <a
                  href={normalizeLocationUrl(villa.location_url)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
                >
                  <ExternalLink className="size-3.5" />
                  {t("villas.locationLink")}
                </a>
              ) : null}
              {villa.listing_url ? (
                <a
                  href={villa.listing_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
                >
                  <ExternalLink className="size-3.5" />
                  {t("villas.openListing")}
                </a>
              ) : null}
            </div>
          </div>
        )}

        {villaItem && data.orgKind === "company" ? (
          <div className="rounded-2xl bg-canvas-deep px-3 py-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Belongs to
            </p>
            <p className="mt-0.5 font-semibold text-ink">{villaItem.orgLabel}</p>
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

        <div className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-canvas-deep/40 p-3">
          <p className="text-sm font-semibold text-ink">
            {t("villas.opsSection")}
          </p>
          {isOwner && !isPersonal && data.orgKind === "company" ? (
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
                          {labelRole(t, person.role)}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          {staff ? (
            <div className="space-y-2 rounded-2xl bg-card px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                {t("villas.yourJobsHere")}
              </p>
              {villaJobs.length === 0 && villaTasks.length === 0 ? (
                <p className="text-sm text-muted">{t("villas.noJobsHere")}</p>
              ) : null}
              {villaJobs.map((o) => (
                <p key={o.id} className="text-sm font-semibold text-ink">
                  <LocalizedText text={o.service_type} />
                  {formatOrderWhen(o) ? ` · ${formatOrderWhen(o)}` : ""}
                </p>
              ))}
              {villaTasks.map((task) => (
                <p key={task.id} className="text-sm text-ink">
                  {task.title}
                  {formatWorkWindow(
                    task.due_date,
                    task.time_start,
                    task.time_end,
                    {
                      schedule_mode: task.schedule_mode,
                      time_slots: task.time_slots,
                      recurrence: task.recurrence,
                      recurrence_count: task.recurrence_count,
                    },
                  )
                    ? ` · ${formatWorkWindow(
                        task.due_date,
                        task.time_start,
                        task.time_end,
                        {
                          schedule_mode: task.schedule_mode,
                          time_slots: task.time_slots,
                          recurrence: task.recurrence,
                          recurrence_count: task.recurrence_count,
                        },
                      )}`
                    : ""}
                </p>
              ))}
              <p className="text-xs text-muted">{t("villas.staffHint")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="min-w-0 overflow-hidden">
                <Label htmlFor="check_in">{t("villas.checkIn")}</Label>
                <Input
                  id="check_in"
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                />
              </div>
              <div className="min-w-0 overflow-hidden">
                <Label htmlFor="check_out">{t("villas.checkOut")}</Label>
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
            <Label htmlFor="notes">{t("common.notes")}</Label>
            <Textarea
              id="notes"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {error || photo.photoError ? (
          <p className="text-sm text-danger">{error ?? photo.photoError}</p>
        ) : null}
        {saved ? (
          <p className="text-sm font-semibold text-secondary">
            {t("common.saved")}
          </p>
        ) : null}

        <Button
          onClick={() => void save()}
          busy={saving || deleting}
          className="w-full"
        >
          {saving || photo.photoBusy
            ? `${t("common.save")}…`
            : t("common.save")}
        </Button>

        {canDelete ? (
          <Button
            type="button"
            variant="ghost"
            className="w-full text-danger"
            disabled={saving || deleting}
            onClick={() => setConfirmDelete(true)}
          >
            {t("villas.delete")}
          </Button>
        ) : null}
      </Card>

      {canEditCore && !staff ? (
        <VillaExpandSection title={t("villas.houseGuideSection")}>
          <HouseGuideEditor villaId={id} embed />
        </VillaExpandSection>
      ) : null}

      <div id="villa-master">
        <VillaExpandSection
          title={t("villas.masterInfoTitle")}
          defaultOpen={openMaster}
        >
          <VillaMasterInfoEditor villaId={id} embed />
        </VillaExpandSection>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-ink">
          {t("villas.maintTitle")}
        </p>
        <VillaMaintenanceLog villaId={id} />
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title={t("villas.delete")}
        description={t(
          isPersonal ? "villas.deleteConfirmPersonal" : "villas.deleteConfirm",
          { name: villa.name },
        )}
        confirmLabel={t("common.delete")}
        busy={deleting}
        onConfirm={() => void remove()}
        onClose={() => {
          if (!deleting) setConfirmDelete(false);
        }}
      />
    </div>
  );
}
