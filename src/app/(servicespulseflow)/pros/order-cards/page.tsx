"use client";

import { useEffect, useState } from "react";
import { OrderCard, RequestsEmpty, type CustomerOrder } from "@/components/pros/order-card";
import { useAppearance } from "@/lib/appearance/provider";

const photo = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="#3D4F8A"/></svg>')}`;

const base = {
  description: "The kitchen tap drips all day. Please look at the seal and the pipe under the sink.",
  whenLabel: "2026-11-13 · afternoon",
  area: "Rawai",
  shareLocation: null as string | null,
  personName: "Somsak Wattana",
  quoteNote: null,
  cancelReason: null,
  repliedAt: null,
  acceptedAt: null,
  chatHref: "/chat/preview",
  reviewHref: "/requests/preview",
} satisfies Omit<CustomerOrder, "id" | "state" | "createdAt" | "title" | "photos" | "priceLabel">;

const cards: CustomerOrder[] = [
  {
    ...base,
    id: "preview-waiting",
    state: "waiting",
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    title: "Kitchen tap keeps dripping",
    photos: [],
    priceLabel: null,
  },
  {
    ...base,
    id: "preview-price",
    state: "price",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    title: "Replace the outdoor light and check the switch",
    photos: [photo, photo, photo, photo],
    priceLabel: "1500-2200 THB",
    quoteNote: "Price covers the visit and the seal. The new tap is extra if you want one.",
    repliedAt: new Date().toISOString(),
  },
  {
    ...base,
    id: "preview-booked",
    state: "booked",
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    title: "Air conditioner service",
    photos: [photo],
    priceLabel: "1800 THB",
    shareLocation: "12/4 Moo 1, near 7-Eleven, Rawai",
    repliedAt: new Date().toISOString(),
    acceptedAt: new Date().toISOString(),
  },
  {
    ...base,
    id: "preview-done",
    state: "done",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    title: "Unblock the shower drain",
    photos: [],
    priceLabel: "900 THB",
    acceptedAt: new Date().toISOString(),
  },
  {
    ...base,
    id: "preview-cancelled",
    state: "cancelled",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    title: "Paint the bedroom wall",
    photos: [],
    priceLabel: null,
    cancelReason: "schedule",
  },
  {
    ...base,
    id: "preview-long",
    state: "price",
    createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    title: "Проверить проводку на кухне и заменить розетку у мойки, если она греется",
    photos: [],
    priceLabel: "2500 THB",
    area: "ป่าตอง",
  },
];

export default function OrderCardsPreviewPage() {
  const { appearance, setAppearance } = useAppearance();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const key = "pulseflow.services.calendarAdded.v1";
    const raw = localStorage.getItem(key);
    const ids = raw ? (JSON.parse(raw) as unknown) : [];
    const list = Array.isArray(ids) ? ids.filter((item) => typeof item === "string") : [];
    if (!list.includes("preview-booked-added")) {
      localStorage.setItem(key, JSON.stringify([...list, "preview-booked-added"]));
    }
    setReady(true);
  }, []);

  const bookedAdded: CustomerOrder = {
    ...cards[2],
    id: "preview-booked-added",
    title: "Garden tap repair",
  };

  return (
    <div className="mx-auto w-full max-w-[390px] space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-pf-22 font-bold text-pf-ink">Customer</h1>
        <button
          type="button"
          className="inline-flex min-h-11 items-center rounded-full border border-pf-line px-3 text-pf-14 font-medium text-pf-ink"
          onClick={() => setAppearance(appearance === "dark" ? "frost" : "dark")}
        >
          {appearance === "dark" ? "Light" : "Dark"}
        </button>
      </div>
      {cards.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
      {ready ? <OrderCard order={bookedAdded} /> : null}
      <RequestsEmpty href="/find" />
      <h2 className="pt-4 text-pf-22 font-bold text-pf-ink">Maintenance</h2>
      {cards.map((order) => (
        <OrderCard
          key={`staff-${order.id}`}
          audience="staff"
          order={{ ...order, id: `staff-${order.id}`, personName: "Nok Siri" }}
        />
      ))}
      {ready ? (
        <OrderCard
          audience="staff"
          order={{ ...bookedAdded, id: "staff-preview-booked-added", personName: "Nok Siri" }}
        />
      ) : null}
    </div>
  );
}
