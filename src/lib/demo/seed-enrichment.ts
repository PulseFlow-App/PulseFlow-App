/**
 * Extra demo rows layered onto the base seed for screenshot-ready screens.
 * Kept separate so the base seed stays readable.
 */
import type {
  AppNotification,
  Bill,
  GuestBriefing,
  GuestCharge,
  GuestDeposit,
  GuestStay,
  HouseGuide,
  Message,
  ServiceOrder,
  StayDateRequest,
  StayPhoto,
  SupportMessage,
  Task,
  Villa,
  VillaAssignment,
} from "@/lib/types";
import { makeNotification } from "@/lib/notifications";
import {
  DEMO_CLEANER_ID,
  DEMO_DEPOSIT_ID,
  DEMO_EMPLOYEE_ID,
  DEMO_GUEST_ID,
  DEMO_ORG_ID,
  DEMO_OWNER_ID,
  DEMO_STAY_ID,
  VILLA_IDS,
  demoPropertyPhoto,
} from "./seed-data";

function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number) {
  return daysFromNow(-n);
}

const PROPERTY_PHOTO_BY_ID: Record<string, string> = {
  [VILLA_IDS.lotus]: demoPropertyPhoto("lotus"),
  [VILLA_IDS.palm]: demoPropertyPhoto("palm"),
  [VILLA_IDS.coral]: demoPropertyPhoto("coral"),
  [VILLA_IDS.jungle]: demoPropertyPhoto("jungle"),
  [VILLA_IDS.sunset]: demoPropertyPhoto("sunset"),
  [VILLA_IDS.bamboo]: demoPropertyPhoto("bamboo"),
  [VILLA_IDS.cliff]: demoPropertyPhoto("cliff"),
  [VILLA_IDS.tide]: demoPropertyPhoto("tide"),
  [VILLA_IDS.reef]: demoPropertyPhoto("reef"),
  [VILLA_IDS.office]: demoPropertyPhoto("office"),
};

export const STAY_LOTUS_UPCOMING = "77777777-7777-4777-8777-777777777781";
export const STAY_PALM_DONE = "77777777-7777-4777-8777-777777777782";
export const STAY_CORAL_ACTIVE = "77777777-7777-4777-8777-777777777783";
export const DEPOSIT_PALM = "77777777-7777-4777-8777-777777777784";
export const DEPOSIT_CORAL = "77777777-7777-4777-8777-777777777785";
export const ORDER_POOL = "77777777-7777-4777-8777-777777777786";
export const ORDER_GARDEN = "77777777-7777-4777-8777-777777777787";
export const ORDER_DONE = "77777777-7777-4777-8777-777777777788";

/** Push richer occupancy / cleaning states onto company villas + real photos. */
export function enrichDemoVillas(villas: Villa[]): Villa[] {
  return villas.map((v) => {
    const photo_url = PROPERTY_PHOTO_BY_ID[v.id] ?? v.photo_url;
    if (v.id === VILLA_IDS.office) {
      return {
        ...v,
        photo_url,
        property_type: "office",
        status: "available",
        check_in: null,
        check_out: null,
        cleaning_status: "done",
        notes: "Office for rent · showings by appointment.",
      };
    }
    if (v.id === VILLA_IDS.bamboo) {
      return {
        ...v,
        photo_url,
        property_type: v.property_type ?? "bungalow",
        status: "turnover",
        check_in: daysFromNow(0),
        check_out: daysFromNow(5),
        cleaning_status: "in_progress",
        notes: "Same-day turnover · linen change in progress.",
      };
    }
    if (v.id === VILLA_IDS.coral) {
      return {
        ...v,
        photo_url,
        property_type: v.property_type ?? "bungalow",
        status: "occupied",
        check_in: daysAgo(1),
        check_out: daysFromNow(4),
        cleaning_status: "not_needed",
        notes: "Long-stay guest · quiet hours requested.",
      };
    }
    if (v.id === VILLA_IDS.tide) {
      return {
        ...v,
        photo_url,
        property_type: v.property_type ?? "bungalow",
        status: "turnover",
        check_in: daysFromNow(1),
        check_out: daysFromNow(7),
        cleaning_status: "in_progress",
        notes: "Personal side booking · clean before arrival.",
      };
    }
    if (v.id === VILLA_IDS.reef) {
      return {
        ...v,
        photo_url,
        property_type: v.property_type ?? "bungalow",
        status: "occupied",
        check_in: daysAgo(3),
        check_out: daysFromNow(2),
        cleaning_status: "not_needed",
        notes: "Nok side client · checkout in 2 days.",
      };
    }
    if (v.id === VILLA_IDS.cliff) {
      return {
        ...v,
        photo_url,
        property_type: v.property_type ?? "studio",
      };
    }
    if (
      v.id === VILLA_IDS.lotus ||
      v.id === VILLA_IDS.palm ||
      v.id === VILLA_IDS.jungle ||
      v.id === VILLA_IDS.sunset
    ) {
      return {
        ...v,
        photo_url,
        property_type: v.property_type ?? "villa",
      };
    }
    return { ...v, photo_url };
  });
}

export const extraTasks: Task[] = [
  {
    id: "cccccccc-cccc-4ccc-8ccc-cccccccccca1",
    org_id: DEMO_ORG_ID,
    villa_id: VILLA_IDS.sunset,
    title: "Urgent: guest reports leak under sink",
    priority: "urgent",
    assigned_to: DEMO_EMPLOYEE_ID,
    status: "open",
    due_date: daysFromNow(0),
    time_start: "10:30",
    time_end: "11:30",
    created_by: DEMO_OWNER_ID,
    created_at: daysAgo(0) + "T06:40:00.000Z",
    completed_at: null,
    notes: null,
    service_order_id: null,
  },
  {
    id: "cccccccc-cccc-4ccc-8ccc-cccccccccca2",
    org_id: DEMO_ORG_ID,
    villa_id: VILLA_IDS.bamboo,
    title: "Same-day turnover: Bamboo Nest",
    priority: "urgent",
    assigned_to: DEMO_CLEANER_ID,
    status: "open",
    due_date: daysFromNow(0),
    time_start: "13:00",
    time_end: "16:00",
    created_by: DEMO_EMPLOYEE_ID,
    created_at: daysAgo(0) + "T05:50:00.000Z",
    completed_at: null,
    notes: null,
    service_order_id: null,
  },
  {
    id: "cccccccc-cccc-4ccc-8ccc-cccccccccca3",
    org_id: DEMO_ORG_ID,
    villa_id: VILLA_IDS.palm,
    title: "Pool shock treatment after turnover",
    priority: "urgent",
    assigned_to: DEMO_CLEANER_ID,
    status: "open",
    due_date: daysFromNow(0),
    time_start: "15:00",
    time_end: "16:00",
    created_by: DEMO_OWNER_ID,
    created_at: daysAgo(0) + "T08:10:00.000Z",
    completed_at: null,
    notes: null,
    service_order_id: ORDER_POOL,
  },
  {
    id: "cccccccc-cccc-4ccc-8ccc-cccccccccca4",
    org_id: DEMO_ORG_ID,
    villa_id: VILLA_IDS.coral,
    title: "Garden trim before weekend photos",
    priority: "normal",
    assigned_to: DEMO_EMPLOYEE_ID,
    status: "open",
    due_date: daysFromNow(2),
    time_start: "09:00",
    time_end: "11:00",
    created_by: DEMO_OWNER_ID,
    created_at: daysAgo(1) + "T16:00:00.000Z",
    completed_at: null,
    notes: null,
    service_order_id: ORDER_GARDEN,
  },
  {
    id: "cccccccc-cccc-4ccc-8ccc-cccccccccca5",
    org_id: DEMO_ORG_ID,
    villa_id: VILLA_IDS.lotus,
    title: "Restock minibar & water",
    priority: "normal",
    assigned_to: DEMO_CLEANER_ID,
    status: "open",
    due_date: daysFromNow(1),
    time_start: "10:00",
    time_end: "10:30",
    created_by: DEMO_EMPLOYEE_ID,
    created_at: daysAgo(0) + "T11:00:00.000Z",
    completed_at: null,
    notes: null,
    service_order_id: null,
  },
  {
    id: "cccccccc-cccc-4ccc-8ccc-cccccccccca6",
    org_id: DEMO_ORG_ID,
    villa_id: VILLA_IDS.jungle,
    title: "Lock property after AC repair",
    priority: "normal",
    assigned_to: DEMO_EMPLOYEE_ID,
    status: "open",
    due_date: daysFromNow(0),
    time_start: "16:00",
    time_end: "16:20",
    created_by: DEMO_OWNER_ID,
    created_at: daysAgo(0) + "T08:20:00.000Z",
    completed_at: null,
    notes: null,
    service_order_id: null,
  },
  {
    id: "cccccccc-cccc-4ccc-8ccc-cccccccccca7",
    org_id: DEMO_ORG_ID,
    villa_id: VILLA_IDS.palm,
    title: "Replace pool filter cartridge",
    priority: "normal",
    assigned_to: DEMO_CLEANER_ID,
    status: "done",
    due_date: daysAgo(1),
    time_start: "11:00",
    time_end: "12:00",
    created_by: DEMO_OWNER_ID,
    created_at: daysAgo(3) + "T09:00:00.000Z",
    completed_at: daysAgo(1) + "T12:15:00.000Z",
    notes: null,
    service_order_id: ORDER_DONE,
  },
  {
    id: "cccccccc-cccc-4ccc-8ccc-cccccccccca8",
    org_id: DEMO_ORG_ID,
    villa_id: VILLA_IDS.sunset,
    title: "Photo inventory before checkout",
    priority: "normal",
    assigned_to: DEMO_EMPLOYEE_ID,
    status: "done",
    due_date: daysAgo(0),
    time_start: "08:00",
    time_end: "08:40",
    created_by: DEMO_OWNER_ID,
    created_at: daysAgo(1) + "T19:00:00.000Z",
    completed_at: daysAgo(0) + "T08:35:00.000Z",
    notes: null,
    service_order_id: null,
  },
];

export const extraServiceOrders: ServiceOrder[] = [
  {
    id: ORDER_POOL,
    org_id: DEMO_ORG_ID,
    contact_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
    staff_profile_id: DEMO_CLEANER_ID,
    ordered_by: DEMO_OWNER_ID,
    villa_id: VILLA_IDS.palm,
    location_label: "Palm Villa",
    service_type: "Pool shock treatment",
    details: "After deep clean · shock + brush walls · test chlorine.",
    scheduled_date: daysFromNow(0),
    time_start: "15:00",
    time_end: "16:00",
    status: "agreed",
    agreed_at: daysAgo(0) + "T09:00:00.000Z",
    chat_message_id: null,
    task_id: "cccccccc-cccc-4ccc-8ccc-cccccccccca3",
    created_at: daysAgo(0) + "T08:15:00.000Z",
  },
  {
    id: ORDER_GARDEN,
    org_id: DEMO_ORG_ID,
    contact_id: null,
    staff_profile_id: DEMO_EMPLOYEE_ID,
    ordered_by: DEMO_OWNER_ID,
    villa_id: VILLA_IDS.coral,
    location_label: "Coral Bungalow",
    service_type: "Garden trim",
    details: "Hedge + lawn before weekend listing photos.",
    scheduled_date: daysFromNow(2),
    time_start: "09:00",
    time_end: "11:00",
    status: "pending_ack",
    agreed_at: null,
    chat_message_id: null,
    task_id: "cccccccc-cccc-4ccc-8ccc-cccccccccca4",
    created_at: daysAgo(1) + "T16:05:00.000Z",
  },
  {
    id: ORDER_DONE,
    org_id: DEMO_ORG_ID,
    contact_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
    staff_profile_id: DEMO_CLEANER_ID,
    ordered_by: DEMO_EMPLOYEE_ID,
    villa_id: VILLA_IDS.palm,
    location_label: "Palm Villa",
    service_type: "Pool filter swap",
    details: "Cartridge replaced · old one disposed.",
    scheduled_date: daysAgo(1),
    time_start: "11:00",
    time_end: "12:00",
    status: "done",
    agreed_at: daysAgo(2) + "T10:00:00.000Z",
    chat_message_id: null,
    task_id: "cccccccc-cccc-4ccc-8ccc-cccccccccca7",
    created_at: daysAgo(3) + "T09:10:00.000Z",
  },
];

export const extraBills: Bill[] = [
  {
    id: "dddddddd-dddd-4ddd-8ddd-dddddddddda1",
    org_id: DEMO_ORG_ID,
    villa_id: VILLA_IDS.lotus,
    description: "Electricity top-up · Lotus House",
    amount: 3200,
    currency: "THB",
    status: "pending",
    category: "utilities",
    due_date: daysFromNow(1),
    submitted_by: DEMO_EMPLOYEE_ID,
    receipt_photo_url: null,
    created_at: daysAgo(0) + "T10:15:00.000Z",
  },
  {
    id: "dddddddd-dddd-4ddd-8ddd-dddddddddda2",
    org_id: DEMO_ORG_ID,
    villa_id: VILLA_IDS.palm,
    description: "Pool chemicals + brush",
    amount: 980,
    currency: "THB",
    status: "pending",
    category: "pool",
    due_date: daysFromNow(0),
    submitted_by: DEMO_CLEANER_ID,
    receipt_photo_url: null,
    created_at: daysAgo(0) + "T11:40:00.000Z",
  },
  {
    id: "dddddddd-dddd-4ddd-8ddd-dddddddddda3",
    org_id: DEMO_ORG_ID,
    villa_id: VILLA_IDS.coral,
    description: "Gardener day rate",
    amount: 1500,
    currency: "THB",
    status: "pending",
    category: "garden",
    due_date: daysFromNow(3),
    submitted_by: DEMO_EMPLOYEE_ID,
    receipt_photo_url: null,
    created_at: daysAgo(1) + "T17:00:00.000Z",
  },
  {
    id: "dddddddd-dddd-4ddd-8ddd-dddddddddda4",
    org_id: DEMO_ORG_ID,
    villa_id: VILLA_IDS.sunset,
    description: "Laundry pickup · checkout linens",
    amount: 650,
    currency: "THB",
    status: "paid",
    category: "cleaning",
    due_date: daysAgo(1),
    submitted_by: DEMO_CLEANER_ID,
    receipt_photo_url: null,
    created_at: daysAgo(1) + "T14:20:00.000Z",
  },
  {
    id: "dddddddd-dddd-4ddd-8ddd-dddddddddda5",
    org_id: DEMO_ORG_ID,
    villa_id: VILLA_IDS.jungle,
    description: "Staff overtime · AC escort",
    amount: 1200,
    currency: "THB",
    status: "paid",
    category: "staff",
    due_date: daysAgo(2),
    submitted_by: DEMO_EMPLOYEE_ID,
    receipt_photo_url: null,
    created_at: daysAgo(2) + "T18:00:00.000Z",
  },
  {
    id: "dddddddd-dddd-4ddd-8ddd-dddddddddda6",
    org_id: DEMO_ORG_ID,
    villa_id: null,
    description: "Grab rides · island errands",
    amount: 540,
    currency: "THB",
    status: "paid",
    category: "transport",
    due_date: daysAgo(5),
    submitted_by: DEMO_EMPLOYEE_ID,
    receipt_photo_url: null,
    created_at: daysAgo(5) + "T20:00:00.000Z",
  },
];

export const extraGuestStays: GuestStay[] = [
  {
    id: STAY_LOTUS_UPCOMING,
    org_id: DEMO_ORG_ID,
    villa_id: VILLA_IDS.lotus,
    guest_profile_id: DEMO_GUEST_ID,
    check_in: daysFromNow(21),
    check_out: daysFromNow(28),
    status: "upcoming",
    owner_notices: "Return stay confirmed. Early check-in possible after 13:00.",
    created_at: daysAgo(2) + "T12:00:00.000Z",
  },
  {
    id: STAY_PALM_DONE,
    org_id: DEMO_ORG_ID,
    villa_id: VILLA_IDS.palm,
    guest_profile_id: DEMO_GUEST_ID,
    check_in: daysAgo(20),
    check_out: daysAgo(14),
    status: "completed",
    owner_notices: "Thanks for staying · deposit refunded minus glass charge.",
    created_at: daysAgo(30) + "T09:00:00.000Z",
  },
  {
    id: STAY_CORAL_ACTIVE,
    org_id: DEMO_ORG_ID,
    villa_id: VILLA_IDS.coral,
    guest_profile_id: DEMO_GUEST_ID,
    check_in: daysAgo(1),
    check_out: daysFromNow(4),
    status: "active",
    owner_notices: "Second property for friends · quiet hours 22:00-08:00.",
    created_at: daysAgo(8) + "T10:00:00.000Z",
  },
];

export const extraGuestDeposits: GuestDeposit[] = [
  {
    id: DEPOSIT_PALM,
    org_id: DEMO_ORG_ID,
    stay_id: STAY_PALM_DONE,
    amount: 8000,
    currency: "THB",
    status: "partial",
    refunded_amount: 7650,
    notes: "Refunded after glass deduction.",
    deposit_timing: "on_arrival",
    created_at: daysAgo(20) + "T12:00:00.000Z",
  },
  {
    id: DEPOSIT_CORAL,
    org_id: DEMO_ORG_ID,
    stay_id: STAY_CORAL_ACTIVE,
    amount: 5000,
    currency: "THB",
    status: "held",
    refunded_amount: 0,
    notes: "Held at check-in · cash.",
    deposit_timing: "on_arrival",
    created_at: daysAgo(1) + "T14:00:00.000Z",
  },
];

export const extraGuestCharges: GuestCharge[] = [
  {
    id: "77777777-7777-4777-8777-777777777791",
    org_id: DEMO_ORG_ID,
    stay_id: DEMO_STAY_ID,
    deposit_id: DEMO_DEPOSIT_ID,
    description: "Lost remote control",
    amount: 800,
    currency: "THB",
    proof_photo_url: null,
    created_at: daysAgo(1) + "T09:30:00.000Z",
  },
  {
    id: "77777777-7777-4777-8777-777777777792",
    org_id: DEMO_ORG_ID,
    stay_id: DEMO_STAY_ID,
    deposit_id: DEMO_DEPOSIT_ID,
    description: "Extra late checkout fee",
    amount: 1500,
    currency: "THB",
    proof_photo_url: null,
    created_at: daysAgo(0) + "T10:00:00.000Z",
  },
  {
    id: "77777777-7777-4777-8777-777777777793",
    org_id: DEMO_ORG_ID,
    stay_id: STAY_PALM_DONE,
    deposit_id: DEPOSIT_PALM,
    description: "Broken wine glass",
    amount: 350,
    currency: "THB",
    proof_photo_url: null,
    created_at: daysAgo(14) + "T11:00:00.000Z",
  },
];

export const extraStayDateRequests: StayDateRequest[] = [
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaab1",
    org_id: DEMO_ORG_ID,
    villa_id: VILLA_IDS.palm,
    guest_profile_id: DEMO_GUEST_ID,
    check_in: daysFromNow(35),
    check_out: daysFromNow(42),
    note: "Family week · need baby cot if possible",
    status: "quoted",
    guest_price_amount: null,
    guest_price_currency: null,
    quoted_price_amount: 42000,
    quoted_price_currency: "THB",
    quoted_deposit_amount: 10000,
    quoted_deposit_currency: "THB",
    quoted_deposit_timing: "before_arrival",
    payment_note: "Transfer to company account · send slip in Support",
    created_at: daysAgo(3) + "T09:00:00.000Z",
  },
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaab2",
    org_id: DEMO_ORG_ID,
    villa_id: VILLA_IDS.bamboo,
    guest_profile_id: DEMO_GUEST_ID,
    check_in: daysFromNow(10),
    check_out: daysFromNow(14),
    note: "Yoga retreat · 2 guests",
    status: "accepted",
    guest_price_amount: 12000,
    guest_price_currency: "THB",
    quoted_price_amount: 12000,
    quoted_price_currency: "THB",
    quoted_deposit_amount: 3000,
    quoted_deposit_currency: "THB",
    quoted_deposit_timing: "on_arrival",
    payment_note: "Pay deposit in cash on arrival",
    created_at: daysAgo(5) + "T15:00:00.000Z",
  },
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaab3",
    org_id: DEMO_ORG_ID,
    villa_id: VILLA_IDS.jungle,
    guest_profile_id: DEMO_GUEST_ID,
    check_in: daysFromNow(8),
    check_out: daysFromNow(12),
    note: "Only if AC is fixed",
    status: "declined",
    guest_price_amount: null,
    guest_price_currency: null,
    quoted_price_amount: null,
    quoted_price_currency: null,
    quoted_deposit_amount: null,
    quoted_deposit_currency: null,
    quoted_deposit_timing: null,
    payment_note: null,
    created_at: daysAgo(4) + "T11:30:00.000Z",
  },
];

export const extraHouseGuides: HouseGuide[] = [
  {
    id: "77777777-7777-4777-8777-777777777794",
    org_id: DEMO_ORG_ID,
    villa_id: VILLA_IDS.lotus,
    wifi_ssid: "LotusHouse-5G",
    wifi_password: "lotus2026!",
    gate_code: "3910#",
    bins_notes: "Green bin by the mango tree · pickup Mon / Thu",
    quiet_hours: "22:00 - 08:00",
    checkout_checklist:
      "Close pool fence\nTurn off water heater\nLeave remotes on coffee table\nLock both doors",
    extra_notes: "Snorkel kit in the outdoor cupboard.",
    updated_at: daysAgo(1) + "T12:00:00.000Z",
  },
  {
    id: "77777777-7777-4777-8777-777777777795",
    org_id: DEMO_ORG_ID,
    villa_id: VILLA_IDS.palm,
    wifi_ssid: "PalmVilla-Guest",
    wifi_password: "palmvilla88",
    gate_code: "2207#",
    bins_notes: "Bins behind kitchen · recycle yellow lid",
    quiet_hours: "23:00 - 07:00",
    checkout_checklist:
      "Strip beds\nEmpty fridge\nClose all umbrellas\nReturn keys to lockbox",
    extra_notes: "Kayak paddles under the deck.",
    updated_at: daysAgo(3) + "T09:00:00.000Z",
  },
];

export const extraGuestBriefings: GuestBriefing[] = [
  {
    id: "77777777-7777-4777-8777-777777777796",
    org_id: DEMO_ORG_ID,
    stay_id: DEMO_STAY_ID,
    title: "Pool & heater",
    body: "Pool heater runs 16:00-21:00. No glass near the pool edge.",
    category: "house",
    created_by: DEMO_OWNER_ID,
    created_at: daysAgo(5) + "T10:00:00.000Z",
    confirmed_at: daysAgo(5) + "T12:00:00.000Z",
    confirmed_by: DEMO_GUEST_ID,
  },
  {
    id: "77777777-7777-4777-8777-777777777797",
    org_id: DEMO_ORG_ID,
    stay_id: STAY_CORAL_ACTIVE,
    title: "Neighbors & quiet hours",
    body: "Quiet hours 22:00-08:00. Music outdoors must stay low after 21:00.",
    category: "house",
    created_by: DEMO_EMPLOYEE_ID,
    created_at: daysAgo(1) + "T15:00:00.000Z",
    confirmed_at: null,
    confirmed_by: null,
  },
];

export const extraSupportMessages: SupportMessage[] = [
  {
    id: "77777777-7777-4777-8777-777777777798",
    org_id: DEMO_ORG_ID,
    stay_id: DEMO_STAY_ID,
    sender_id: DEMO_GUEST_ID,
    body: "We noticed a small leak under the kitchen sink this morning.",
    attachment_url: null,
    created_at: daysAgo(0) + "T06:30:00.000Z",
  },
  {
    id: "77777777-7777-4777-8777-777777777799",
    org_id: DEMO_ORG_ID,
    stay_id: DEMO_STAY_ID,
    sender_id: DEMO_EMPLOYEE_ID,
    body: "Thanks - Sam is coming between 10:30 and 11:30 today.",
    attachment_url: null,
    created_at: daysAgo(0) + "T06:55:00.000Z",
  },
  {
    id: "77777777-7777-4777-8777-7777777777a1",
    org_id: DEMO_ORG_ID,
    stay_id: STAY_CORAL_ACTIVE,
    sender_id: DEMO_GUEST_ID,
    body: "Could we get two extra beach towels?",
    attachment_url: null,
    created_at: daysAgo(0) + "T09:10:00.000Z",
  },
];

export const extraStayPhotos: StayPhoto[] = [
  {
    id: "77777777-7777-4777-8777-7777777777a2",
    org_id: DEMO_ORG_ID,
    stay_id: DEMO_STAY_ID,
    kind: "arrival",
    photo_url: demoPropertyPhoto("lotus"),
    note: "Pool area on arrival",
    uploaded_by: DEMO_GUEST_ID,
    created_at: daysAgo(5) + "T13:20:00.000Z",
  },
  {
    id: "77777777-7777-4777-8777-7777777777a3",
    org_id: DEMO_ORG_ID,
    stay_id: STAY_PALM_DONE,
    kind: "departure",
    photo_url: demoPropertyPhoto("palm"),
    note: "Living room after checkout",
    uploaded_by: DEMO_CLEANER_ID,
    created_at: daysAgo(14) + "T12:00:00.000Z",
  },
];

export const extraMessages: Message[] = [
  {
    id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeea1",
    org_id: DEMO_ORG_ID,
    sender_id: DEMO_OWNER_ID,
    body: "Bamboo Nest turns over today - Nok please prioritize after Palm.",
    created_at: daysAgo(0) + "T06:05:00.000Z",
    service_order_id: null,
    channel: "request",
    attachment_url: null,
  },
  {
    id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeea2",
    org_id: DEMO_ORG_ID,
    sender_id: DEMO_CLEANER_ID,
    body: "Got it. Palm deep clean done by noon, then Bamboo.",
    created_at: daysAgo(0) + "T06:18:00.000Z",
    service_order_id: null,
    channel: "request",
    attachment_url: null,
  },
  {
    id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeea3",
    org_id: DEMO_ORG_ID,
    sender_id: DEMO_EMPLOYEE_ID,
    body: "Jungle AC tech confirmed for 14:00. I'll meet them on site.",
    created_at: daysAgo(0) + "T07:40:00.000Z",
    service_order_id: null,
    channel: "general",
    attachment_url: null,
  },
  {
    id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeea4",
    org_id: DEMO_ORG_ID,
    sender_id: DEMO_OWNER_ID,
    body: "Guest reported sink leak at Sunset - Sam please check this morning.",
    created_at: daysAgo(0) + "T06:42:00.000Z",
    service_order_id: null,
    channel: "request",
    attachment_url: null,
  },
];

export const extraNotifications: AppNotification[] = [
  {
    ...makeNotification({
      org_id: DEMO_ORG_ID,
      kind: "urgent_task",
      title: "Urgent task",
      body: "Guest reports leak under sink · Sunset Deck",
      href: "/home",
      entity_id: "cccccccc-cccc-4ccc-8ccc-cccccccccca1",
      audience_profile_ids: [DEMO_OWNER_ID, DEMO_EMPLOYEE_ID],
      created_at: daysAgo(0) + "T06:41:00.000Z",
    }),
    id: "55555555-5555-4555-8555-5555555555a1",
  },
  {
    ...makeNotification({
      org_id: DEMO_ORG_ID,
      kind: "check_in",
      title: "Check-in today",
      body: "Bamboo Nest · same-day turnover in progress",
      href: "/villas",
      entity_id: VILLA_IDS.bamboo,
      audience_profile_ids: [DEMO_OWNER_ID, DEMO_EMPLOYEE_ID, DEMO_CLEANER_ID],
      created_at: daysAgo(0) + "T05:00:00.000Z",
    }),
    id: "55555555-5555-4555-8555-5555555555a2",
  },
  {
    ...makeNotification({
      org_id: DEMO_ORG_ID,
      kind: "check_out",
      title: "Checkout tomorrow",
      body: "Sunset Deck · 11:00 · deposit cuts logged",
      href: "/guests",
      entity_id: DEMO_STAY_ID,
      audience_profile_ids: [DEMO_OWNER_ID, DEMO_EMPLOYEE_ID],
      created_at: daysAgo(0) + "T07:00:00.000Z",
    }),
    id: "55555555-5555-4555-8555-5555555555a3",
  },
  {
    ...makeNotification({
      org_id: DEMO_ORG_ID,
      kind: "bill_submitted",
      title: "Bill awaiting approval",
      body: "Electricity top-up · Lotus House · ฿3,200",
      href: "/bills",
      entity_id: "dddddddd-dddd-4ddd-8ddd-dddddddddda1",
      audience_profile_ids: [DEMO_OWNER_ID],
      created_at: daysAgo(0) + "T10:16:00.000Z",
    }),
    id: "55555555-5555-4555-8555-5555555555a4",
  },
  {
    ...makeNotification({
      org_id: DEMO_ORG_ID,
      kind: "guest_update",
      title: "Quote ready for guest",
      body: "Palm Villa · 7 nights · ฿42,000 quoted",
      href: "/date-requests",
      entity_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaab1",
      audience_profile_ids: [DEMO_OWNER_ID, DEMO_EMPLOYEE_ID, DEMO_GUEST_ID],
      created_at: daysAgo(2) + "T16:00:00.000Z",
    }),
    id: "55555555-5555-4555-8555-5555555555a5",
  },
];

export const extraVillaAssignments: VillaAssignment[] = [
  {
    id: "ffffffff-ffff-4fff-8fff-ffffffffffa1",
    org_id: DEMO_ORG_ID,
    villa_id: VILLA_IDS.bamboo,
    profile_id: DEMO_EMPLOYEE_ID,
  },
  {
    id: "ffffffff-ffff-4fff-8fff-ffffffffffa2",
    org_id: DEMO_ORG_ID,
    villa_id: VILLA_IDS.bamboo,
    profile_id: DEMO_CLEANER_ID,
  },
  {
    id: "ffffffff-ffff-4fff-8fff-ffffffffffa3",
    org_id: DEMO_ORG_ID,
    villa_id: VILLA_IDS.coral,
    profile_id: DEMO_EMPLOYEE_ID,
  },
  {
    id: "ffffffff-ffff-4fff-8fff-ffffffffffa5",
    org_id: DEMO_ORG_ID,
    villa_id: VILLA_IDS.office,
    profile_id: DEMO_EMPLOYEE_ID,
  },
];
