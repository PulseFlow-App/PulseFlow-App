"use client";

import type { TaskWithRelations } from "@/lib/types";

/** Villa / schedule line + assignee on its own line so the name isn't clipped. */
export function TaskAssigneeMeta({
  task,
  villaLabel,
  schedule,
}: {
  task: TaskWithRelations;
  villaLabel: string;
  schedule?: string | null;
}) {
  return (
    <div className="min-w-0">
      <p className="truncate text-xs text-muted">
        {villaLabel}
        {schedule ? ` · ${schedule}` : ""}
      </p>
      {task.assignee ? (
        <p className="truncate text-xs font-semibold text-ink">
          {task.assignee.full_name}
        </p>
      ) : null}
    </div>
  );
}
