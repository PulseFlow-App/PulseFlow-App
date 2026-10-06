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
  stripMention,
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
    hint: "open · done",
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
    hint: "pending · paid",
    descriptionKey: "messages.agent.cmd.bills",
    runOnPick: true,
  },
  {
    command: "/villa",
    hint: "name or famous place",
    descriptionKey: "messages.agent.cmd.villa",
    runOnPick: true,
  },
];

export function agentCommandSuggestions(
  input: string,
): AgentCommandSuggestion[] {
  if (!input.startsWith("/")) return [];
  const token = input.match(/^\/[^\s]*/)?.[0] ?? input;
  if (input.length > token.length) return [];
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
    /^(title @person villa|task…|task\.\.\.|service @person villa|name \| maps link|open · done|pending · paid|task name)$/i.test(
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
  }) => Promise<void>;
};

function helpText() {
  return [
    "Type / for commands. Tap a row to run it.",
    ...AGENT_CHAT_COMMANDS.map((c) =>
      c.hint ? `${c.command} — ${c.hint}` : c.command,
    ),
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
    if (text.startsWith("/") && !/^\/cancel$/i.test(text)) {
      return runAgentCommand(text, ctx, { ...options, intake: null });
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

  const [cmdToken, ...restParts] = text.split(/\s+/);
  const cmd = (cmdToken ?? "").toLowerCase();
  const args = isDummyArg(restParts.join(" "))
    ? ""
    : restParts.join(" ").trim();
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
            (v) => `• ${v.name}${v.status ? ` — ${v.status}` : ""}`,
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
            return `• ${t.title}${bits.length ? ` (${bits.join(" · ")})` : ""}`;
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
    let working = args;
    const mention = extractMentionToken(working);
    let assignee: Profile | null = null;
    if (mention) {
      assignee = resolveTeammate(mention, orgProfiles);
      if (!assignee) {
        return {
          intake: null,
          turn: turn(`No teammate matching @${mention}. Try /team.`),
        };
      }
      working = stripMention(working, mention);
    }
    const { rest, villa } = peelVillaFromText(working, orgVillas);
    const title = rest.trim();
    if (!title) {
      return { intake: null, turn: turn("Need a task title.") };
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
    return {
      intake: null,
      turn: turn(
        `Created task: ${title}${bits.length ? ` (${bits.join(" · ")})` : ""}`,
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
            return `• ${o.service_type} — ${o.location_label ?? "—"} (${o.status}${
              who ? ` · ${who.full_name}` : ""
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
    let working = args;
    const mention = extractMentionToken(working);
    if (!mention) {
      return {
        intake: null,
        turn: turn("Tag who should do it with @Name."),
      };
    }
    const assignee = resolveTeammate(mention, orgProfiles);
    if (!assignee) {
      return {
        intake: null,
        turn: turn(`No teammate matching @${mention}. Try /team.`),
      };
    }
    working = stripMention(working, mention);
    const { rest, villa } = peelVillaFromText(working, orgVillas);
    const serviceType = rest.trim();
    if (!serviceType) {
      return {
        intake: null,
        turn: turn("Need a service type (e.g. Deep clean)."),
      };
    }
    const contact = resolveContactForProfile(assignee.id, orgContacts);
    if (!contact) {
      return {
        intake: null,
        turn: turn(
          `${assignee.full_name} needs a Contacts entry linked to their profile before you can book a job.`,
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
        `Booked: ${order.service_type} for ${assignee.full_name}${
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
            return `• ${b.description} — ${b.amount} ${b.currency}${
              villa ? ` · ${villa.name}` : ""
            } (${b.status})`;
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

  return {
    intake: null,
    turn: turn(`Unknown command: ${cmdToken}\n\n${helpText()}`),
  };
}
