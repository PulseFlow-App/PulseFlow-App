import {
  APP_UPDATED_AT,
  APP_VERSION,
  resolveServerBuildId,
} from "@/lib/app-version";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    {
      version: APP_VERSION,
      updatedAt: APP_UPDATED_AT,
      buildId: resolveServerBuildId(),
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
