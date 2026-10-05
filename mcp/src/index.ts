/**
 * Pulse MCP — talks only to Pulse HTTP APIs with a personal token.
 * Never needs SUPABASE_SERVICE_ROLE_KEY.
 *
 * Env:
 *   PULSE_MCP_TOKEN  connection key from Settings → Connect your agent (pfmcp_…)
 *   PULSE_BASE_URL   optional, defaults to https://app.pulseflow.site
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const DEFAULT_BASE_URL = "https://app.pulseflow.site";
const baseUrl = (process.env.PULSE_BASE_URL || DEFAULT_BASE_URL).replace(
  /\/$/,
  "",
);
const token = process.env.PULSE_MCP_TOKEN ?? "";

if (!token) {
  console.error(
    "Set PULSE_MCP_TOKEN (from Pulse Settings → Connect your agent).",
  );
  process.exit(1);
}

async function api<T>(
  path: string,
  init?: RequestInit & { query?: Record<string, string | undefined> },
): Promise<T> {
  const url = new URL(path, `${baseUrl}/`);
  if (init?.query) {
    for (const [k, v] of Object.entries(init.query)) {
      if (v != null && v !== "") url.searchParams.set(k, v);
    }
  }
  const { query: _q, ...rest } = init ?? {};
  const res = await fetch(url, {
    ...rest,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(rest.headers ?? {}),
    },
  });
  const body = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(body.error || `HTTP ${res.status} ${path}`);
  }
  return body;
}

function textResult(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text:
          typeof data === "string" ? data : JSON.stringify(data, null, 2),
      },
    ],
  };
}

const server = new McpServer({
  name: "pulse",
  version: "0.2.0",
});

server.tool("pulse_whoami", "Show the Pulse profile and org this token acts as.", {}, async () => {
  const me = await api("/api/mcp/me");
  return textResult(me);
});

server.tool(
  "pulse_list_team",
  "List teammates (owners, managers, staff) — use ids to assign tasks/jobs.",
  {},
  async () => textResult(await api("/api/mcp/team")),
);

server.tool(
  "pulse_list_villas",
  "List properties. Optional status: available | occupied | turnover | maintenance.",
  {
    status: z
      .enum(["available", "occupied", "turnover", "maintenance"])
      .optional(),
    limit: z.number().int().min(1).max(100).optional(),
  },
  async ({ status, limit }) =>
    textResult(
      await api("/api/mcp/villas", {
        query: {
          status,
          limit: limit != null ? String(limit) : undefined,
        },
      }),
    ),
);

server.tool(
  "pulse_create_villa",
  "Add a property once. Ask only three things first, with no intro: name, photo, and location link. Then ask this questionnaire. Do not create until both steps are done. Bedrooms: 1, 2, 3, 4, 5, 6 or more. Bathrooms: 1, 2, 3, 4, 5 or more. Size: under 150 m², 150–300, 300–500, over 500, not sure — keep a range as text in details and do not set sq_m. Guests: 2, 4, 6, 8, 10, 12 or more. Air conditioning: all rooms (aircon=full), some rooms (partial), none. Parking: private, street, none. View: sea, jungle, pool, garden, mountain. Also true (any of): garden (has_garden), Wi-Fi (has_wifi), pet friendly (pet_friendly), full kitchen (kitchen=full), standalone house (setting=standalone). Leave an extra unset when they do not mark it: omit the field, do not send false. The photo they give goes on the listing as photos[].data_base64 (raw base64 JPEG, PNG, or WebP, no data: prefix). The location link they give is location_url. Do not search the internet for a name, photo, or place, and do not invent one. A voice note can answer these questions: transcribe it yourself and use those words. Pulse cannot edit a listing after it is created.",
  {
    name: z.string().min(1).max(200),
    location_url: z.string().url().max(2000).nullable().optional(),
    area: z.string().max(200).nullable().optional(),
    description: z.string().max(2000).nullable().optional(),
    details: z.string().max(2000).nullable().optional(),
    photo_url: z.string().url().max(2000).nullable().optional(),
    photo_urls: z.array(z.string().url().max(2000)).max(6).optional(),
    photos: z
      .array(z.object({ data_base64: z.string().min(32).max(6_000_000) }))
      .max(6)
      .optional(),
    status: z.enum(["available", "occupied", "turnover", "maintenance"]).optional(),
    property_type: z
      .enum(["villa", "bungalow", "house", "apartment", "studio", "office", "other"])
      .nullable()
      .optional(),
    sq_m: z.number().positive().max(100000).nullable().optional(),
    bedrooms: z.number().int().min(0).max(100).nullable().optional(),
    bathrooms: z.number().min(0).max(100).nullable().optional(),
    max_guests: z.number().int().min(1).max(500).nullable().optional(),
    floors: z.number().int().min(1).max(100).nullable().optional(),
    has_pool: z.boolean().nullable().optional(),
    has_garden: z.boolean().nullable().optional(),
    pet_friendly: z.boolean().nullable().optional(),
    has_wifi: z.boolean().nullable().optional(),
    setting: z.enum(["community", "standalone"]).nullable().optional(),
    parking: z.enum(["none", "street", "private"]).nullable().optional(),
    kitchen: z.enum(["none", "basic", "full"]).nullable().optional(),
    aircon: z.enum(["none", "partial", "full"]).nullable().optional(),
    view: z.enum(["sea", "jungle", "pool", "garden", "mountain"]).nullable().optional(),
  },
  async (input) =>
    textResult(
      await api("/api/mcp/villas", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    ),
);

server.tool(
  "pulse_list_tasks",
  "List tasks. Optional status: open | pending_verify | done.",
  {
    status: z.enum(["open", "pending_verify", "done"]).optional(),
    limit: z.number().int().min(1).max(100).optional(),
  },
  async ({ status, limit }) =>
    textResult(
      await api("/api/mcp/tasks", {
        query: {
          status,
          limit: limit != null ? String(limit) : undefined,
        },
      }),
    ),
);

server.tool(
  "pulse_create_task",
  "Create an open task. Use pulse_list_team / pulse_list_villas for ids.",
  {
    title: z.string().min(1).max(200),
    villa_id: z.string().uuid().nullable().optional(),
    priority: z.enum(["normal", "urgent"]).optional(),
    assigned_to: z.string().uuid().nullable().optional(),
    due_date: z.string().nullable().optional(),
    notes: z.string().max(2000).nullable().optional(),
  },
  async (input) =>
    textResult(
      await api("/api/mcp/tasks", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    ),
);

server.tool(
  "pulse_update_task_status",
  "Set a task status to open, pending_verify, or done.",
  {
    task_id: z.string().uuid(),
    status: z.enum(["open", "pending_verify", "done"]),
  },
  async ({ task_id, status }) =>
    textResult(
      await api(`/api/mcp/tasks/${task_id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    ),
);

server.tool(
  "pulse_list_jobs",
  "List service orders. Optional status: pending_ack | agreed | done | cancelled.",
  {
    status: z
      .enum(["pending_ack", "agreed", "done", "cancelled"])
      .optional(),
    limit: z.number().int().min(1).max(100).optional(),
  },
  async ({ status, limit }) =>
    textResult(
      await api("/api/mcp/jobs", {
        query: {
          status,
          limit: limit != null ? String(limit) : undefined,
        },
      }),
    ),
);

server.tool(
  "pulse_create_job",
  "Book a job for a teammate (creates order + task + request chat). Need staff_profile_id from pulse_list_team (or contact_id).",
  {
    service_type: z.string().min(1).max(120),
    staff_profile_id: z.string().uuid().optional(),
    contact_id: z.string().uuid().optional(),
    villa_id: z.string().uuid().nullable().optional(),
    location_label: z.string().max(200).nullable().optional(),
    details: z.string().max(2000).nullable().optional(),
    scheduled_date: z.string().nullable().optional(),
    time_start: z.string().nullable().optional(),
    time_end: z.string().nullable().optional(),
  },
  async (input) =>
    textResult(
      await api("/api/mcp/jobs", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    ),
);

server.tool(
  "pulse_get_property_instructions",
  "Read the guest-facing house guide for a property (Wi-Fi, gate, bins, quiet hours, checkout, extra notes).",
  { villa_id: z.string().uuid() },
  async ({ villa_id }) =>
    textResult(await api(`/api/mcp/villas/${villa_id}/instructions`)),
);

server.tool(
  "pulse_set_property_instructions",
  "Set guest-facing house instructions for a property. Guests see these on their booking. Send only the fields to change. Empty string clears a field.",
  {
    villa_id: z.string().uuid(),
    wifi_ssid: z.string().max(200).nullable().optional(),
    wifi_password: z.string().max(200).nullable().optional(),
    gate_code: z.string().max(120).nullable().optional(),
    bins_notes: z.string().max(2000).nullable().optional(),
    quiet_hours: z.string().max(500).nullable().optional(),
    checkout_checklist: z.string().max(4000).nullable().optional(),
    extra_notes: z.string().max(4000).nullable().optional(),
  },
  async ({ villa_id, ...fields }) =>
    textResult(
      await api(`/api/mcp/villas/${villa_id}/instructions`, {
        method: "PUT",
        body: JSON.stringify(fields),
      }),
    ),
);

server.tool(
  "pulse_assign_property",
  "Assign a cleaner or staff teammate to a property. profile_id comes from pulse_list_team. Other assignees stay.",
  {
    villa_id: z.string().uuid(),
    profile_id: z.string().uuid(),
  },
  async ({ villa_id, profile_id }) =>
    textResult(
      await api(`/api/mcp/villas/${villa_id}/assign`, {
        method: "POST",
        body: JSON.stringify({ profile_id }),
      }),
    ),
);

server.tool(
  "pulse_list_bills",
  "List bills. Optional status: pending | paid.",
  {
    status: z.enum(["pending", "paid"]).optional(),
    limit: z.number().int().min(1).max(100).optional(),
  },
  async ({ status, limit }) =>
    textResult(
      await api("/api/mcp/bills", {
        query: {
          status,
          limit: limit != null ? String(limit) : undefined,
        },
      }),
    ),
);

const transport = new StdioServerTransport();
await server.connect(transport);
