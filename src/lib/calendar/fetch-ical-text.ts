/**
 * Server-only iCal download (SSRF-hardened). Do not import from client components.
 */
import { normalizeIcalUrl } from "@/lib/calendar/parse-ics";
import { safeFetchText } from "@/lib/security/safe-fetch";

export async function fetchIcalText(feedUrl: string): Promise<string> {
  const normalized = normalizeIcalUrl(feedUrl);
  if (!normalized) throw new Error("Invalid calendar URL");

  const { status, text } = await safeFetchText(normalized, {
    accept: "text/calendar, text/plain, */*",
    headers: { "User-Agent": "PulseFlow-CalendarSync/1.0" },
    timeoutMs: 20_000,
    maxBytes: 2_000_000,
  });

  if (status >= 400) {
    throw new Error(`Calendar feed returned ${status}`);
  }

  if (!/BEGIN:VCALENDAR/i.test(text)) {
    throw new Error("URL did not return a calendar (.ics) feed");
  }
  return text;
}
