/**
 * Mobile detection for wallet UX (e.g. show WalletConnect hint).
 * Prefer WalletConnect so the PWA stays in focus; user opens wallet app, signs, returns here.
 */
export function isMobile(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}
