#!/usr/bin/env npx tsx
/**
 * Pulse MCP — talks only to Pulse HTTP APIs with a personal token.
 * Never needs SUPABASE_SERVICE_ROLE_KEY.
 *
 * Env:
 *   PULSE_BASE_URL  e.g. https://pulseflow.site  (no trailing slash)
 *   PULSE_MCP_TOKEN  connection key from Settings → Connect your agent (pfmcp_…)
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const baseUrl = (process.env.PULSE_BASE_URL ?? "").replace(/\/$/, "");
const token = process.env.PULSE_MCP_TOKEN ?? "";

if (!baseUrl || !token) {
  console.error(
    "Set PULSE_BASE_URL and PULSE_MCP_TOKEN (from Pulse Settings → Connect your agent).",
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
  version: "0.1.0",
});

server.tool("pulse_whoami", "Show the Pulse profile and org this token acts as.", {}, async () => {
  const me = await api("/api/mcp/me");
  return textResult(me);
});

server.tool(
  "pulse_list_tasks",
  "List tasks in the token org. Optional status: open | pending_verify | done.",
  {
    status: z.enum(["open", "pending_verify", "done"]).optional(),
    limit: z.number().int().min(1).max(100).optional(),
  },
  async ({ status, limit }) => {
    const data = await api("/api/mcp/tasks", {
      query: {
        status,
        limit: limit != null ? String(limit) : undefined,
      },
    });
    return textResult(data);
  },
);

server.tool(
  "pulse_create_task",
  "Create an open task in the token org.",
  {
    title: z.string().min(1).max(200),
    villa_id: z.string().uuid().nullable().optional(),
    priority: z.enum(["normal", "urgent"]).optional(),
    assigned_to: z.string().uuid().nullable().optional(),
    due_date: z.string().nullable().optional(),
    notes: z.string().max(2000).nullable().optional(),
  },
  async (input) => {
    const data = await api("/api/mcp/tasks", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return textResult(data);
  },
);

server.tool(
  "pulse_list_jobs",
  "List service orders (jobs). Optional status: pending_ack | agreed | done | cancelled.",
  {
    status: z
      .enum(["pending_ack", "agreed", "done", "cancelled"])
      .optional(),
    limit: z.number().int().min(1).max(100).optional(),
  },
  async ({ status, limit }) => {
    const data = await api("/api/mcp/jobs", {
      query: {
        status,
        limit: limit != null ? String(limit) : undefined,
      },
    });
    return textResult(data);
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
