import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  jsonError,
  requireGuestyManager,
} from "@/lib/integrations/guesty/auth";
import { syncGuestyOrg } from "@/lib/integrations/guesty/sync";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Pull Guesty listings into company villas and sync each export calendar.
 */
export async function POST(request: Request) {
  if (isDemoMode(request.headers.get("cookie"))) {
    return NextResponse.json(
      { error: "Guesty sync is unavailable in demo mode." },
      { status: 400 },
    );
  }

  const ip = clientIp(request);
  const rl = rateLimit(`guesty-sync:${ip}`, { limit: 6, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many syncs. Wait a minute." }, {
      status: 429,
    });
  }

  try {
    const auth = await requireGuestyManager();
    const admin = createAdminClient();
    const { data: row, error } = await admin
      .from("org_integrations")
      .select("client_id_cipher, client_secret_cipher, status")
      .eq("org_id", auth.orgId)
      .eq("provider", "guesty")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!row || row.status === "disconnected") {
      return NextResponse.json(
        { error: "Connect Guesty first (Client ID and Secret)." },
        { status: 400 },
      );
    }

    const summary = await syncGuestyOrg({
      orgId: auth.orgId,
      profileId: auth.profileId,
      clientIdCipher: row.client_id_cipher as string,
      clientSecretCipher: row.client_secret_cipher as string,
    });

    const now = new Date().toISOString();
    await admin
      .from("org_integrations")
      .update({
        status: summary.errors.length && !summary.created && !summary.updated
          ? "error"
          : "connected",
        last_error: summary.errors[0] ?? null,
        last_sync_at: now,
        listings_synced: summary.listingsSeen,
        updated_at: now,
      })
      .eq("org_id", auth.orgId)
      .eq("provider", "guesty");

    return NextResponse.json({ ok: true, summary });
  } catch (err) {
    const { status, message } = jsonError(err);
    try {
      const auth = await requireGuestyManager();
      const admin = createAdminClient();
      await admin
        .from("org_integrations")
        .update({
          status: "error",
          last_error: message,
          updated_at: new Date().toISOString(),
        })
        .eq("org_id", auth.orgId)
        .eq("provider", "guesty");
    } catch {
      /* ignore */
    }
    return NextResponse.json({ error: message }, { status });
  }
}
