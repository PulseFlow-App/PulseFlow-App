# Prompt: add “Connect your agent” to the marketing website

Copy everything below the line into the agent / designer working on **www.pulseflow.site** (pulseflow-site).

---

## Task

Add a new **feature explanation** block for Pulse’s AI agent connection (“Connect your agent”). Place it on the marketing homepage among the product features — after **One language for the whole team** (or as a fifth card under “Everything you need for work” if that layout fits better). Also add a short mention on the **Owners** and **Managers** role pages. Do **not** put it on the Guests page. Do **not** sell it as a separate product or paid add-on.

Follow existing site voice, layout patterns, and i18n key style (`f*_title` / feature cards). Ship EN first; leave RU/TH hooks if the site already uses parallel dictionaries.

## What the feature is (product truth)

- For **owners and managers** who want Cursor (or another MCP-compatible AI agent) to work **inside their Pulse workspace**.
- In the app: **Settings → Connect your agent** → create a **connection key** (shown once) → paste into the agent app.
- The agent talks only to Pulse HTTP APIs with that key. **No database / service-role key** is shared with the agent.
- Key is bound to the user’s **current workspace** and profile; they can **Disconnect** anytime.
- v1 agent capabilities: see who it is (`pulse_whoami`), list/create **tasks**, list **jobs** (service orders).
- Not for staff/guests. Not push, billing, or reviews in v1.

## Positioning (use this angle)

**Lead with outcome, not “MCP”.**  
Headline idea: *Connect your AI agent to the ops workspace* / *Let your agent see the real work*.

Supporting idea in one sentence:  
Managers and owners can let Cursor (or similar) read and update live tasks and jobs in Pulse — safely, with a connection key from Settings.

Avoid: jargon-first (“MCP server”, “stdio”, “Supabase”), “API platform”, developer-only tone.  
OK as a quiet secondary line: “Works with Cursor and other MCP clients.”

## Suggested homepage copy (EN)

**Title:** Connect your agent  
**Subtitle:** Give Cursor (or another AI agent) a live window into this workspace — tasks and jobs — without sharing your database.

**Bullets (pick 3):**
- Create a connection key in Settings — shown once, revocable anytime  
- Agent stays inside your company workspace (owners & managers only)  
- List and create tasks; see open jobs — same truth the team sees in the app  

**CTA (optional):** Open the app → Settings → Connect your agent  
(Link to `https://app.pulseflow.site/settings` if you use app deep links; otherwise “Available in the app under Settings.”)

**Do not** paste full `mcp.json` / `npm install` on the marketing homepage. That setup belongs in-app under the collapsed **How to connect an agent** section (already built). Website = why it matters; app = how to wire it.

## Role pages

**Owners:** One short paragraph — “Connect an AI agent to your company workspace to ask about open tasks and jobs without opening another spreadsheet.”  
**Managers:** Same idea, day-to-day ops angle — “Hand an agent the live task list so status checks don’t eat the shift.”  
**Staff / Guests:** Skip.

## Design constraints (from Pulse brand / site rules)

- Match existing feature-section composition (one job per section: one title, one short support line, short bullets).
- No purple-on-white / indigo AI cliché look; stay on Pulse’s sand / primary / secondary system.
- No “AI magic” glow cards or floating badges on hero media.
- Do not put this in the first viewport / hero. It is a secondary feature explanation, not the main product pitch.
- Prefer one clear visual idea if art is needed: phone Settings “Connect your agent” + Cursor-style agent side-by-side — not abstract neural nets.

## Acceptance checklist

- [ ] Homepage has a readable feature block with user-friendly name (not “MCP”)
- [ ] Copy says owners/managers + connection key + tasks/jobs
- [ ] Safety line: no database key shared; disconnect anytime
- [ ] Owners + Managers pages mention it briefly
- [ ] Guests page unchanged
- [ ] No full install/`mcp.json` dump on marketing pages
- [ ] EN copy shipped; other locales either translated or clearly falling back without broken keys

## Out of scope

- Implementing the in-app Settings card (already done in the app repo)
- Publishing service-role credentials or public MCP endpoints without the personal key model
- Claiming the agent can do bills, chat, push, or endorsements yet
