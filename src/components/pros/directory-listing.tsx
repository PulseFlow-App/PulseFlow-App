"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Input, Textarea } from "@/components/ui/input";
import { isWorkAccount } from "@/lib/pros/intent";
import { servicesPath } from "@/lib/pros/paths";
import { usePros } from "@/lib/pros/store";

type Listing = {
  id: string;
  job_search_visible: boolean;
  job_search_bio: string | null;
  job_search_location: string | null;
  job_search_country: string | null;
};

export function DirectoryListingCard() {
  const { actor, t } = usePros();
  const pathname = usePathname();
  const [listing, setListing] = useState<Listing | null>(null);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [place, setPlace] = useState("");
  const [about, setAbout] = useState("");
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!actor || actor.role === "guest") {
      setReady(true);
      return;
    }
    let cancel = false;
    void fetch("/api/services/profile", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: { eligible?: boolean; profile?: Listing | null } | null) => {
        if (cancel) return;
        const row = payload?.eligible ? payload.profile ?? null : null;
        setListing(row);
        if (row) {
          setVisible(Boolean(row.job_search_visible));
          setPlace(row.job_search_location ?? "");
          setAbout(row.job_search_bio ?? "");
        }
        setReady(true);
      })
      .catch(() => {
        if (!cancel) setReady(true);
      });
    return () => {
      cancel = true;
    };
  }, [actor]);

  if (!actor || actor.role === "guest") return null;
  if (!ready) {
    if (!isWorkAccount(actor)) return null;
    return (
      <section id="your-profile" className="space-y-3 rounded-[20px] border border-pf-line bg-pf-card p-4">
        <h2 className="text-pf-22 font-bold tracking-[-0.02em] text-pf-ink">{t("yourProfile")}</h2>
      </section>
    );
  }
  if (!listing) return null;

  const save = (nextVisible: boolean) => {
    setSaving(true);
    setNote(null);
    setError(null);
    void fetch("/api/services/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visible: nextVisible,
        bio: about.trim() || null,
        location: place.trim() || null,
        country: listing.job_search_country,
      }),
    })
      .then(async (res) => {
        const payload = (await res.json()) as { error?: string; profile?: Listing };
        if (!res.ok || !payload.profile) throw new Error(payload.error ?? "Could not save the profile.");
        setListing(payload.profile);
        setVisible(Boolean(payload.profile.job_search_visible));
        setNote(payload.profile.job_search_visible ? t("profileShown") : t("profileHidden"));
        window.dispatchEvent(new Event("pros-refresh"));
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not save the profile.");
      })
      .finally(() => setSaving(false));
  };

  return (
    <section id="your-profile" className="space-y-3 rounded-[20px] border border-pf-line bg-pf-card p-4">
      <h2 className="text-pf-22 font-bold tracking-[-0.02em] text-pf-ink">{t("yourProfile")}</h2>
      <p className="text-pf-16 leading-relaxed text-pf-text-secondary">{t("yourProfileBody")}</p>
      <label className="block space-y-1">
        <span className="text-pf-14 font-medium text-pf-ink">{t("profilePlace")}</span>
        <Input value={place} onChange={(event) => setPlace(event.target.value)} />
      </label>
      <label className="block space-y-1">
        <span className="text-pf-14 font-medium text-pf-ink">{t("profileAbout")}</span>
        <Textarea value={about} onChange={(event) => setAbout(event.target.value)} rows={3} />
      </label>
      {error ? <p className="text-pf-14 text-pf-danger-ink">{error}</p> : null}
      {note ? <p className="text-pf-14 font-medium text-pf-ink">{note}</p> : null}
      <button
        type="button"
        disabled={saving}
        onClick={() => save(!visible)}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-pf-line bg-pf-card px-4 text-pf-16 font-medium text-pf-ink disabled:opacity-60"
      >
        {visible ? t("hideProfile") : t("showProfile")}
      </button>
      {visible ? (
        <Link
          href={servicesPath(pathname, `/p/${listing.id}`)}
          className="inline-flex min-h-11 w-full items-center justify-center text-pf-16 font-medium text-pf-ink"
        >
          {t("seeProfile")}
        </Link>
      ) : null}
    </section>
  );
}
