/**
 * Icons for "what affects what" in Body Signals insights.
 * Maps signal keywords (from API explanation bullets) to Iconify Solar icons.
 */
import { Icon } from '@iconify/react';

const SIGNAL_ICONS: Record<string, string> = {
  sleep: 'solar:moon-stars-linear',
  stress: 'solar:brain-linear',
  mood: 'solar:heart-linear',
  energy: 'solar:bolt-circle-linear',
  appetite: 'solar:hamburger-linear',
  digestion: 'solar:cup-linear',
  hydration: 'solar:water-drops-linear',
  cumulative: 'solar:chart-2-linear',
  moderate: 'solar:chart-2-linear',
};

/** Detect primary signal from a bullet line (e.g. "Sleep quality is the main driver") */
function getIconForLine(line: string): string {
  const lower = line.toLowerCase();
  if (/\bsleep\b/.test(lower)) return SIGNAL_ICONS.sleep;
  if (/\bstress\b/.test(lower)) return SIGNAL_ICONS.stress;
  if (/\bmood\b/.test(lower)) return SIGNAL_ICONS.mood;
  if (/\benergy\b/.test(lower)) return SIGNAL_ICONS.energy;
  if (/\bappetite\b/.test(lower)) return SIGNAL_ICONS.appetite;
  if (/\bdigestion\b/.test(lower)) return SIGNAL_ICONS.digestion;
  if (/\bhydrat/.test(lower)) return SIGNAL_ICONS.hydration;
  if (/\bcumulative\b|\bmoderate\b|\brange\b/.test(lower)) return SIGNAL_ICONS.cumulative;
  return SIGNAL_ICONS.cumulative;
}

/** Strip leading bullet and trim */
function normalizeBullet(text: string): string {
  return text.replace(/^[•·]\s*/, '').trim();
}

export type ExplanationBullet = { icon: string; text: string };

/** Split explanation string into bullets with icon keys for display */
export function getExplanationBullets(explanation: string): ExplanationBullet[] {
  if (!explanation || !explanation.trim()) return [];
  const lines = explanation.split('\n').map((s) => s.trim()).filter(Boolean);
  return lines.map((line) => ({
    icon: getIconForLine(line),
    text: normalizeBullet(line),
  }));
}

type SignalIconProps = {
  icon: string;
  className?: string;
  ariaLabel?: string;
};

export function SignalIcon({ icon, className, ariaLabel }: SignalIconProps) {
  return (
    <span
      className={className}
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
    >
      <Icon icon={icon} width={18} height={18} />
    </span>
  );
}
