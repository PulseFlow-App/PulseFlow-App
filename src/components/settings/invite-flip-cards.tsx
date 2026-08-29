"use client";

import { useMemo, useState } from "react";
import { Copy, QrCode, RotateCcw, Users, UserPlus, BedDouble } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { useData } from "@/lib/data/use-app-data";
import type { UserRole } from "@/lib/design-tokens";
import {
  canInviteAnyone,
  canInviteGuest,
  canInviteStaff,
  invitableStaffRoles,
} from "@/lib/roles";
import {
  referralJoinUrl,
  referralRegisterUrl,
} from "@/lib/billing/plans";
import { useI18n } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Invite } from "@/lib/types";

type FlipKind = "anyone" | "staff" | "guest";

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
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);

  const staffRoles = useMemo(
    () =>
      profile ? invitableStaffRoles(profile.role, data.orgKind) : [],
    [profile, data.orgKind],
  );

  if (!profile) return null;

  const showAnyone = canInviteAnyone(profile.role);
  const showStaff = canInviteStaff(profile.role, data.orgKind);
  const showGuest = canInviteGuest(profile.role, data.orgKind);

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

  const createRoleInvite = async (role: Exclude<UserRole, "owner">) => {
    setCreating(true);
    setError(null);
    try {
      const invite = await data.createInvite({
        role,
        jobTitle: role === "guest" ? undefined : jobTitle || undefined,
      });
      const link = referralJoinUrl(
        window.location.origin,
        invite.token,
        referralCode,
      );
      await copyText(link, invite.token);
      if (role !== "guest") setJobTitle("");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("settings.inviteError"));
    } finally {
      setCreating(false);
    }
  };

  const cards: {
    kind: FlipKind;
    show: boolean;
    icon: typeof UserPlus;
    titleKey: MessageKey;
    hintKey: MessageKey;
  }[] = [
    {
      kind: "anyone",
      show: showAnyone,
      icon: UserPlus,
      titleKey: "invite.card.anyone",
      hintKey: "invite.card.anyoneHint",
    },
    {
      kind: "staff",
      show: showStaff,
      icon: Users,
      titleKey: "invite.card.staff",
      hintKey: "invite.card.staffHint",
    },
    {
      kind: "guest",
      show: showGuest,
      icon: BedDouble,
      titleKey: "invite.card.guest",
      hintKey: "invite.card.guestHint",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        {cards
          .filter((c) => c.show)
          .map(({ kind, icon: Icon, titleKey, hintKey }) => {
            const flipped = open === kind;
            return (
              <div key={kind} className="[perspective:1200px]">
                <div
                  className={cn(
                    "relative min-h-[11rem] transition-transform duration-500 [transform-style:preserve-3d]",
                    flipped && "[transform:rotateY(180deg)]",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => flip(kind)}
                    className="absolute inset-0 w-full text-left [backface-visibility:hidden]"
                  >
                    <Card className="flex h-full min-h-[11rem] flex-col space-y-2 p-4 hover:border-primary/30">
                      <div className="flex size-10 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                        <Icon className="size-5" />
                      </div>
                      <p className="font-display text-base font-bold text-ink">
                        {t(titleKey)}
                      </p>
                      <p className="flex-1 text-xs text-muted">{t(hintKey)}</p>
                      <p className="text-[11px] font-semibold text-primary">
                        {t("invite.tapToFlip")}
                      </p>
                    </Card>
                  </button>

                  <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                    <Card className="flex h-full min-h-[11rem] flex-col space-y-2 overflow-auto p-4">
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

                      {kind === "anyone" ? (
                        <div className="mt-auto space-y-2">
                          <p className="text-xs text-muted">
                            {t("invite.anyoneBackHint")}
                          </p>
                          <Button
                            size="sm"
                            className="w-full"
                            variant="secondary"
                            onClick={() => {
                              const url = referralRegisterUrl(
                                window.location.origin,
                                referralCode,
                              );
                              void copyText(url, "anyone");
                            }}
                          >
                            <Copy className="size-4" />
                            {copied === "anyone"
                              ? t("plan.referralCopied")
                              : t("invite.copyLink")}
                          </Button>
                        </div>
                      ) : null}

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

      {openInvites.length > 0 && (showStaff || showGuest) ? (
        <div className="space-y-2 border-t border-black/5 pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {t("settings.openInvites")}
          </p>
          {openInvites.map((inv) => {
            const link = referralJoinUrl(
              typeof window !== "undefined" ? window.location.origin : "",
              inv.token,
              referralCode,
            );
            return (
              <div key={inv.id} className="space-y-2">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <div>
                    <p className="font-semibold text-ink">
                      {t(`roles.${inv.role}` as MessageKey)}
                      {inv.job_title ? ` · ${inv.job_title}` : ""}
                    </p>
                    <p className="text-xs text-muted">
                      {t("settings.waitingToJoin")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void copyText(link, inv.token)}
                    >
                      {t("common.copy")}
                    </Button>
                    {isOwner ? (
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
