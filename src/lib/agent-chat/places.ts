export type PlaceHit = {
  label: string;
  area: string | null;
  mapsUrl: string;
};

export async function lookupFamousPlace(query: string): Promise<PlaceHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const url = `/api/places/search?q=${encodeURIComponent(q)}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = (await res.json()) as { places?: PlaceHit[] };
  return data.places ?? [];
}

export function mapsSearchUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query.trim())}`;
}
