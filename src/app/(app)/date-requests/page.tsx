"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, LoadingState } from "@/components/ui/empty-state";
import { useData } from "@/lib/data/use-app-data";
import { formatShortDate } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { useLocalizedDemoText } from "@/lib/demo/use-localized-demo-text";

export default function DateRequestsPage() {
  const data = useData();
  const { t } = useI18n();
  const label = useLocalizedDemoText();
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canRespond =
    data.profile?.role === "owner" || data.profile?.role === "manager";

  const pending = useMemo(
    () =>
      data.stayDateRequests
        .filter((r) => r.status === "pending")
        .sort(
          (a, b) =>
            +new Date(b.created_at) - +new Date(a.created_at),
        ),
    [data.stayDateRequests],
  );

  const handled = useMemo(
    () =>
      data.stayDateRequests
        .filter((r) => r.status !== "pending")
        .sort(
          (a, b) =>
            +new Date(b.created_at) - +new Date(a.created_at),
        )
        .slice(0, 8),
    [data.stayDateRequests],
  );

  useEffect(() => {
    if (!data.ready || !data.profile) return;
    if (!canRespond) router.replace("/home");
  }, [data.ready, data.profile, canRespond, router]);

  if (!data.ready || !data.profile) return <LoadingState />;
  if (!canRespond) return <LoadingState />;

  const respond = async (
    requestId: string,
    decision: "accepted" | "declined",
  ) => {
    setBusyId(requestId);
    setError(null);
    try {
      await data.respondStayDateRequest(requestId, decision);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4 animate-rise">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">
          {t("dateRequests.title")}
        </h1>
        <p className="text-sm text-muted">{t("dateRequests.subtitle")}</p>
      </div>

      {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}

      {!pending.length ? (
        <EmptyState
          title={t("dateRequests.empty")}
          description={t("dateRequests.emptyHint")}
        />
      ) : (
        <ul className="space-y-3">
          {pending.map((r) => {
            const guest = data.profiles.find(
              (p) => p.id === r.guest_profile_id,
            );
            const villa =
              data.allOrgVillas.find((v) => v.id === r.villa_id) ??
              data.villas.find((v) => v.id === r.villa_id);
            return (
              <li key={r.id}>
                <Card className="space-y-3 p-4">
                  <div>
                    <p className="font-display text-lg font-bold text-ink">
                      {label(villa?.name ?? t("dateRequests.unknownVilla"))}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {guest?.full_name ?? t("roles.guest")}
                      {" · "}
                      {formatShortDate(r.check_in)} →{" "}
                      {formatShortDate(r.check_out)}
                    </p>
                    {r.note ? (
                      <p className="mt-2 text-sm text-ink">{r.note}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      disabled={busyId === r.id}
                      onClick={() => void respond(r.id, "accepted")}
                    >
                      {t("dateRequests.accept")}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={busyId === r.id}
                      onClick={() => void respond(r.id, "declined")}
                    >
                      {t("dateRequests.decline")}
                    </Button>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {handled.length ? (
        <div className="space-y-2">
          <h2 className="font-display text-base font-bold text-ink">
            {t("dateRequests.recent")}
          </h2>
          <ul className="space-y-2">
            {handled.map((r) => {
              const guest = data.profiles.find(
                (p) => p.id === r.guest_profile_id,
              );
              const villa =
                data.allOrgVillas.find((v) => v.id === r.villa_id) ??
                data.villas.find((v) => v.id === r.villa_id);
              return (
                <li key={r.id}>
                  <Card className="px-4 py-3 text-sm">
                    <p className="font-semibold text-ink">
                      {label(villa?.name ?? t("dateRequests.unknownVilla"))}
                    </p>
                    <p className="text-muted">
                      {guest?.full_name ?? t("roles.guest")}
                      {" · "}
                      {formatShortDate(r.check_in)} →{" "}
                      {formatShortDate(r.check_out)}
                      {" · "}
                      <span className="capitalize">{r.status}</span>
                    </p>
                  </Card>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
