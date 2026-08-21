"use client";

import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { TaskWithRelations } from "@/lib/types";
import { formatShortDate } from "@/lib/utils";
import { capitalizeLabel } from "@/lib/format-label";

export function UrgentTasks({
  tasks,
  onClose,
}: {
  tasks: TaskWithRelations[];
  onClose: (id: string) => Promise<void>;
}) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        title="No urgent tasks"
        description="You're clear - new urgent items will show up here."
      />
    );
  }

  return (
    <Card className="overflow-hidden font-sans">
      <div className="border-b border-black/5 px-4 py-3">
        <h2 className="font-sans text-base font-bold text-ink">
          Urgent open tasks
        </h2>
      </div>
      <ul className="divide-y divide-black/5">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="flex items-center gap-3 px-4 py-3"
          >
            <button
              type="button"
              onClick={() => void onClose(task.id)}
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary"
              aria-label={`Close ${capitalizeLabel(task.title)}`}
            >
              <Check className="size-4" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate font-sans text-[15px] font-semibold text-ink">
                {capitalizeLabel(task.title)}
              </p>
              <p className="truncate font-sans text-xs font-medium text-muted">
                {task.villa?.name ?? "General"}
                {task.due_date ? ` · due ${formatShortDate(task.due_date)}` : ""}
              </p>
            </div>
            <span className="rounded-full bg-danger/10 px-2 py-1 font-sans text-[10px] font-bold uppercase tracking-wide text-danger">
              Urgent
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
