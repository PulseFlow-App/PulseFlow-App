import type { MessageKey } from "@/lib/i18n";
import type { TaskStatus } from "@/lib/design-tokens";
import type {
  Bill,
  Contact,
  Organization,
  Profile,
  ServiceOrder,
  Task,
  Villa,
} from "@/lib/types";
import {
  extractMentionToken,
  peelVillaFromText,
  resolveContactForProfile,
  resolveTask,
  resolveTeammate,
  resolveVilla,
  stripMention,
} from "@/lib/agent-chat/resolve";

export type AgentCommandSuggestion = {
  command: string;
  placeholder: string;
  descriptionKey: MessageKey;
};

export const AGENT_CHAT_COMMANDS: AgentCommandSuggestion[] = [
  {
    command: "/help",
    placeholder: "",
    descriptionKey: "messages.agent.cmd.help",
  },
  {
    command: "/whoami",
    placeholder: "",
    descriptionKey: "messages.agent.cmd.whoami",
  },
  {
    command: "/team",
    placeholder: "",
    descriptionKey: "messages.agent.cmd.team",
  },
  {
    command: "/villas",
    placeholder: "",
    descriptionKey: "messages.agent.cmd.villas",
  },
  {
    command: "/tasks",
    placeholder: "[open|done]",
    descriptionKey: "messages.agent.cmd.tasks",
  },
  {
    command: "/task",
    placeholder: "title @person villa",
    descriptionKey: "messages.agent.cmd.task",
  },
  {
    command: "/done",
    placeholder: "task…",
    descriptionKey: "messages.agent.cmd.done",
  },
  {
    command: "/jobs",
    placeholder: "",
    descriptionKey: "messages.agent.cmd.jobs",
  },
  {
    command: "/job",
    placeholder: "service @person villa",
    descriptionKey: "messages.agent.cmd.job",
  },
  {
    command: "/bills",
    placeholder: "[pending|paid]",
    descriptionKey: "messages.agent.cmd.bills",
  },
  {
    command: "/villa",
    placeholder: "Name | maps link",
    descriptionKey: "messages.agent.cmd.villa",
  },
];

/** Slash picker while typing `/…` before the first space ends. */
export function agentCommandSuggestions(input: string): AgentCommandSuggestion[] {
  if (!input.startsWith("/")) return [];
  const token = input.match(/^\/[^\s]*/)?.[0] ?? input;
  // After a space, hide the menu (user is filling args).
  if (input.length > token.length) return [];
  const q = token.toLowerCase();
  return AGENT_CHAT_COMMANDS.filter((c) => {
    const cmd = c.command.toLowerCase();
    return cmd.startsWith(q) && cmd !== q;
  });
}

export function agentCommandPickText(cmd: AgentCommandSuggestion) {
  if (!cmd.placeholder) return `${cmd.command} `;
  return `${cmd.command} ${cmd.placeholder}`;
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
  }) => Promise<void>;
};

function helpText() {
  const lines = [
    "Pulse Agent — type / for commands:",
    ...AGENT_CHAT_COMMANDS.map((c) =>
      c.placeholder ? `${c.command} ${c.placeholder}` : c.command,
    ),
  ];
  return lines.join("\n");
}

function lineList(rows: string[], empty: string) {
  if (!rows.length) return empty;
  return rows.join("\n");
}

export async function runAgentCommand(
  raw: string,
  ctx: AgentCommandContext,
): Promise<string> {
  const text = raw.trim();
  if (!text.startsWith("/")) {
    return `I only run slash commands for now.\n\n${helpText()}`;
  }

  const [cmdToken, ...restParts] = text.split(/\s+/);
  const cmd = (cmdToken ?? "").toLowerCase();
  const args = restParts.join(" ").trim();
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

  if (cmd === "/help") return helpText();

  if (cmd === "/whoami") {
    return [
      `${ctx.profile.full_name}`,
      `Role: ${ctx.profile.role}`,
      `Org: ${ctx.organization?.name ?? ctx.profile.org_id}`,
      `Kind: ${ctx.organization?.kind ?? "—"}`,
    ].join("\n");
  }

  if (cmd === "/team") {
    return lineList(
      orgProfiles.map((p) => `• ${p.full_name} (${p.role})`),
      "No teammates yet.",
    );
  }

  if (cmd === "/villas") {
    return lineList(
      orgVillas.map((v) => `• ${v.name}${v.status ? ` — ${v.status}` : ""}`),
      "No properties yet.",
    );
  }

  if (cmd === "/tasks") {
    const statusFilter = args.toLowerCase();
    let list = orgTasks;
    if (statusFilter === "open" || statusFilter === "done") {
      list = orgTasks.filter((t) => t.status === statusFilter);
    } else if (
      statusFilter === "pending_verify" ||
      statusFilter === "verify"
    ) {
      list = orgTasks.filter((t) => t.status === "pending_verify");
    } else if (statusFilter) {
      return "Usage: /tasks [open|done|pending_verify]";
    } else {
      list = orgTasks.filter((t) => t.status !== "done");
    }
    return lineList(
      list.slice(0, 40).map((t) => {
        const villa = orgVillas.find((v) => v.id === t.villa_id);
        const who = orgProfiles.find((p) => p.id === t.assigned_to);
        const bits = [
          t.status,
          villa?.name,
          who?.full_name ? `@${who.full_name}` : null,
        ].filter(Boolean);
        return `• ${t.title}${bits.length ? ` (${bits.join(" · ")})` : ""}`;
      }),
      "No matching tasks.",
    );
  }

  if (cmd === "/task") {
    if (!args) {
      return "Usage: /task title @person villa\nExample: /task Restock fridge @Mai Coral";
    }
    let working = args;
    const mention = extractMentionToken(working);
    let assignee: Profile | null = null;
    if (mention) {
      assignee = resolveTeammate(mention, orgProfiles);
      if (!assignee) {
        return `No teammate matching @${mention}. Try /team.`;
      }
      working = stripMention(working, mention);
    }
    const { rest, villa } = peelVillaFromText(working, orgVillas);
    const title = rest.trim();
    if (!title) {
      return "Usage: /task title @person villa\nNeed a task title.";
    }
    await ctx.createTask({
      title,
      villa_id: villa?.id ?? null,
      priority: /urgent/i.test(title) ? "urgent" : "normal",
      assigned_to: assignee?.id ?? null,
      due_date: null,
    });
    const bits = [
      assignee ? `@${assignee.full_name}` : null,
      villa?.name ?? null,
    ].filter(Boolean);
    return `Created task: ${title}${bits.length ? ` (${bits.join(" · ")})` : ""}`;
  }

  if (cmd === "/done") {
    if (!args) {
      return "Usage: /done task…\nExample: /done Restock fridge";
    }
    const task = resolveTask(args, orgTasks, ["open", "pending_verify"]);
    if (!task) {
      return `No open task matching “${args}”. Try /tasks.`;
    }
    await ctx.setTaskStatus(task.id, "done");
    return `Marked done: ${task.title}`;
  }

  if (cmd === "/jobs") {
    const open = orgOrders.filter(
      (o) => o.status === "pending_ack" || o.status === "agreed",
    );
    return lineList(
      open.slice(0, 40).map((o) => {
        const who = orgProfiles.find((p) => p.id === o.staff_profile_id);
        return `• ${o.service_type} — ${o.location_label ?? "—"} (${o.status}${
          who ? ` · ${who.full_name}` : ""
        })`;
      }),
      "No open jobs.",
    );
  }

  if (cmd === "/job") {
    if (!args) {
      return "Usage: /job service @person villa\nExample: /job Deep clean @Mai Coral";
    }
    let working = args;
    const mention = extractMentionToken(working);
    if (!mention) {
      return "Usage: /job service @person villa\nTag who should do it with @Name.";
    }
    const assignee = resolveTeammate(mention, orgProfiles);
    if (!assignee) {
      return `No teammate matching @${mention}. Try /team.`;
    }
    working = stripMention(working, mention);
    const { rest, villa } = peelVillaFromText(working, orgVillas);
    const serviceType = rest.trim();
    if (!serviceType) {
      return "Usage: /job service @person villa\nNeed a service type (e.g. Deep clean).";
    }
    const contact = resolveContactForProfile(assignee.id, orgContacts);
    if (!contact) {
      return `${assignee.full_name} needs a Contacts entry linked to their profile before you can book a job. Add them under Contacts, then retry.`;
    }
    const order = await ctx.createServiceOrder({
      contact_id: contact.id,
      villa_id: villa?.id ?? null,
      location_label: villa?.name ?? null,
      service_type: serviceType,
    });
    return `Booked: ${order.service_type} for ${assignee.full_name}${
      villa ? ` at ${villa.name}` : ""
    }. They’ll see it in Questions/Feedback.`;
  }

  if (cmd === "/bills") {
    const statusFilter = args.toLowerCase();
    let list = orgBills;
    if (statusFilter === "pending" || statusFilter === "paid") {
      list = orgBills.filter((b) => b.status === statusFilter);
    } else if (statusFilter) {
      return "Usage: /bills [pending|paid]";
    } else {
      list = orgBills.filter((b) => b.status === "pending");
    }
    return lineList(
      list.slice(0, 40).map((b) => {
        const villa = orgVillas.find((v) => v.id === b.villa_id);
        return `• ${b.description} — ${b.amount} ${b.currency}${
          villa ? ` · ${villa.name}` : ""
        } (${b.status})`;
      }),
      "No matching bills.",
    );
  }

  if (cmd === "/villa") {
    if (!args) {
      return [
        "Usage: /villa Name | https://maps…",
        "For photo + full details, use Properties in the app or Connect your agent.",
      ].join("\n");
    }
    const parts = args.split("|").map((p) => p.trim());
    const name = parts[0] ?? "";
    const locationUrl = parts[1] ?? "";
    if (!name || !locationUrl) {
      return "Usage: /villa Name | https://maps…\nBoth name and maps link are required.";
    }
    if (!/^https?:\/\//i.test(locationUrl)) {
      return "Maps link must start with http:// or https://";
    }
    const existing = resolveVilla(name, orgVillas);
    if (existing) {
      return `A property named “${existing.name}” already exists.`;
    }
    await ctx.createVilla({ name, location_url: locationUrl });
    return `Added property: ${name}`;
  }

  return `Unknown command: ${cmdToken}\n\n${helpText()}`;
}
