"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, KeyRound, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { useData } from "@/lib/data/use-app-data";
import { canManageMcpTokens } from "@/lib/mcp/scopes";
import { useI18n } from "@/lib/i18n/provider";
import { isDemoMode } from "@/lib/supabase/client";

type TokenRow = {
  id: string;
  label: string;
  token_prefix: string;
  scopes: string[];
  created_at: string;
  last_used_at: string | null;
};

const MCP_CONFIG_SNIPPET = `{
  "mcpServers": {
    "pulse": {
      "command": "npx",
      "args": ["tsx", "/ABSOLUTE/PATH/TO/mcp/src/index.ts"],
      "env": {
        "PULSE_BASE_URL": "__BASE__",
        "PULSE_MCP_TOKEN": "pfmcp_…"
      }
    }
  }
}`;

export function McpSettingsCard() {
  const { t } = useI18n();
  const data = useData();
  const role = data.profile?.role;
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [label, setLabel] = useState("My agent");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [freshToken, setFreshToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [snippetCopied, setSnippetCopied] = useState(false);

  const allowed = role ? canManageMcpTokens(role) : false;

  const baseUrl = useMemo(() => {
    if (typeof window === "undefined") return "https://pulseflow.site";
    return window.location.origin.replace(/\/$/, "");
  }, []);

  const configSnippet = useMemo(
    () =>
      MCP_CONFIG_SNIPPET.replace("__BASE__", baseUrl).replace(
        "pfmcp_…",
        freshToken ?? "pfmcp_…",
      ),
    [baseUrl, freshToken],
  );

  const load = useCallback(async () => {
    if (!allowed || isDemoMode()) return;
    try {
      const res = await fetch("/api/mcp/tokens", { credentials: "same-origin" });
      const payload = (await res.json()) as {
        tokens?: TokenRow[];
        error?: string;
      };
      if (!res.ok) throw new Error(payload.error ?? t("common.error"));
      setTokens(payload.tokens ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
    }
  }, [allowed, t]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!allowed) return null;

  if (isDemoMode()) {
    return (
      <Card className="space-y-2 p-4 sm:p-5">
        <h2 className="text-lg font-extrabold tracking-tight text-ink">
          {t("settings.mcpTitle")}
        </h2>
        <p className="type-meta">{t("settings.mcpDemoHint")}</p>
      </Card>
    );
  }

  const create = async () => {
    setBusy(true);
    setError(null);
    setFreshToken(null);
    setCopied(false);
    try {
      const res = await fetch("/api/mcp/tokens", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim() || "My agent" }),
      });
      const payload = (await res.json()) as {
        token?: string;
        error?: string;
      };
      if (!res.ok || !payload.token) {
        throw new Error(payload.error ?? t("common.error"));
      }
      setFreshToken(payload.token);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (id: string) => {
    if (!window.confirm(t("settings.mcpRevokeConfirm"))) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/mcp/tokens/${id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(payload.error ?? t("common.error"));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  const copyToken = async () => {
    if (!freshToken) return;
    try {
      await navigator.clipboard.writeText(freshToken);
      setCopied(true);
    } catch {
      setError(t("settings.mcpCopyFailed"));
    }
  };

  const copySnippet = async () => {
    try {
      await navigator.clipboard.writeText(configSnippet);
      setSnippetCopied(true);
      window.setTimeout(() => setSnippetCopied(false), 2000);
    } catch {
      setError(t("settings.mcpCopyFailed"));
    }
  };

  return (
    <Card className="space-y-4 p-4 sm:p-5">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-ink">
          <KeyRound className="size-5 text-primary" aria-hidden />
          {t("settings.mcpTitle")}
        </h2>
        <p className="type-meta mt-1">{t("settings.mcpHint")}</p>
      </div>

      <div className="space-y-2">
        <Label>{t("settings.mcpLabel")}</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="My agent"
            className="sm:flex-1"
          />
          <Button type="button" busy={busy} onClick={() => void create()}>
            {busy ? t("common.saving") : t("settings.mcpCreate")}
          </Button>
        </div>
      </div>

      {freshToken ? (
        <div className="space-y-2 rounded-2xl border border-secondary/30 bg-secondary-soft/40 p-3">
          <p className="text-xs font-semibold text-secondary-dark">
            {t("settings.mcpCopyOnce")}
          </p>
          <code className="block break-all rounded-xl bg-card px-3 py-2 text-xs text-ink">
            {freshToken}
          </code>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => void copyToken()}
          >
            <Copy className="size-4" />
            {copied ? t("settings.mcpCopied") : t("settings.mcpCopy")}
          </Button>
        </div>
      ) : null}

      <div className="space-y-2 rounded-2xl border border-primary/25 bg-primary-soft/30 p-3">
        <p className="text-sm font-bold text-ink">{t("settings.mcpConfigTitle")}</p>
        <p className="text-sm text-muted">{t("settings.mcpConfigHint")}</p>
        <pre className="overflow-x-auto rounded-xl bg-card px-3 py-2 text-[11px] leading-relaxed text-ink">
          {configSnippet}
        </pre>
        <Button type="button" size="sm" onClick={() => void copySnippet()}>
          <Copy className="size-4" />
          {snippetCopied ? t("settings.mcpCopied") : t("settings.mcpHowCopyConfig")}
        </Button>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {tokens.length ? (
        <ul className="space-y-2">
          {tokens.map((row) => (
            <li
              key={row.id}
              className="flex items-start justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-card px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">
                  {row.label}
                </p>
                <p className="type-meta mt-0.5">{row.token_prefix}…</p>
              </div>
              <Button
                type="button"
                size="xs"
                variant="ghost"
                className="shrink-0 text-danger"
                disabled={busy}
                onClick={() => void revoke(row.id)}
                aria-label={t("settings.mcpRevoke")}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="type-meta">{t("settings.mcpEmpty")}</p>
      )}

      <div className="space-y-3 border-t border-[var(--color-border)] pt-3 text-sm text-muted">
        <p className="text-sm font-bold text-ink">{t("settings.mcpHowTitle")}</p>
        <ol className="list-decimal space-y-2 pl-4 text-ink">
          <li>{t("settings.mcpHowStep1")}</li>
          <li>
            {t("settings.mcpHowStep2")}
            <pre className="mt-1.5 overflow-x-auto rounded-xl bg-[#F7F5F1] px-3 py-2 text-xs text-ink">
              cd mcp && npm install
            </pre>
          </li>
          <li>{t("settings.mcpHowStep3")}</li>
          <li>{t("settings.mcpHowStep4")}</li>
        </ol>
        <p className="text-xs leading-relaxed">{t("settings.mcpHowNpx")}</p>
        <p>
          <span className="font-semibold text-ink">
            {t("settings.mcpHowToolsLabel")}
          </span>{" "}
          {t("settings.mcpHowTools")}
        </p>
      </div>
    </Card>
  );
}
