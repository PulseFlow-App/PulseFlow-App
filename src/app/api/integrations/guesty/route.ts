import { NextResponse } from "next/server";
import { z } from "zod";
import { isDemoMode } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  jsonError,
  requireGuestyManager,
} from "@/lib/integrations/guesty/auth";
import { encryptSecret } from "@/lib/integrations/secrets";
import { guestyGetAccessToken } from "@/lib/integrations/guesty/client";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

const connectSchema = z.object({
  clientId: z.string().trim().min(8).max(200),
  clientSecret: z.string().trim().min(8).max(200),
  orgId: z.string().uuid().optional(),
});

/** Status of Guesty connection for the active company (no secrets). */
export async function GET(request: Request) {
  if (isDemoMode(request.headers.get("cookie"))) {
    return NextResponse.json({
      connected: false,
      demo: true,
    });
  }

  try {
    const auth = await requireGuestyManager();
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("org_integrations")
      .select(
        "status, last_error, last_sync_at, listings_synced, updated_at, created_at",
      )
      .eq("org_id", auth.orgId)
      .eq("provider", "guesty")
      .maybeSingle();

    if (error) {
      if (/org_integrations|does not exist/i.test(error.message)) {
        return NextResponse.json({
          connected: false,
          needsMigration: true,
        });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.status === "disconnected") {
      return NextResponse.json({ connected: false });
    }

    return NextResponse.json({
      connected: true,
      status: data.status,
      lastError: data.last_error,
      lastSyncAt: data.last_sync_at,
      listingsSynced: data.listings_synced,
      updatedAt: data.updated_at,
      createdAt: data.created_at,
    });
  } catch (err) {
    const { status, message } = jsonError(err);
    return NextResponse.json({ error: message }, { status });
  }
}

/** Save Guesty Client ID + Secret (encrypted) after a live auth check. */
export async function POST(request: Request) {
  if (isDemoMode(request.headers.get("cookie"))) {
    return NextResponse.json(
      { error: "Guesty connect is unavailable in demo mode." },
      { status: 400 },
    );
  }

  const ip = clientIp(request);
  const rl = rateLimit(`guesty-connect:${ip}`, {
    limit: 10,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many attempts." }, { status: 429 });
  }

  try {
    const body = connectSchema.parse(await request.json());
    const auth = await requireGuestyManager(body.orgId);

    // Prove credentials before storing.
    await guestyGetAccessToken(body.clientId, body.clientSecret);

    const admin = createAdminClient();
    const now = new Date().toISOString();
    const { error } = await admin.from("org_integrations").upsert(
      {
        org_id: auth.orgId,
        provider: "guesty",
        client_id_cipher: encryptSecret(body.clientId),
        client_secret_cipher: encryptSecret(body.clientSecret),
        status: "connected",
        last_error: null,
        connected_by: auth.profileId,
        updated_at: now,
      },
      { onConflict: "org_id,provider" },
    );

    if (error) {
      if (/org_integrations|does not exist/i.test(error.message)) {
        return NextResponse.json(
          {
            error:
              "Database migration 064 is required before Guesty can connect.",
          },
          { status: 503 },
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ connected: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid credentials format." }, {
        status: 400,
      });
    }
    const { status, message } = jsonError(err);
    return NextResponse.json({ error: message }, { status });
  }
}

/** Disconnect Guesty (delete stored credentials). */
export async function DELETE(request: Request) {
  if (isDemoMode(request.headers.get("cookie"))) {
    return NextResponse.json({ ok: true, demo: true });
  }

  try {
    const auth = await requireGuestyManager();
    const admin = createAdminClient();
    const { error } = await admin
      .from("org_integrations")
      .delete()
      .eq("org_id", auth.orgId)
      .eq("provider", "guesty");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const { status, message } = jsonError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
