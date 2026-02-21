/**
 * Phantom mobile deeplink: open our app inside Phantom's in-app browser so the user
 * can connect (window.solana is available there). Use this instead of phantom.app
 * which only shows the download page.
 * @see https://docs.phantom.com/phantom-deeplinks/other-methods/browse
 */
export function getPhantomBrowseUrl(): string {
  if (typeof window === 'undefined') return 'https://phantom.app/';
  const url = window.location.href;
  const ref = window.location.origin;
  return `https://phantom.app/ul/browse/${encodeURIComponent(url)}?ref=${encodeURIComponent(ref)}`;
}

export function isMobile(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}
