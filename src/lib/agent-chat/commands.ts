import type { MessageKey } from "@/lib/i18n";
import type { TaskStatus } from "@/lib/design-tokens";
import type {
  Bill,
  Contact,
  HouseGuide,
  Organization,
  Profile,
  ServiceOrder,
  Task,
  Villa,
  VillaMaintenanceLog,
  VillaMasterInfo,
} from "@/lib/types";
import {
  normalizeAgentSlashInput,
  parseAgentSlash,
  peelAssigneeFromText,
  peelVillaFromText,
  resolveContactForProfile,
  resolveTask,
  resolveVilla,
} from "@/lib/agent-chat/resolve";
import { lookupFamousPlace } from "@/lib/agent-chat/places";
import {
  continueVillaIntake,
  startVillaIntake,
  villaCreateInput,
  type AgentChip,
  type AgentTurn,
  type VillaIntake,
} from "@/lib/agent-chat/villa-intake";
import { parseMasterInfoFromText } from "@/lib/villas/parse-master-info";

export type { AgentChip, AgentTurn, VillaIntake };

export type AgentCommandSuggestion = {
  command: string;
  hint: string;
  descriptionKey: MessageKey;
  /** Tapping the row should send immediately (lists / intake start). */
  runOnPick: boolean;
};

export const AGENT_CHAT_COMMANDS: AgentCommandSuggestion[] = [
  {
    command: "/help",
    hint: "",
    descriptionKey: "messages.agent.cmd.help",
    runOnPick: true,
  },
  {
    command: "/whoami",
    hint: "",
    descriptionKey: "messages.agent.cmd.whoami",
    runOnPick: true,
  },
  {
    command: "/team",
    hint: "",
    descriptionKey: "messages.agent.cmd.team",
    runOnPick: true,
  },
  {
    command: "/villas",
    hint: "",
    descriptionKey: "messages.agent.cmd.villas",
    runOnPick: true,
  },
  {
    command: "/tasks",
    hint: "open or done",
    descriptionKey: "messages.agent.cmd.tasks",
    runOnPick: true,
  },
  {
    command: "/task",
    hint: "title @person villa",
    descriptionKey: "messages.agent.cmd.task",
    runOnPick: false,
  },
  {
    command: "/done",
    hint: "task name",
    descriptionKey: "messages.agent.cmd.done",
    runOnPick: true,
  },
  {
    command: "/jobs",
    hint: "",
    descriptionKey: "messages.agent.cmd.jobs",
    runOnPick: true,
  },
  {
    command: "/job",
    hint: "service @person villa",
    descriptionKey: "messages.agent.cmd.job",
    runOnPick: false,
  },
  {
    command: "/bills",
    hint: "pending or paid",
    descriptionKey: "messages.agent.cmd.bills",
    runOnPick: true,
  },
  {
    command: "/villa",
    hint: "name or famous place",
    descriptionKey: "messages.agent.cmd.villa",
    runOnPick: true,
  },
  {
    command: "/master",
    hint: "villa name",
    descriptionKey: "messages.agent.cmd.master",
    runOnPick: false,
  },
  {
    command: "/guide",
    hint: "villa name",
    descriptionKey: "messages.agent.cmd.guide",
    runOnPick: false,
  },
  {
    command: "/maint",
    hint: "villa name",
    descriptionKey: "messages.agent.cmd.maint",
    runOnPick: false,
  },
];

export function agentCommandSuggestions(
  input: string,
): AgentCommandSuggestion[] {
  if (!input.startsWith("/")) return [];
  const normalized = normalizeAgentSlashInput(input);
  const token = normalized.match(/^\/[^\s]*/)?.[0] ?? normalized;
  // After a space past the command word, hide the menu (user is filling args).
  if (normalized.length > token.length) return [];
  const q = token.toLowerCase();
  return AGENT_CHAT_COMMANDS.filter((c) => {
    const cmd = c.command.toLowerCase();
    return cmd.startsWith(q) && cmd !== q;
  });
}

export function agentCommandPickText(cmd: AgentCommandSuggestion) {
  return cmd.runOnPick ? cmd.command : `${cmd.command} `;
}

function isDummyArg(args: string) {
  const a = args.trim();
  if (!a) return true;
  if (/^\[.+\]$/.test(a)) return true;
  if (/\|/.test(a) && /open|done|pending|paid|person|maps/i.test(a)) return true;
  if (
    /^(title @person villa|task…|task\.\.\.|service @person villa|name \| maps link|open · done|open or done|pending · paid|pending or paid|task name)$/i.test(
      a,
    )
  ) {
    return true;
  }
  return false;
}

export type AgentCommandContext = {
  profile: Profile;
  organization: Organization | null;
  profiles: Profile[];
  villas: Villa[];
  tasks: Task[];
  bills: Bill[];
  serviceOrders: ServiceOrder[];
  contacts: Contact[];
  villaMasterInfo: VillaMasterInfo[];
  houseGuides: HouseGuide[];
  villaMaintenanceLogs: VillaMaintenanceLog[];
  createTask: (input: {
    title: string;
    villa_id: string | null;
    priority: "normal" | "urgent";
    assigned_to: string | null;
    due_date: string | null;
    notes?: string | null;
  }) => Promise<void>;
  setTaskStatus: (id: string, status: TaskStatus) => Promise<void>;
  createServiceOrder: (input: {
    contact_id: string;
    villa_id: string | null;
    location_label?: string | null;
    service_type: string;
    details?: string | null;
    scheduled_date?: string | null;
    time_start?: string | null;
    time_end?: string | null;
  }) => Promise<ServiceOrder>;
  createVilla: (input: {
    name: string;
    location_url: string;
    area?: string;
    description?: string;
    photo_url?: string | null;
    bedrooms?: number | null;
    bathrooms?: number | null;
    max_guests?: number | null;
    aircon?: Villa["aircon"];
    parking?: Villa["parking"];
    view?: Villa["view"];
    has_garden?: boolean | null;
    has_wifi?: boolean | null;
    pet_friendly?: boolean | null;
    kitchen?: Villa["kitchen"];
    setting?: Villa["setting"];
    has_pool?: boolean | null;
  }) => Promise<string>;
  upsertVillaMasterInfo: (
    villaId: string,
    patch: Partial<
      Omit<VillaMasterInfo, "id" | "org_id" | "villa_id" | "updated_at">
    >,
  ) => Promise<void>;
  upsertHouseGuide: (
    villaId: string,
    patch: Partial<
      Omit<HouseGuide, "id" | "org_id" | "villa_id" | "updated_at">
    >,
  ) => Promise<void>;
  addVillaMaintenanceLog: (input: {
    villa_id: string;
    item: string;
    logged_on: string;
    description?: string | null;
    vendor?: string | null;
    photo_url?: string | null;
  }) => Promise<void>;
};

const HELP_LINES: { command: string; label: string }[] = [
  { command: "/help", label: "list of commands for your actions" },
  { command: "/whoami", label: "you and this company" },
  { command: "/team", label: "list teammates" },
  { command: "/villas", label: "list properties" },
  { command: "/tasks", label: "list open tasks (or /tasks open, /tasks done)" },
  { command: "/task", label: "create a task (example: /task Restock fridge @Mai Coral)" },
  { command: "/done", label: "mark a task done" },
  { command: "/jobs", label: "list open jobs" },
  { command: "/job", label: "book a job (example: /job Deep clean @Mai Coral)" },
  { command: "/bills", label: "list pending bills (or /bills paid)" },
  { command: "/villa", label: "add a property (questionnaire or famous place)" },
  {
    command: "/master",
    label:
      "team master info only — not the guest guide (example: /master Coral — or paste Utilities: / Handoff: notes)",
  },
  {
    command: "/guide",
    label:
      "guest house guide only — Wi-Fi/gate, not master info (example: /guide Coral wifi_ssid: GuestNet)",
  },
  {
    command: "/maint",
    label:
      "list or add maintenance (example: /maint Coral — or /maint Coral Water heater | Acme)",
  },
];

function formatMasterInfo(
  villaName: string,
  row: VillaMasterInfo | undefined,
) {
  if (!row) return `${villaName}\nNo master info yet.`;
  const lines = [
    villaName,
    row.utilities_notes ? `Utilities: ${row.utilities_notes}` : null,
    row.service_providers_notes
      ? `Service providers: ${row.service_providers_notes}`
      : null,
    row.access_notes ? `Access: ${row.access_notes}` : null,
    row.key_contacts_notes ? `Key contacts: ${row.key_contacts_notes}` : null,
    row.tax_notes ? `Tax: ${row.tax_notes}` : null,
    row.handoff_notes ? `Handoff: ${row.handoff_notes}` : null,
  ].filter(Boolean);
  return lines.length > 1
    ? lines.join("\n")
    : `${villaName}\nNo master info yet.`;
}

function formatHouseGuide(villaName: string, row: HouseGuide | undefined) {
  if (!row) return `${villaName}\nNo guest house guide yet.`;
  const lines = [
    villaName,
    row.wifi_ssid ? `Wi-Fi: ${row.wifi_ssid}` : null,
    row.wifi_password ? `Wi-Fi password: ${row.wifi_password}` : null,
    row.gate_code ? `Gate: ${row.gate_code}` : null,
    row.bins_notes ? `Bins: ${row.bins_notes}` : null,
    row.quiet_hours ? `Quiet hours: ${row.quiet_hours}` : null,
    row.checkout_checklist ? `Checkout: ${row.checkout_checklist}` : null,
    row.extra_notes ? `Extra: ${row.extra_notes}` : null,
  ].filter(Boolean);
  return lines.length > 1
    ? lines.join("\n")
    : `${villaName}\nNo guest house guide yet.`;
}

type GuideEditableField =
  | "wifi_ssid"
  | "wifi_password"
  | "gate_code"
  | "bins_notes"
  | "quiet_hours"
  | "checkout_checklist"
  | "extra_notes";

const GUIDE_FIELD_ALIASES: Record<string, GuideEditableField> = {
  wifi: "wifi_ssid",
  wifi_ssid: "wifi_ssid",
  ssid: "wifi_ssid",
  wifi_password: "wifi_password",
  password: "wifi_password",
  gate: "gate_code",
  gate_code: "gate_code",
  bins: "bins_notes",
  bins_notes: "bins_notes",
  quiet: "quiet_hours",
  quiet_hours: "quiet_hours",
  checkout: "checkout_checklist",
  checkout_checklist: "checkout_checklist",
  extra: "extra_notes",
  extra_notes: "extra_notes",
  notes: "extra_notes",
};

function parseGuideFieldPatch(
  text: string,
): Partial<Record<GuideEditableField, string>> {
  const patch: Partial<Record<GuideEditableField, string>> = {};
  const re =
    /\b(wifi_ssid|wifi_password|wifi|ssid|password|gate_code|gate|bins_notes|bins|quiet_hours|quiet|checkout_checklist|checkout|extra_notes|extra|notes)\s*:\s*/gi;
  const matches = [...text.matchAll(re)];
  if (!matches.length) return patch;
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i]!;
    const field = GUIDE_FIELD_ALIASES[m[1]!.toLowerCase()];
    if (!field) continue;
    const start = (m.index ?? 0) + m[0].length;
    const end = i + 1 < matches.length ? matches[i + 1]!.index! : text.length;
    const value = text.slice(start, end).trim();
    if (value) patch[field] = value;
  }
  return patch;
}

function resolveVillaFromArgs(
  args: string,
  villas: Villa[],
): { villa: Villa | null; rest: string } {
  const peeled = peelVillaFromText(args, villas);
  if (peeled.villa) return { villa: peeled.villa, rest: peeled.rest };
  // Leading villa name: "Coral utilities: …"
  const first = args.trim().split(/\s+/)[0] ?? "";
  if (first) {
    const villa = resolveVilla(first, villas);
    if (villa) {
      return {
        villa,
        rest: args.trim().slice(first.length).trim(),
      };
    }
  }
  return { villa: null, rest: args.trim() };
}

function helpText() {
  return [
    "The list of commands used for your actions. Type / and tap one, or send it.",
    ...HELP_LINES.map((c) => `${c.command}  ${c.label}`),
  ].join("\n");
}

function lineList(rows: string[], empty: string) {
  if (!rows.length) return empty;
  return rows.join("\n");
}

function turn(text: string, extra?: Partial<AgentTurn>): AgentTurn {
  return { text, ...extra };
}

export async function runAgentCommand(
  raw: string,
  ctx: AgentCommandContext,
  options?: {
    photoUrl?: string | null;
    chipId?: string;
    intake?: VillaIntake | null;
  },
): Promise<{ turn: AgentTurn; intake: VillaIntake | null }> {
  const text = raw.trim();
  const intake = options?.intake ?? null;

  if (intake) {
    const asSlash = normalizeAgentSlashInput(text);
    if (asSlash.startsWith("/") && !/^\/cancel$/i.test(asSlash)) {
      return runAgentCommand(asSlash, ctx, { ...options, intake: null });
    }
    const next = await continueVillaIntake(
      intake,
      {
        text,
        photoUrl: options?.photoUrl,
        chipId: options?.chipId,
      },
      lookupFamousPlace,
    );
    if (next.create) {
      const input = villaCreateInput(next.create);
      await ctx.createVilla(input);
      return {
        intake: null,
        turn: turn(`Added ${input.name}. Open Properties to see it.`),
      };
    }
    return { intake: next.intake, turn: next.turn };
  }

  if (options?.chipId?.startsWith("done:")) {
    const id = options.chipId.slice(5);
    const task = ctx.tasks.find((t) => t.id === id);
    if (!task) return { intake: null, turn: turn("That task is gone. Try /tasks.") };
    await ctx.setTaskStatus(task.id, "done");
    return { intake: null, turn: turn(`Marked done: ${task.title}`) };
  }

  if (!text.startsWith("/")) {
    return {
      intake: null,
      turn: turn(`I run slash commands. Type / to pick one.\n\n${helpText()}`),
    };
  }

  const { cmd, args: rawArgs } = parseAgentSlash(text);
  const args = isDummyArg(rawArgs) ? "" : rawArgs;
  const orgProfiles = ctx.profiles.filter(
    (p) => p.org_id === ctx.profile.org_id && p.role !== "guest",
  );
  const orgVillas = ctx.villas.filter((v) => v.org_id === ctx.profile.org_id);
  const orgTasks = ctx.tasks.filter((t) => t.org_id === ctx.profile.org_id);
  const orgBills = ctx.bills.filter((b) => b.org_id === ctx.profile.org_id);
  const orgOrders = ctx.serviceOrders.filter(
    (o) => o.org_id === ctx.profile.org_id,
  );
  const orgContacts = ctx.contacts.filter(
    (c) => c.org_id === ctx.profile.org_id,
  );

  if (cmd === "/help") return { intake: null, turn: turn(helpText()) };

  if (cmd === "/whoami") {
    return {
      intake: null,
      turn: turn(
        [
          ctx.profile.full_name,
          `Role: ${ctx.profile.role}`,
          `Org: ${ctx.organization?.name ?? ctx.profile.org_id}`,
        ].join("\n"),
      ),
    };
  }

  if (cmd === "/team") {
    return {
      intake: null,
      turn: turn(
        lineList(
          orgProfiles.map((p) => `• ${p.full_name} (${p.role})`),
          "No teammates yet.",
        ),
      ),
    };
  }

  if (cmd === "/villas") {
    return {
      intake: null,
      turn: turn(
        lineList(
          orgVillas.map(
            (v) => `• ${v.name}${v.status ? ` (${v.status})` : ""}`,
          ),
          "No properties yet. /villa to add one.",
        ),
      ),
    };
  }

  if (cmd === "/tasks") {
    const statusFilter = args.toLowerCase();
    let list = orgTasks.filter((t) => t.status !== "done");
    if (statusFilter === "open" || statusFilter === "done") {
      list = orgTasks.filter((t) => t.status === statusFilter);
    } else if (
      statusFilter === "pending_verify" ||
      statusFilter === "verify"
    ) {
      list = orgTasks.filter((t) => t.status === "pending_verify");
    }
    return {
      intake: null,
      turn: turn(
        lineList(
          list.slice(0, 40).map((t) => {
            const villa = orgVillas.find((v) => v.id === t.villa_id);
            const who = orgProfiles.find((p) => p.id === t.assigned_to);
            const bits = [
              t.status,
              villa?.name,
              who?.full_name ? `@${who.full_name}` : null,
            ].filter(Boolean);
            return `• ${t.title}${bits.length ? ` (${bits.join(", ")})` : ""}`;
          }),
          "No matching tasks.",
        ),
      ),
    };
  }

  if (cmd === "/task") {
    if (!args) {
      return {
        intake: null,
        turn: turn(
          "Send /task plus a title. Optional: @person and a villa name.\nExample: /task Restock fridge @Mai Coral",
        ),
      };
    }
    const peeled = peelAssigneeFromText(args, orgProfiles);
    if (peeled.unmatchedMention != null && !peeled.assignee) {
      return {
        intake: null,
        turn: turn(
          `No teammate matching @${peeled.unmatchedMention}. Try /team.`,
        ),
      };
    }
    const { rest, villa } = peelVillaFromText(peeled.rest, orgVillas);
    const title = rest.trim();
    if (!title) {
      return { intake: null, turn: turn("Need a task title.") };
    }
    await ctx.createTask({
      title,
      villa_id: villa?.id ?? null,
      priority: /urgent/i.test(title) ? "urgent" : "normal",
      assigned_to: peeled.assignee?.id ?? null,
      due_date: null,
    });
    const bits = [
      peeled.assignee ? `@${peeled.assignee.full_name}` : null,
      villa?.name ?? null,
    ].filter(Boolean);
    return {
      intake: null,
      turn: turn(
        `Created task: ${title}${bits.length ? ` (${bits.join(", ")})` : ""}`,
      ),
    };
  }

  if (cmd === "/done") {
    const open = orgTasks.filter(
      (t) => t.status === "open" || t.status === "pending_verify",
    );
    if (!args) {
      if (!open.length) {
        return { intake: null, turn: turn("No open tasks.") };
      }
      return {
        intake: null,
        turn: turn("Tap a task to mark it done.", {
          chips: open.slice(0, 12).map((t) => ({
            id: `done:${t.id}`,
            label: t.title,
          })),
        }),
      };
    }
    const task = resolveTask(args, orgTasks, ["open", "pending_verify"]);
    if (!task) {
      return {
        intake: null,
        turn: turn(`No open task matching “${args}”.`, {
          chips: open.slice(0, 12).map((t) => ({
            id: `done:${t.id}`,
            label: t.title,
          })),
        }),
      };
    }
    await ctx.setTaskStatus(task.id, "done");
    return { intake: null, turn: turn(`Marked done: ${task.title}`) };
  }

  if (cmd === "/jobs") {
    const open = orgOrders.filter(
      (o) => o.status === "pending_ack" || o.status === "agreed",
    );
    return {
      intake: null,
      turn: turn(
        lineList(
          open.slice(0, 40).map((o) => {
            const who = orgProfiles.find((p) => p.id === o.staff_profile_id);
            return `• ${o.service_type} at ${o.location_label ?? "TBC"} (${o.status}${
              who ? `, ${who.full_name}` : ""
            })`;
          }),
          "No open jobs.",
        ),
      ),
    };
  }

  if (cmd === "/job") {
    if (!args) {
      return {
        intake: null,
        turn: turn(
          "Send /job plus the service, @who, and villa.\nExample: /job Deep clean @Mai Coral",
        ),
      };
    }
    if (!args.includes("@")) {
      return {
        intake: null,
        turn: turn("Tag who should do it with @Name."),
      };
    }
    const peeled = peelAssigneeFromText(args, orgProfiles);
    if (!peeled.assignee) {
      return {
        intake: null,
        turn: turn(
          `No teammate matching @${peeled.unmatchedMention ?? "Name"}. Try /team.`,
        ),
      };
    }
    const { rest, villa } = peelVillaFromText(peeled.rest, orgVillas);
    const serviceType = rest.trim();
    if (!serviceType) {
      return {
        intake: null,
        turn: turn("Need a service type (e.g. Deep clean)."),
      };
    }
    const contact = resolveContactForProfile(peeled.assignee.id, orgContacts);
    if (!contact) {
      return {
        intake: null,
        turn: turn(
          `${peeled.assignee.full_name} needs a Contacts entry linked to their profile before you can book a job.`,
        ),
      };
    }
    const order = await ctx.createServiceOrder({
      contact_id: contact.id,
      villa_id: villa?.id ?? null,
      location_label: villa?.name ?? null,
      service_type: serviceType,
    });
    return {
      intake: null,
      turn: turn(
        `Booked: ${order.service_type} for ${peeled.assignee.full_name}${
          villa ? ` at ${villa.name}` : ""
        }. They’ll see it in Questions/Feedback.`,
      ),
    };
  }

  if (cmd === "/bills") {
    const statusFilter = args.toLowerCase();
    let list = orgBills.filter((b) => b.status === "pending");
    if (statusFilter === "pending" || statusFilter === "paid") {
      list = orgBills.filter((b) => b.status === statusFilter);
    }
    return {
      intake: null,
      turn: turn(
        lineList(
          list.slice(0, 40).map((b) => {
            const villa = orgVillas.find((v) => v.id === b.villa_id);
            return `• ${b.description}: ${b.amount} ${b.currency}${
              villa ? ` (${villa.name})` : ""
            } [${b.status}]`;
          }),
          "No matching bills.",
        ),
      ),
    };
  }

  if (cmd === "/villa") {
    if (args) {
      const started = startVillaIntake();
      const next = await continueVillaIntake(
        started.intake,
        { text: args, photoUrl: options?.photoUrl },
        lookupFamousPlace,
      );
      return { intake: next.intake, turn: next.turn };
    }
    const started = startVillaIntake();
    return { intake: started.intake, turn: started.turn };
  }

  if (cmd === "/master") {
    if (!args) {
      return {
        intake: null,
        turn: turn(
          "Team master info (not the guest house guide).\nSend /master plus a property name. Paste labeled notes after the name.\nExample: /master Coral\nUtilities: meter behind shed\nHandoff: call guard first\nFor Wi-Fi/gate guests see, use /guide instead.",
        ),
      };
    }
    const { villa, rest } = resolveVillaFromArgs(args, orgVillas);
    if (!villa) {
      return {
        intake: null,
        turn: turn("Which property? Use a name from /villas."),
      };
    }
    const existing = ctx.villaMasterInfo.find((g) => g.villa_id === villa.id);
    if (
      ctx.profile.role === "manager" &&
      existing?.allow_manager_view === false
    ) {
      return {
        intake: null,
        turn: turn("Master info is owner-only for this property."),
      };
    }
    if (!rest) {
      return {
        intake: null,
        turn: turn(
          `${formatMasterInfo(villa.name, existing)}\n\n(Team master info — separate from the guest house guide. /guide for Wi-Fi/gate.)`,
        ),
      };
    }
    if (
      /\b(wifi_ssid|wifi_password|gate_code|wifi\s*:|gate\s*:)/i.test(rest) &&
      !/\b(utilities|handoff|providers|contacts|tax)\s*:/i.test(rest)
    ) {
      return {
        intake: null,
        turn: turn(
          "That looks like guest house guide fields (Wi-Fi/gate). Use /guide — master info is the team handoff file.",
        ),
      };
    }
    const enrichment = parseMasterInfoFromText(rest);
    const patch = {
      utilities_notes: enrichment.utilities_notes ?? undefined,
      service_providers_notes:
        enrichment.service_providers_notes ?? undefined,
      access_notes: enrichment.access_notes ?? undefined,
      key_contacts_notes: enrichment.key_contacts_notes ?? undefined,
      tax_notes: enrichment.tax_notes ?? undefined,
      handoff_notes: enrichment.handoff_notes ?? undefined,
    };
    if (!Object.values(patch).some((v) => v?.trim())) {
      return {
        intake: null,
        turn: turn(
          "Could not parse master-info fields. Use labels like Utilities:, Access:, Handoff: …\n(Guest Wi-Fi/gate belongs in /guide.)",
        ),
      };
    }
    await ctx.upsertVillaMasterInfo(villa.id, patch);
    return {
      intake: null,
      turn: turn(
        `Updated team master info for ${villa.name}. Guest house guide was not changed — use /guide for Wi-Fi/gate.`,
      ),
    };
  }

  if (cmd === "/guide") {
    if (!args) {
      return {
        intake: null,
        turn: turn(
          "Guest house guide (not team master info).\nSend /guide plus a property name. To set fields: /guide Coral wifi_ssid: GuestNet wifi_password: secret\nFor utilities/vendors/handoff, use /master instead.",
        ),
      };
    }
    const { villa, rest } = resolveVillaFromArgs(args, orgVillas);
    if (!villa) {
      return {
        intake: null,
        turn: turn("Which property? Use a name from /villas."),
      };
    }
    const existing = ctx.houseGuides.find((g) => g.villa_id === villa.id);
    if (!rest) {
      return {
        intake: null,
        turn: turn(
          `${formatHouseGuide(villa.name, existing)}\n\n(Guest house guide — separate from team master info. /master for utilities/handoff.)`,
        ),
      };
    }
    if (
      /\b(utilities|service providers|handoff|key contacts|tax)\s*:/i.test(
        rest,
      ) &&
      !/\b(wifi_ssid|wifi_password|gate_code|wifi\s*:|gate\s*:)/i.test(rest)
    ) {
      return {
        intake: null,
        turn: turn(
          "That looks like team master info. Use /master — the house guide is only Wi-Fi, gate, bins, quiet hours, checkout.",
        ),
      };
    }
    const patch = parseGuideFieldPatch(rest);
    if (!Object.keys(patch).length) {
      return {
        intake: null,
        turn: turn(
          "Could not parse guide fields. Use wifi_ssid:, wifi_password:, gate_code:, bins:, quiet_hours:, checkout:, extra: …\n(Team utilities/handoff belong in /master.)",
        ),
      };
    }
    await ctx.upsertHouseGuide(villa.id, patch);
    return {
      intake: null,
      turn: turn(
        `Updated guest house guide for ${villa.name}. That is separate from master info — use /master for the team handoff file.`,
      ),
    };
  }

  if (cmd === "/maint") {
    if (!args) {
      return {
        intake: null,
        turn: turn(
          "Send /maint plus a property name to list entries.\nAdd one: /maint Coral Water heater | Acme | replaced anode",
        ),
      };
    }
    const { villa, rest } = resolveVillaFromArgs(args, orgVillas);
    if (!villa) {
      return {
        intake: null,
        turn: turn("Which property? Use a name from /villas."),
      };
    }
    if (!rest) {
      const logs = ctx.villaMaintenanceLogs
        .filter((l) => l.villa_id === villa.id)
        .slice(0, 20);
      return {
        intake: null,
        turn: turn(
          lineList(
            logs.map((l) => {
              const bits = [
                l.logged_on,
                l.item,
                l.vendor,
                l.description,
              ].filter(Boolean);
              return `• ${bits.join(" · ")}`;
            }),
            `${villa.name}\nNo maintenance entries yet.`,
          ),
        ),
      };
    }
    const parts = rest.split("|").map((p) => p.trim()).filter(Boolean);
    const item = parts[0];
    if (!item) {
      return {
        intake: null,
        turn: turn("Need an item name. Example: /maint Coral Water heater | Acme"),
      };
    }
    const vendor = parts[1] || null;
    const description = parts.slice(2).join(" | ") || null;
    await ctx.addVillaMaintenanceLog({
      villa_id: villa.id,
      item,
      logged_on: new Date().toISOString().slice(0, 10),
      vendor,
      description,
    });
    return {
      intake: null,
      turn: turn(`Logged maintenance on ${villa.name}: ${item}`),
    };
  }

  return {
    intake: null,
    turn: turn(`Unknown command: ${cmd || "/"}\n\n${helpText()}`),
  };
}
