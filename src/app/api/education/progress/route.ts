import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/env";
import {
  EDUCATION_STEP_IDS,
  emptyStepsMap,
  type EducationStepsMap,
} from "@/lib/education/steps";

export const runtime = "nodejs";

export type EducationProgressRow = {
  profile_id: string;
  started_at: string | null;
  current_step_id: string | null;
  steps: EducationStepsMap;
  completed_at: string | null;
  dismissed_at: string | null;
  updated_at: string;
};

function normalizeSteps(raw: unknown): EducationStepsMap {
  const base = emptyStepsMap();
  if (!raw || typeof raw !== "object") return base;
  const obj = raw as Record<string, { status?: string; at?: string }>;
  for (const id of EDUCATION_STEP_IDS) {
    const s = obj[id];
    if (s?.status === "done" || s?.status === "skipped" || s?.status === "pending") {
      base[id] = { status: s.status, at: s.at };
    }
  }
  return base;
}

export async function GET(request: Request) {
  if (isDemoMode(request.headers.get("cookie"))) {
    return NextResponse.json({ demo: true, progress: null });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("education_progress")
    .select("*")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (error) {
    // Table may not exist yet before migration
    if (/education_progress|schema cache|does not exist/i.test(error.message)) {
      return NextResponse.json({
        progress: null,
        needsMigration: true,
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ progress: null });
  }

  return NextResponse.json({
    progress: {
      ...data,
      steps: normalizeSteps(data.steps),
    } satisfies EducationProgressRow,
  });
}

export async function PATCH(request: Request) {
  if (isDemoMode(request.headers.get("cookie"))) {
    return NextResponse.json(
      { error: "Demo seats do not save education progress." },
      { status: 403 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    started_at?: string | null;
    current_step_id?: string | null;
    steps?: EducationStepsMap;
    completed_at?: string | null;
    dismissed_at?: string | null;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {
    profile_id: user.id,
    updated_at: new Date().toISOString(),
  };
  if ("started_at" in body) patch.started_at = body.started_at;
  if ("current_step_id" in body) patch.current_step_id = body.current_step_id;
  if ("steps" in body && body.steps) patch.steps = normalizeSteps(body.steps);
  if ("completed_at" in body) patch.completed_at = body.completed_at;
  if ("dismissed_at" in body) patch.dismissed_at = body.dismissed_at;

  const { data, error } = await supabase
    .from("education_progress")
    .upsert(patch, { onConflict: "profile_id" })
    .select("*")
    .single();

  if (error) {
    if (/education_progress|schema cache|does not exist/i.test(error.message)) {
      return NextResponse.json(
        { error: "Education progress table missing. Apply migration 065.", needsMigration: true },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    progress: {
      ...data,
      steps: normalizeSteps(data.steps),
    },
  });
}
