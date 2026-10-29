/**
 * SSRF-hardened fetch for user-supplied URLs (listing enrich, iCal sync).
 * HTTPS only, blocks private/loopback after DNS, caps body size.
 */

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const PRIVATE_V4 =
  /^(10\.|127\.|169\.254\.|172\.(1[6-9]|2\d|3[0-1])\.|192\.168\.|0\.|100\.(6[4-9]|[7-9]\d|1[0-2]\d)\.)/;
const PRIVATE_V6 =
  /^(::1$|fc|fd|fe80|::ffff:(10\.|127\.|169\.254\.|172\.(1[6-9]|2\d|3[0-1])\.|192\.168\.))/i;

function isPrivateIp(ip: string): boolean {
  const bare = ip.replace(/^\[|\]$/g, "");
  if (isIP(bare) === 4) return PRIVATE_V4.test(bare);
  if (isIP(bare) === 6) return PRIVATE_V6.test(bare) || bare === "::";
  return true;
}

export async function assertSafePublicHttpsUrl(raw: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("Invalid URL");
  }
  if (parsed.protocol !== "https:") {
    throw new Error("Only https URLs are allowed");
  }
  if (parsed.username || parsed.password) {
    throw new Error("URLs with credentials are not allowed");
  }
  const host = parsed.hostname;
  if (!host || host === "localhost" || host.endsWith(".local")) {
    throw new Error("Host not allowed");
  }
  if (isIP(host) && isPrivateIp(host)) {
    throw new Error("Private IP addresses are not allowed");
  }
  if (!isIP(host)) {
    const records = await lookup(host, { all: true, verbatim: true });
    if (!records.length) throw new Error("Host could not be resolved");
    for (const r of records) {
      if (isPrivateIp(r.address)) {
        throw new Error("Host resolves to a private address");
      }
    }
  }
  return parsed;
}

export async function safeFetchText(
  rawUrl: string,
  options: {
    headers?: Record<string, string>;
    timeoutMs?: number;
    maxBytes?: number;
    accept?: string;
    redirectsLeft?: number;
  } = {},
): Promise<{ url: string; text: string; status: number }> {
  const parsed = await assertSafePublicHttpsUrl(rawUrl);
  const timeoutMs = options.timeoutMs ?? 15_000;
  const maxBytes = options.maxBytes ?? 400_000;
  const redirectsLeft = options.redirectsLeft ?? 3;

  const res = await fetch(parsed.toString(), {
    headers: {
      Accept: options.accept ?? "text/html,text/plain,*/*;q=0.8",
      "Cache-Control": "no-cache",
      "User-Agent": options.headers?.["User-Agent"] ?? "PulseFlow/1.0",
      ...options.headers,
    },
    signal: AbortSignal.timeout(timeoutMs),
    redirect: "manual",
  });

  if (res.status >= 300 && res.status < 400) {
    if (redirectsLeft <= 0) throw new Error("Too many redirects");
    const loc = res.headers.get("location");
    if (!loc) throw new Error("Redirect without location");
    const next = new URL(loc, parsed);
    return safeFetchText(next.toString(), {
      ...options,
      redirectsLeft: redirectsLeft - 1,
    });
  }

  const buf = await res.arrayBuffer();
  if (buf.byteLength > maxBytes) {
    throw new Error("Response too large");
  }
  const text = new TextDecoder("utf-8", { fatal: false }).decode(buf);
  return { url: parsed.toString(), text, status: res.status };
}
