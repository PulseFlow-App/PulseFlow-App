export type GuestyListing = {
  id: string;
  title: string;
  nickname: string | null;
  address: string | null;
  timezone: string | null;
  pictureUrl: string | null;
};

type TokenCache = { token: string; expiresAt: number };

const tokenCache = new Map<string, TokenCache>();

const GUESTY_API = "https://open-api.guesty.com";

async function guestyFetch(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(`${GUESTY_API}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
}

export async function guestyGetAccessToken(
  clientId: string,
  clientSecret: string,
): Promise<string> {
  const cacheKey = clientId;
  const cached = tokenCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now() + 60_000) {
    return cached.token;
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope: "open-api",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(`${GUESTY_API}/oauth2/token`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const json = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
    message?: string;
  };

  if (!res.ok || !json.access_token) {
    throw new Error(
      json.error_description ||
        json.message ||
        json.error ||
        `Guesty auth failed (${res.status})`,
    );
  }

  const expiresIn = Number(json.expires_in) || 86_400;
  tokenCache.set(cacheKey, {
    token: json.access_token,
    expiresAt: Date.now() + expiresIn * 1000,
  });
  return json.access_token;
}

function pickListing(raw: Record<string, unknown>): GuestyListing | null {
  const id = String(raw._id ?? raw.id ?? "").trim();
  if (!id) return null;
  const title =
    String(raw.title ?? raw.nickname ?? raw.name ?? "").trim() ||
    `Guesty ${id.slice(-6)}`;
  const nickname = raw.nickname != null ? String(raw.nickname) : null;
  const addressObj = raw.address as Record<string, unknown> | string | null;
  let address: string | null = null;
  if (typeof addressObj === "string") address = addressObj;
  else if (addressObj && typeof addressObj === "object") {
    address =
      [
        addressObj.full,
        addressObj.street,
        addressObj.city,
        addressObj.country,
      ]
        .map((x) => (x != null ? String(x).trim() : ""))
        .filter(Boolean)
        .join(", ") || null;
  }
  const picture =
    (raw.picture as { thumbnail?: string; regular?: string } | undefined)
      ?.regular ||
    (raw.picture as { thumbnail?: string } | undefined)?.thumbnail ||
    (typeof raw.picture === "string" ? raw.picture : null) ||
    null;

  return {
    id,
    title,
    nickname,
    address,
    timezone: raw.timezone != null ? String(raw.timezone) : null,
    pictureUrl: picture ? String(picture) : null,
  };
}

export async function guestyListListings(
  token: string,
): Promise<GuestyListing[]> {
  const out: GuestyListing[] = [];
  let skip = 0;
  const limit = 100;

  for (let page = 0; page < 20; page += 1) {
    const res = await guestyFetch(
      `/v1/listings?limit=${limit}&skip=${skip}`,
      token,
    );
    const json = (await res.json().catch(() => ({}))) as {
      results?: Record<string, unknown>[];
      data?: Record<string, unknown>[];
      listings?: Record<string, unknown>[];
      message?: string;
      error?: string;
    };
    if (!res.ok) {
      throw new Error(
        json.message || json.error || `Guesty listings failed (${res.status})`,
      );
    }
    const rows = json.results ?? json.data ?? json.listings ?? [];
    for (const row of rows) {
      const listing = pickListing(row);
      if (listing) out.push(listing);
    }
    if (rows.length < limit) break;
    skip += limit;
  }

  return out;
}

/**
 * Ensure Guesty has an exported iCal for the listing; return the feed URL.
 */
export async function guestyEnsureExportIcalUrl(
  token: string,
  listingId: string,
): Promise<string | null> {
  const getRes = await guestyFetch(
    `/v1/exported-calendar?listingId=${encodeURIComponent(listingId)}`,
    token,
  );
  if (getRes.ok) {
    const json = (await getRes.json().catch(() => ({}))) as {
      results?: Array<{ url?: string; icalUrl?: string }>;
      data?: Array<{ url?: string; icalUrl?: string }>;
      url?: string;
      icalUrl?: string;
    };
    const rows = json.results ?? json.data ?? [];
    const first = rows[0];
    const existing =
      first?.url || first?.icalUrl || json.url || json.icalUrl || null;
    if (existing) return String(existing);
  }

  const createRes = await guestyFetch(`/v1/exported-calendar`, token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ listingId }),
  });
  const created = (await createRes.json().catch(() => ({}))) as {
    url?: string;
    icalUrl?: string;
    results?: { url?: string; icalUrl?: string };
    data?: { url?: string; icalUrl?: string };
    message?: string;
    error?: string;
  };
  if (!createRes.ok) {
    // Listing may already have an export that GET shaped oddly — not fatal.
    console.warn(
      "[guesty] export create failed",
      listingId,
      created.message || created.error || createRes.status,
    );
    return null;
  }
  return (
    created.url ||
    created.icalUrl ||
    created.results?.url ||
    created.results?.icalUrl ||
    created.data?.url ||
    created.data?.icalUrl ||
    null
  );
}
