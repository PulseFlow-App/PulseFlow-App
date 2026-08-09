"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PulseMark } from "@/components/brand/pulse-mark";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { ROLE_LABELS } from "@/lib/roles";
import { isDemoMode } from "@/lib/supabase/client";
import { demoAcceptInvite, getInviteContext } from "@/lib/demo/store";
import type { Invite, Organization, Profile } from "@/lib/types";

export default function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const [ctx, setCtx] = useState<{
    invite: Invite;
    org: Organization | null;
    inviter: Profile | null;
  } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isDemoMode()) {
      setLoaded(true);
      return;
    }
    setCtx(getInviteContext(token));
    setLoaded(true);
  }, [token]);

  const accept = async () => {
    setError(null);
    if (!fullName.trim() || !email.trim()) {
      setError("Name and email are required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!isDemoMode()) {
      setError("Invite accept via Supabase activates when keys are connected.");
      return;
    }
    setSaving(true);
    try {
      demoAcceptInvite(token, {
        fullName,
        email,
        phone,
        password,
      });
      router.replace("/home");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not join.");
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-sand text-sm text-muted">
        Loading invite…
      </div>
    );
  }

  if (!ctx?.invite) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-sand px-4">
        <Card className="w-full max-w-md space-y-3 p-6 text-center">
          <PulseMark className="mx-auto size-12" />
          <h1 className="font-display text-xl font-bold text-ink">
            Invite unavailable
          </h1>
          <p className="text-sm text-muted">
            This link is invalid or already used. Ask your owner or manager for
            a new invite.
          </p>
          <Link href="/login" className="font-semibold text-primary">
            Back to sign in
          </Link>
        </Card>
      </div>
    );
  }

  const { invite, org, inviter } = ctx;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-sand px-4 py-10">
      <div className="w-full max-w-md animate-rise">
        <div className="mb-6 text-center">
          <PulseMark className="mx-auto mb-3 size-12" />
          <h1 className="font-display text-2xl font-bold text-ink">
            Join {org?.name ?? "the team"}
          </h1>
          <p className="mt-2 text-sm text-muted">
            You&apos;re registering for{" "}
            <span className="font-semibold text-ink">
              {org?.name ?? "this organization"}
            </span>
            {inviter ? (
              <>
                , invited by{" "}
                <span className="font-semibold text-ink">
                  {inviter.full_name}
                </span>{" "}
                ({ROLE_LABELS[inviter.role]})
              </>
            ) : null}
            .
          </p>
        </div>

        <Card className="space-y-4 p-5">
          <div className="rounded-2xl bg-[#F7F5F1] px-4 py-3 text-sm">
            <div className="flex justify-between gap-3 py-1">
              <span className="text-muted">Your role</span>
              <span className="font-semibold text-ink">
                {ROLE_LABELS[invite.role]}
              </span>
            </div>
            {invite.job_title ? (
              <div className="flex justify-between gap-3 py-1">
                <span className="text-muted">Job title</span>
                <span className="font-semibold text-ink">{invite.job_title}</span>
              </div>
            ) : null}
          </div>

          <div>
            <Label>Full name</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div>
            <Label>Phone (optional)</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
            />
          </div>
          <div>
            <Label>Create a password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div>
            <Label>Confirm password</Label>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          {error ? (
            <p className="text-sm font-semibold text-danger">{error}</p>
          ) : null}

          <Button
            className="w-full"
            size="lg"
            disabled={saving}
            onClick={() => void accept()}
          >
            {saving ? "Joining…" : "Accept invite & join"}
          </Button>
        </Card>
      </div>
    </div>
  );
}
