"use client";

import { useEffect, useState } from "react";
import { Ban } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/provider";
import { useData } from "@/lib/data/use-app-data";
import {
  listBlockedUsers,
  unblockUserLocally,
  type BlockRecord,
} from "@/lib/safety/blocks";

export function BlockedUsersCard() {
  const { t } = useI18n();
  const data = useData();
  const viewerId = data.profile?.id;
  const [blocks, setBlocks] = useState<BlockRecord[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!viewerId) {
      setBlocks([]);
      return;
    }
    setBlocks(listBlockedUsers(viewerId));
  }, [viewerId, tick]);

  if (!viewerId) return null;
  if (blocks.length === 0) return null;

  const unblock = async (blockedId: string) => {
    unblockUserLocally(viewerId, blockedId);
    await fetch(
      `/api/safety/block?blockedId=${encodeURIComponent(blockedId)}`,
      { method: "DELETE" },
    ).catch(() => null);
    setTick((n) => n + 1);
  };

  return (
    <Card className="space-y-3 p-4 sm:p-5">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-ink">
          <Ban className="size-5 text-muted" />
          {t("safety.blockedTitle")}
        </h2>
        <p className="type-meta mt-1">{t("safety.blockedHint")}</p>
      </div>
      <ul className="space-y-2">
        {blocks.map((b) => {
          const profile = data.profiles.find((p) => p.id === b.blockedId);
          const name =
            profile?.full_name ?? b.blockedName ?? t("messages.teammate");
          return (
            <li
              key={b.blockedId}
              className="flex items-center justify-between gap-3 rounded-xl bg-canvas-deep px-3 py-2"
            >
              <span className="truncate text-sm font-semibold text-ink">
                {name}
              </span>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void unblock(b.blockedId)}
              >
                {t("safety.unblock")}
              </Button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
