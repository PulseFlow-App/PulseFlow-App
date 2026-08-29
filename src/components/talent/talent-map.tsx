"use client";

import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { TalentSearchResult } from "@/lib/talent";
import { formatTalentPlace } from "@/lib/talent";

type Props = {
  results: TalentSearchResult[];
  center?: { lat: number; lng: number } | null;
};

export function TalentMap({ results, center }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  const pins = useMemo(
    () =>
      results.filter(
        (p) =>
          typeof p.job_search_lat === "number" &&
          typeof p.job_search_lng === "number",
      ),
    [results],
  );

  useEffect(() => {
    if (!hostRef.current || mapRef.current) return;
    const map = L.map(hostRef.current, {
      scrollWheelZoom: false,
      attributionControl: true,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    map.setView([15, 100], 3);
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    const icon = L.divIcon({
      className: "pf-talent-pin",
      html: `<span style="display:block;width:14px;height:14px;border-radius:999px;background:#F26A36;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.25)"></span>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });

    const bounds: L.LatLngExpression[] = [];
    for (const person of pins) {
      const lat = person.job_search_lat!;
      const lng = person.job_search_lng!;
      bounds.push([lat, lng]);
      const place = formatTalentPlace(person);
      L.marker([lat, lng], { icon })
        .bindPopup(
          `<strong>${person.full_name}</strong>${
            place ? `<br/>${place}` : ""
          }`,
        )
        .addTo(layer);
    }

    if (center) {
      bounds.push([center.lat, center.lng]);
      L.circleMarker([center.lat, center.lng], {
        radius: 7,
        color: "#1F6B5A",
        fillColor: "#1F6B5A",
        fillOpacity: 0.85,
      })
        .bindPopup("Search center")
        .addTo(layer);
    }

    if (bounds.length === 1) {
      map.setView(bounds[0], 11);
    } else if (bounds.length > 1) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [28, 28] });
    } else if (center) {
      map.setView([center.lat, center.lng], 9);
    }
  }, [pins, center]);

  return (
    <div
      ref={hostRef}
      className="h-64 w-full overflow-hidden rounded-2xl border border-black/5"
    />
  );
}
