import type { MessageKey } from "@/lib/i18n";

export type TFn = (
  key: MessageKey,
  params?: Record<string, string | number>,
) => string;

/** English seed / system strings → i18n keys (display-time localization). */
export const DEMO_ENGLISH_TO_KEY: Record<string, MessageKey> = {
  "Owner": "demo.jobTitle.owner",
  "On-site manager": "demo.jobTitle.manager",
  "Lead cleaner": "demo.jobTitle.cleaner",
  "Sea-view 2BR with private pool near Srithanu.": "demo.villa.lotus.desc",
  "Guests requested extra towels.": "demo.villa.lotus.notes",
  "Family villa close to Haad Yao beach.": "demo.villa.palm.desc",
  "Deep clean before tomorrow check-in.": "demo.villa.palm.notes",
  "Quiet hillside retreat - AC unit pending repair.": "demo.villa.jungle.desc",
  "AC compressor replacement scheduled.": "demo.villa.jungle.notes",
  "Sunset-facing deck villa.": "demo.villa.sunset.desc",
  "Checkout tomorrow 11:00.": "demo.villa.sunset.notes",
  "Compact studio for side-client bookings.": "demo.villa.cliff.desc",
  "Side client - not company inventory.": "demo.villa.cliff.notes",
  "Preferred for turnovers · on PulseFlow": "demo.contact.nokNotes",
  "24h emergency": "demo.contact.somchaiNotes",
  "Weekly Wednesdays": "demo.contact.poolNotes",
  "Spare parts in Thong Sala · not on PulseFlow yet": "demo.contact.coolairNotes",
  "AC/appliance repair": "demo.contact.roleAc",
  "Finish Palm Villa deep clean": "demo.task.palmDeepClean",
  "Meet AC tech at Jungle Retreat": "demo.task.meetAc",
  "Prepare Sunset Deck checkout checklist": "demo.task.sunsetCheckout",
  "Deliver extra towels to Lotus House": "demo.task.lotusTowels",
  "Restock Coral Bungalow amenities": "demo.task.coralRestock",
  "Buy pool chemicals in Thong Sala": "demo.task.poolChemicals",
  "Inspect Bamboo Nest water pump": "demo.task.bambooPump",
  "Turnover clean - Lotus House": "demo.task.lotusTurnover",
  "Checkout clean - Sunset Deck": "demo.task.sunsetClean",
  "Turnover cleaning": "demo.order.turnoverCleaning",
  "Full turnover after checkout. Extra towels in laundry room.": "demo.order.turnoverDetails",
  "Deep clean": "demo.order.deepClean",
  "AC repair visit": "demo.order.acRepair",
  "Compressor deposit already paid. Bring gauges.": "demo.order.acRepairDetails",
  "Cleaning supplies for turnover": "demo.bill.cleaningSupplies",
  "AC compressor deposit": "demo.bill.acDeposit",
  "Fuel for island runs": "demo.bill.fuel",
  "New job: Turnover cleaning": "demo.notif.newJobTurnover",
  "Lotus House · tomorrow 11:00-14:00 - tap Read & agreed": "demo.notif.newJobTurnoverBody",
  "Job confirmed: Deep clean": "demo.notif.jobConfirmedDeep",
  "Palm Villa · today 09:00-12:00": "demo.notif.jobConfirmedDeepBody",
  "New message from Alex": "demo.notif.newMessageAlex",
  "Can someone confirm Palm Villa towels?": "demo.notif.newMessageAlexBody",
  "Bill submitted": "demo.notif.billSubmitted",
  "Cleaning supplies for turnover · ฿1,250": "demo.notif.billSubmittedBody",
  "Morning - Palm Villa needs to be guest-ready by tomorrow noon.": "demo.msg.morningPalm",
  "On it. Cleaning team is already there. Will update when done.": "demo.msg.onIt",
  "AC tech confirmed for Jungle Retreat at 2pm.": "demo.msg.acConfirmed",
  "📋 Service order for Nok Cleaning\nWhat: Deep clean\nWhere: Palm Villa\nWhen: today 09:00-12:00\nDetails: Deep clean before tomorrow check-in.\nFrom: Alex Owner\n\nStaff: open this and tap “Read and agreed” to confirm you got the job.": "demo.msg.orderAgreed",
  "📋 Service order for Nok Cleaning\nWhat: Turnover cleaning\nWhere: Lotus House\nWhen: tomorrow 11:00-14:00\nDetails: Full turnover after checkout. Extra towels in laundry room.\nFrom: Alex Owner\n\nStaff: open this and tap “Read and agreed” to confirm you got the job.": "demo.msg.orderPending",
  "Handled turnovers smoothly.": "demo.endorse.turnovers",
  "Great guest communication.": "demo.endorse.guestComm",
  "Spotless Palm Villa.": "demo.endorse.spotless",
  "Reliable across properties.": "demo.endorse.reliable",
  "today": "demo.day.today",
  "tomorrow": "demo.day.tomorrow",
  "yesterday": "demo.day.yesterday",
  "Welcome! Pool heater is on from 16:00. Checkout is 11:00 - leave keys on the kitchen counter.":
    "demo.guest.ownerNotices",
  "Gate & keys": "demo.guest.briefing.keysTitle",
  "Side gate code is 4821#. Leave keys on the kitchen counter at checkout.":
    "demo.guest.briefing.keysBody",
  "How to reach us": "demo.guest.briefing.helpTitle",
  "Use Support in this app for anything urgent. We reply as the host team only.":
    "demo.guest.briefing.helpBody",
  "Hi - is the pool heater already on this evening?":
    "demo.guest.support.poolQuestion",
  "Yes, it turns on at 16:00 every day. Enjoy the sunset!":
    "demo.guest.support.poolReply",
  "Blue bin outside the side gate. Pickup Tue / Fri mornings.":
    "demo.guest.guide.bins",
  "Close all windows\nTurn off AC and lights\nLeave keys on kitchen counter\nLock the side gate":
    "demo.guest.guide.checkout",
  "Beach towels in the left cupboard. Extra water under the sink.":
    "demo.guest.guide.extra",
  "Security deposit held at check-in.": "demo.guest.depositNote",
  "Broken wine glass (replacement)": "demo.guest.chargeGlass",
};

const SORTED_PHRASES = Object.keys(DEMO_ENGLISH_TO_KEY).sort(
  (a, b) => b.length - a.length,
);

function localizeWhenFragment(when: string, t: TFn): string {
  const trimmed = when.trim();
  const mapped = DEMO_ENGLISH_TO_KEY[trimmed];
  if (mapped) return t(mapped);

  const ago = trimmed.match(/^(\d+) days ago$/);
  if (ago) return t("demo.day.daysAgo", { count: Number(ago[1]) });

  if (trimmed === "due today") return t("demo.sys.billDueToday");

  const dueWhen = trimmed.match(/^due (.+)$/);
  if (dueWhen) {
    return t("demo.sys.billDueWhen", {
      when: localizeWhenFragment(dueWhen[1]!, t),
    });
  }

  const overdue = trimmed.match(/^overdue by (\d+) days?$/);
  if (overdue) {
    return t("demo.sys.billOverdue", { count: Number(overdue[1]) });
  }

  return trimmed;
}

function replaceKnownPhrases(text: string, t: TFn): string {
  let out = text;
  for (const en of SORTED_PHRASES) {
    if (en.length < 5) continue;
    if (!out.includes(en)) continue;
    out = out.split(en).join(t(DEMO_ENGLISH_TO_KEY[en]!));
  }
  for (const en of ["yesterday", "tomorrow", "today"] as const) {
    if (out.includes(en)) {
      out = out.split(en).join(t(DEMO_ENGLISH_TO_KEY[en]!));
    }
  }
  return out;
}

function localizeOrderChatBody(text: string, t: TFn): string {
  const lines = text.split("\n");
  const out: string[] = [];
  for (const line of lines) {
    const header = line.match(/^📋 Service order for (.+)$/);
    if (header) {
      out.push(t("demo.orderChat.header", { name: header[1]! }));
      continue;
    }
    const what = line.match(/^What: (.+)$/);
    if (what) {
      out.push(
        t("demo.orderChat.what", {
          serviceType: localizeDemoText(what[1]!, t),
        }),
      );
      continue;
    }
    const where = line.match(/^Where: (.+)$/);
    if (where) {
      out.push(t("demo.orderChat.where", { location: where[1]! }));
      continue;
    }
    const when = line.match(/^When: (.+)$/);
    if (when) {
      out.push(
        t("demo.orderChat.when", {
          when: replaceKnownPhrases(when[1]!, t),
        }),
      );
      continue;
    }
    const details = line.match(/^Details: (.+)$/);
    if (details) {
      out.push(
        t("demo.orderChat.details", {
          details: localizeDemoText(details[1]!, t),
        }),
      );
      continue;
    }
    const from = line.match(/^From: (.+)$/);
    if (from) {
      out.push(t("demo.orderChat.from", { name: from[1]! }));
      continue;
    }
    if (
      line ===
      "Staff: open this and tap “Read and agreed” to confirm you got the job."
    ) {
      out.push(t("demo.orderChat.staffHint"));
      continue;
    }
    out.push(line === "" ? "" : replaceKnownPhrases(line, t));
  }
  return out.join("\n");
}

function localizeDoneOrAgreedMsg(
  text: string,
  kind: "done" | "agreed",
  t: TFn,
): string {
  const re =
    kind === "done"
      ? /^✅ Done - (.+) at (.+) \((.+)\)$/
      : /^✅ Read and agreed - (.+) at (.+) \((.+)\)$/;
  const m = text.match(re);
  if (!m) return replaceKnownPhrases(text, t);
  const location =
    m[2] === "location" ? t("demo.sys.locationFallback") : m[2]!;
  const params = {
    service: localizeDemoText(m[1]!, t),
    location,
    when: replaceKnownPhrases(m[3]!, t),
  };
  return kind === "done"
    ? t("demo.sys.doneMsg", params)
    : t("demo.sys.agreedMsg", params);
}

/** True when stored copy is a known demo seed string (use dictionary, not live translate). */
export function isKnownDemoPhrase(text: string): boolean {
  if (!text) return false;
  if (DEMO_ENGLISH_TO_KEY[text]) return true;
  if (text.startsWith("📋 Service order for ")) return true;
  if (text.startsWith("✅ Done - ") || text.startsWith("✅ Read and agreed - ")) {
    return true;
  }
  if (/^(Appointment|Check-in|Check-out) .+$/.test(text)) return true;
  if (/^Bill .+$/.test(text)) return true;
  if (/^New job: .+$/.test(text)) return true;
  if (/^Job confirmed: .+$/.test(text)) return true;
  if (/^.+ completed a job$/.test(text)) return true;
  if (/^.+ agreed$/.test(text) && !text.includes("\n")) return true;
  return false;
}

/** Map stored English demo / system copy to the active locale. */
export function localizeDemoText(text: string, t: TFn): string {
  if (!text) return text;

  const exact = DEMO_ENGLISH_TO_KEY[text];
  if (exact) return t(exact);

  if (text.startsWith("📋 Service order for ")) {
    return localizeOrderChatBody(text, t);
  }
  if (text.startsWith("✅ Done - ")) {
    return localizeDoneOrAgreedMsg(text, "done", t);
  }
  if (text.startsWith("✅ Read and agreed - ")) {
    return localizeDoneOrAgreedMsg(text, "agreed", t);
  }

  const scheduleTitle = text.match(/^(Appointment|Check-in|Check-out) (.+)$/);
  if (scheduleTitle) {
    const kind = scheduleTitle[1]!;
    const when = localizeWhenFragment(scheduleTitle[2]!, t);
    if (kind === "Appointment") {
      return t("demo.sys.appointmentTitle", { when });
    }
    if (kind === "Check-in") {
      return t("demo.sys.checkInTitle", { when });
    }
    return t("demo.sys.checkOutTitle", { when });
  }

  const billTitle = text.match(/^Bill (.+)$/);
  if (billTitle) {
    return t("demo.sys.billDueTitle", {
      when: localizeWhenFragment(billTitle[1]!, t),
    });
  }

  const newJob = text.match(/^New job: (.+)$/);
  if (newJob) {
    return t("demo.sys.newJobTitle", {
      serviceType: localizeDemoText(newJob[1]!, t),
    });
  }

  const confirmed = text.match(/^Job confirmed: (.+)$/);
  if (confirmed) {
    return t("demo.sys.jobConfirmedTitle", {
      serviceType: localizeDemoText(confirmed[1]!, t),
    });
  }

  const completed = text.match(/^(.+) completed a job$/);
  if (completed) {
    return t("demo.sys.completedJobTitle", { name: completed[1]! });
  }

  const agreed = text.match(/^(.+) agreed$/);
  if (agreed && !text.includes("\n")) {
    return t("demo.sys.agreedTitle", { name: agreed[1]! });
  }

  return replaceKnownPhrases(text, t);
}
