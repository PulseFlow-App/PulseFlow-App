"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Copy, QrCode, RotateCcw, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { PulseIcon, type PulseIconName } from "@/components/icons/pulse-icon";
import { useData } from "@/lib/data/use-app-data";
import type { UserRole } from "@/lib/design-tokens";
import {
  canInviteAnyone,
  canInviteGuest,
  canInviteOwner,
  canInviteStaff,
  companyHasOwner,
  invitableStaffRoles,
  isOwnerTransferInvite,
} from "@/lib/roles";
import {
  referralJoinUrl,
  referralRegisterUrl,
} from "@/lib/billing/plans";
import { useI18n } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Invite } from "@/lib/types";

type FlipKind = "staff" | "guest" | "owner";

type Props = {
  referralCode: string;
  invites: Invite[];
  isOwner: boolean;
};

export function InviteFlipCards({ referralCode, invites, isOwner }: Props) {
  const data = useData();
  const { t } = useI18n();
  const profile = data.profile;
  const [open, setOpen] = useState<FlipKind | null>(null);
  const [staffRole, setStaffRole] =
    useState<"manager" | "cleaner" | "staff">("staff");
  const [jobTitle, setJobTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [anyoneUrl, setAnyoneUrl] = useState("");

  const staffRoles = useMemo(
    () =>
      profile ? invitableStaffRoles(profile.role, data.orgKind) : [],
    [profile, data.orgKind],
  );

  const hasOwner = useMemo(
    () => companyHasOwner(data.profiles),
    [data.profiles],
  );

  useEffect(() => {
    setAnyoneUrl(
      referralRegisterUrl(window.location.origin, referralCode, {
        src: "app_invite_anyone",
      }),
    );
  }, [referralCode]);

  if (!profile) return null;

  const showAnyone = canInviteAnyone(profile.role);
  const showStaff = canInviteStaff(profile.role, data.orgKind);
  const showGuest = canInviteGuest(profile.role, data.orgKind);
  const showOwnerInvite = canInviteOwner(
    profile.role,
    data.orgKind,
    hasOwner,
  );
  const openOwnerInvite = invites.some(
    (i) => i.role === "owner" && !i.used_at,
  );

  const effectiveStaffRole = (
    staffRoles.includes(staffRole) ? staffRole : staffRoles[0] ?? "staff"
  ) as "manager" | "cleaner" | "staff";

  const openInvites = invites.filter((i) => !i.used_at);

  const flip = (kind: FlipKind) => {
    setError(null);
    setCopied(null);
    setQrToken(null);
    setOpen((prev) => (prev === kind ? null : kind));
  };

  const copyText = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1800);
  };

  const createRoleInvite = async (role: UserRole) => {
    setCreating(true);
    setError(null);
    try {
      const invite = await data.createInvite({
        role,
        jobTitle:
          role === "guest" || role === "owner"
            ? undefined
            : jobTitle || undefined,
      });
      const link = referralJoinUrl(
        window.location.origin,
        invite.token,
        referralCode,
        {
          src:
            role === "guest"
              ? "app_invite_guest"
              : role === "owner"
                ? "app_invite_owner"
                : "app_invite_staff",
        },
      );
      await copyText(link, invite.token);
      if (role !== "guest" && role !== "owner") setJobTitle("");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("settings.inviteError"));
    } finally {
      setCreating(false);
    }
  };

  const deleteInvite = async (inviteId: string) => {
    const target = invites.find((i) => i.id === inviteId);
    setDeletingId(inviteId);
    setError(null);
    try {
      await data.deleteInvite(inviteId);
      if (target && qrToken === target.token) setQrToken(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("settings.inviteDeleteError"));
    } finally {
      setDeletingId(null);
    }
  };

  const flipCards: {
    kind: FlipKind;
    show: boolean;
    icon: PulseIconName;
    titleKey: MessageKey;
    hintKey: MessageKey;
  }[] = [
    {
      kind: "owner",
      show: showOwnerInvite,
      icon: "properties",
      titleKey: isOwnerTransferInvite(hasOwner)
        ? "invite.card.transferOwner"
        : "invite.card.owner",
      hintKey: isOwnerTransferInvite(hasOwner)
        ? "invite.card.transferOwnerHint"
        : "invite.card.ownerHint",
    },
    {
      kind: "staff",
      show: showStaff,
      icon: "contacts",
      titleKey: "invite.card.staff",
      hintKey: "invite.card.staffHint",
    },
    {
      kind: "guest",
      show: showGuest,
      icon: "guests",
      titleKey: "invite.card.guest",
      hintKey: "invite.card.guestHint",
    },
  ];

  const cardCount =
    Number(showAnyone) +
    Number(showStaff) +
    Number(showGuest) +
    Number(showOwnerInvite);
  const gridCols = cardCount >= 3 ? "sm:grid-cols-3" : "sm:grid-cols-2";

  return (
    <div className="space-y-3">
      {showOwnerInvite ? (
        <Card className="space-y-3 border-primary/30 bg-primary/5 p-4">
          <p className="font-display text-base font-bold text-ink">
            {isOwnerTransferInvite(hasOwner)
              ? t("invite.transferOwnerTitle")
              : t("invite.needsOwnerTitle")}
          </p>
          <p className="text-sm text-muted">
            {isOwnerTransferInvite(hasOwner)
              ? t("invite.transferOwnerHint")
              : t("invite.needsOwnerHint")}
          </p>
          <Button
            size="sm"
            className="w-full"
            disabled={creating || openOwnerInvite}
            onClick={() => void createRoleInvite("owner")}
          >
            <Copy className="size-4" />
            {creating
              ? t("settings.creating")
              : openOwnerInvite
                ? t("invite.ownerInviteOpen")
                : isOwnerTransferInvite(hasOwner)
                  ? t("invite.createTransferLink")
                  : t("invite.createOwnerLink")}
          </Button>
        </Card>
      ) : null}

      <div className={cn("grid gap-3", gridCols)}>
        {showAnyone ? (
          <Card className="flex flex-col space-y-3 p-4">
            <PulseIcon name="invite" className="size-6 shrink-0" />
            <div>
              <p className="font-display text-base font-bold leading-snug text-ink">
                {t("invite.card.anyone")}
              </p>
              <p className="mt-1 text-xs leading-snug text-muted">
                {t("invite.card.anyoneHint")}
              </p>
            </div>
            {anyoneUrl ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {t("settings.scanToJoin")}
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={t("invite.card.anyone")}
                  className="mx-auto rounded-2xl border border-black/5 bg-card"
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                    anyoneUrl,
                  )}`}
                  width={200}
                  height={200}
                  loading="lazy"
                />
                <Button
                  size="sm"
                  className="w-full"
                  variant="secondary"
                  onClick={() => void copyText(anyoneUrl, "anyone")}
                >
                  <Copy className="size-4" />
                  {copied === "anyone"
                    ? t("plan.referralCopied")
                    : t("invite.copyLink")}
                </Button>
              </>
            ) : null}
          </Card>
        ) : null}

        {flipCards
          .filter((c) => c.show)
          .map(({ kind, icon, titleKey, hintKey }) => {
            const flipped = open === kind;
            return (
              <div key={kind} className="[perspective:1200px]">
                <div
                  className={cn(
                    "relative min-h-[12.5rem] transition-transform duration-500 [transform-style:preserve-3d]",
                    flipped && "[transform:rotateY(180deg)]",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => flip(kind)}
                    className="absolute inset-0 w-full text-left [backface-visibility:hidden]"
                  >
                    <Card className="flex h-full min-h-[12.5rem] flex-col space-y-2 p-4 hover:border-primary/30">
                      <PulseIcon name={icon} className="size-6 shrink-0" />
                      <p className="font-display text-base font-bold leading-snug text-ink">
                        {t(titleKey)}
                      </p>
                      <p className="flex-1 text-xs leading-snug text-muted">
                        {t(hintKey)}
                      </p>
                      <p className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                        {t("invite.tapToFlip")}
                        <ChevronDown className="size-3.5" aria-hidden />
                      </p>
                    </Card>
                  </button>

                  <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                    <Card className="flex h-full min-h-[12.5rem] flex-col space-y-2 overflow-auto p-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-display text-sm font-bold text-ink">
                          {t(titleKey)}
                        </p>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted"
                          onClick={() => flip(kind)}
                        >
                          <RotateCcw className="size-3" />
                          {t("invite.flipBack")}
                        </button>
                      </div>

                      {kind === "staff" ? (
                        <div className="space-y-2">
                          <p className="text-xs text-muted">
                            {t("invite.staffBackHint")}
                          </p>
                          <div>
                            <Label>{t("common.role")}</Label>
                            <Select
                              value={effectiveStaffRole}
                              onChange={(e) =>
                                setStaffRole(
                                  e.target.value as
                                    | "manager"
                                    | "cleaner"
                                    | "staff",
                                )
                              }
                            >
                              {staffRoles.map((r) => (
                                <option key={r} value={r}>
                                  {t(`roles.${r}` as MessageKey)}
                                </option>
                              ))}
                            </Select>
                          </div>
                          <div>
                            <Label>{t("settings.jobTitle")}</Label>
                            <Input
                              value={jobTitle}
                              onChange={(e) => setJobTitle(e.target.value)}
                              placeholder={t("settings.jobTitlePlaceholder")}
                            />
                          </div>
                          <Button
                            size="sm"
                            className="w-full"
                            disabled={creating || staffRoles.length === 0}
                            onClick={() =>
                              void createRoleInvite(effectiveStaffRole)
                            }
                          >
                            <Copy className="size-4" />
                            {creating
                              ? t("settings.creating")
                              : t("invite.createAndCopy")}
                          </Button>
                        </div>
                      ) : null}

                      {kind === "guest" ? (
                        <div className="mt-auto space-y-2">
                          <p className="text-xs text-muted">
                            {t("invite.guestBackHint")}
                          </p>
                          <Button
                            size="sm"
                            className="w-full"
                            disabled={creating}
                            onClick={() => void createRoleInvite("guest")}
                          >
                            <Copy className="size-4" />
                            {creating
                              ? t("settings.creating")
                              : t("invite.createAndCopy")}
                          </Button>
                        </div>
                      ) : null}

                      {kind === "owner" ? (
                        <div className="mt-auto space-y-2">
                          <p className="text-xs text-muted">
                            {t("invite.ownerBackHint")}
                          </p>
                          <Button
                            size="sm"
                            className="w-full"
                            disabled={creating || openOwnerInvite}
                            onClick={() => void createRoleInvite("owner")}
                          >
                            <Copy className="size-4" />
                            {creating
                              ? t("settings.creating")
                              : openOwnerInvite
                                ? t("invite.ownerInviteOpen")
                                : t("invite.createAndCopy")}
                          </Button>
                        </div>
                      ) : null}
                    </Card>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}
      {copied && copied !== "anyone" ? (
        <p className="text-sm font-semibold text-secondary">
          {t("settings.inviteCopied")}
        </p>
      ) : null}

      {openInvites.length > 0 &&
      (showStaff || showGuest || showOwnerInvite) ? (
        <div className="space-y-2 border-t border-black/5 pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {t("settings.openInvites")}
          </p>
          {openInvites.map((inv) => {
            const link = referralJoinUrl(
              typeof window !== "undefined" ? window.location.origin : "",
              inv.token,
              referralCode,
              {
                src:
                  inv.role === "guest"
                    ? "app_invite_guest"
                    : inv.role === "owner"
                      ? "app_invite_owner"
                      : "app_invite_staff",
              },
            );
            return (
              <div key={inv.id} className="space-y-2">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <div className="flex min-w-0 items-start gap-2">
                    <PulseIcon
                      name={
                        inv.role === "guest"
                          ? "guests"
                          : inv.role === "owner"
                            ? "properties"
                            : "contacts"
                      }
                      className="mt-0.5 size-5 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">
                        {t(`roles.${inv.role}` as MessageKey)}
                        {inv.job_title ? ` · ${inv.job_title}` : ""}
                      </p>
                      <p className="text-xs text-muted">
                        {t("settings.waitingToJoin")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void copyText(link, inv.token)}
                    >
                      {t("common.copy")}
                    </Button>
                    {isOwner || inv.role === "owner" ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setQrToken((prev) =>
                            prev === inv.token ? null : inv.token,
                          )
                        }
                      >
                        <QrCode className="size-4" />
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-danger hover:bg-danger/10 hover:text-danger"
                      disabled={deletingId === inv.id}
                      aria-label={t("settings.deleteInvite")}
                      onClick={() => void deleteInvite(inv.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
                {qrToken === inv.token ? (
                  <Card className="space-y-2 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      {t("settings.scanToJoin")}
                    </p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt="Invite QR code"
                      className="mx-auto rounded-2xl border border-black/5"
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                        link,
                      )}`}
                      width={220}
                      height={220}
                      loading="lazy"
                    />
                  </Card>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
