import { cn } from "@/lib/utils";

export type PfIconName =
  | "wind"
  | "droplets"
  | "zap"
  | "waves"
  | "bug"
  | "sparkles"
  | "wrench"
  | "truck"
  | "more"
  | "home"
  | "search"
  | "chat"
  | "clipboard"
  | "pin"
  | "camera"
  | "mic"
  | "person"
  | "check";

type Tone = "default" | "onNavy" | "muted" | "active";

const PATHS: Record<PfIconName, [string, string]> = {
  wind: ["M6 18h12a4 4 0 1 0-1.2-7.8A5 5 0 0 0 8 8a4 4 0 0 0 0 8h2", "M8 22h8"],
  droplets: ["M16 6s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z", "M16 20v2"],
  zap: ["M18 4 8 18h7l-1 10 10-14h-7l1-10z", "M14 16h4"],
  waves: ["M4 14c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2", "M4 20c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2"],
  bug: ["M12 14h8v4a4 4 0 0 1-8 0v-4zM16 10a3 3 0 1 1 0 6", "M8 16H6M26 16h-2M10 12 8 10M22 12l2-2"],
  sparkles: ["M16 6l1.4 4.2L22 12l-4.6 1.8L16 18l-1.4-4.2L10 12l4.6-1.8L16 6z", "M24 18l.7 2 2 .8-2 .7-.7 2-.7-2-2-.7 2-.8.7-2z"],
  wrench: ["M14 18 6 26l2 2 8-8", "M18 14a5 5 0 0 1 7-4l-3 3 2 2 3-3a5 5 0 0 1-4 7l-5-5z"],
  truck: ["M4 20V10h14v10H4z", "M18 14h6l4 4v2h-10"],
  more: ["M8 8h6v6H8zM18 8h6v6h-6zM8 18h6v6H8z", "M18 18h6v6h-6z"],
  home: ["M6 14 16 6l10 8v12H6V14z", "M13 26v-7h6v7"],
  search: ["M14 8a6 6 0 1 1 0 12 6 6 0 0 1 0-12z", "M18.5 18.5 24 24"],
  chat: ["M6 8h20v12H12l-6 4V8z", "M11 14h10"],
  clipboard: ["M10 8h12v18H10V8z", "M13 6h6v4h-6V6z"],
  pin: ["M16 28s8-8 8-14a8 8 0 1 0-16 0c0 6 8 14 8 14z", "M16 12a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"],
  camera: ["M8 11h3l2-3h6l2 3h3v12H8V11z", "M16 15a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"],
  mic: ["M16 6a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V9a3 3 0 0 1 3-3z", "M10 15a6 6 0 0 0 12 0M16 21v4"],
  person: ["M16 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z", "M8 26c1.5-4 4-6 8-6s6.5 2 8 6"],
  check: ["M8 17l5 5 11-12", "M8 17l5 5"],
};

export function PfIcon({
  name,
  tone = "default",
  className,
}: {
  name: PfIconName | string;
  tone?: Tone;
  className?: string;
}) {
  const [main, accent] = PATHS[name as PfIconName] ?? PATHS.more;
  const mainFill =
    tone === "onNavy" ? "#F5F7FC" : tone === "muted" ? "currentColor" : "var(--pf-ink)";
  const accentFill =
    tone === "muted" ? "currentColor" : tone === "active" || tone === "onNavy" || tone === "default"
      ? "var(--pf-orange-500)"
      : "currentColor";
  return (
    <svg viewBox="0 0 32 32" className={cn("shrink-0", className)} aria-hidden>
      <path
        d={main}
        fill="none"
        stroke={mainFill}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={accent}
        fill="none"
        stroke={accentFill}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
