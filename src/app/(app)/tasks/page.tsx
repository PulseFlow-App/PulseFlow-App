"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { EmptyState, LoadingState } from "@/components/ui/empty-state";
import { useData } from "@/lib/data/use-app-data";
import { formatWorkWindow } from "@/lib/notifications";
import { isStaffApp } from "@/lib/roles";
import { formatShortDate, cn } from "@/lib/utils";
import { capitalizeLabel } from "@/lib/format-label";
import type { TaskPriority } from "@/lib/design-tokens";

type Filter = "all" | "mine" | "urgent";

export default function TasksPage() {
  const data = useData();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [villaId, setVillaId] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data.profile && isStaffApp(data.profile.role)) {
      router.replace("/jobs");
    }
  }, [data.profile, router]);

  const filtered = useMemo(() => {
    return data.tasks.filter((t) => {
      if (filter === "mine") return t.assigned_to === data.profile?.id;
      if (filter === "urgent") return t.priority === "urgent";
      return true;
    });
  }, [data.tasks, data.profile?.id, filter]);

  const open = filtered.filter((t) => t.status === "open");
  const done = filtered.filter((t) => t.status === "done");

  if (!data.ready) return <LoadingState />;

  const create = async () => {
    setError(null);
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    try {
      await data.createTask({
        title: title.trim(),
        villa_id: villaId || null,
        priority,
        assigned_to: assignee || null,
        due_date: dueDate || null,
        time_start: timeStart || null,
        time_end: timeEnd || null,
      });
      setTitle("");
      setVillaId("");
      setPriority("normal");
      setAssignee("");
      setDueDate("");
      setTimeStart("");
      setTimeEnd("");
      setShowForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create task.");
    }
  };

  return (
    <div className="space-y-4 animate-rise">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Tasks</h1>
          <p className="text-sm text-muted">{open.length} open</p>
        </div>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="size-4" /> Add
        </Button>
      </div>

      <div className="flex gap-2">
        {(["all", "mine", "urgent"] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold capitalize",
              filter === f
                ? "bg-primary text-white"
                : "bg-card text-muted shadow-sm",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {showForm ? (
        <Card className="space-y-3 p-4">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label>Property</Label>
            <Select value={villaId} onChange={(e) => setVillaId(e.target.value)}>
              <option value="">General</option>
              {data.villas.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Priority</Label>
              <Select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
              </Select>
            </div>
            <div>
              <Label>Day</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>From</Label>
              <Input
                type="time"
                value={timeStart}
                onChange={(e) => setTimeStart(e.target.value)}
              />
            </div>
            <div>
              <Label>Until</Label>
              <Input
                type="time"
                value={timeEnd}
                onChange={(e) => setTimeEnd(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label>Assignee</Label>
            <Select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
            >
              <option value="">Unassigned</option>
              {data.profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </Select>
          </div>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button className="w-full" onClick={() => void create()}>
            Create task
          </Button>
        </Card>
      ) : null}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted">Open</h2>
        {open.length === 0 ? (
          <EmptyState title="No open tasks" description="Nice and clear." />
        ) : (
          open.map((task) => (
            <Card key={task.id} className="flex items-center gap-3 p-3">
              <button
                type="button"
                className="size-5 rounded-full border-2 border-secondary"
                aria-label="Mark done"
                onClick={() => void data.setTaskStatus(task.id, "done")}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">
                  {capitalizeLabel(task.title)}
                </p>
                <p className="truncate text-xs text-muted">
                  {task.villa?.name ?? "General"}
                  {formatWorkWindow(
                    task.due_date,
                    task.time_start,
                    task.time_end,
                  )
                    ? ` · ${formatWorkWindow(
                        task.due_date,
                        task.time_start,
                        task.time_end,
                      )}`
                    : task.due_date
                      ? ` · ${formatShortDate(task.due_date)}`
                      : ""}
                  {task.assignee ? ` · ${task.assignee.full_name}` : ""}
                </p>
              </div>
              {task.priority === "urgent" ? (
                <span className="text-[10px] font-bold uppercase text-danger">
                  Urgent
                </span>
              ) : null}
            </Card>
          ))
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted">Done</h2>
        {done.length === 0 ? (
          <p className="text-sm text-muted">No completed tasks yet.</p>
        ) : (
          done.map((task) => (
            <Card
              key={task.id}
              className="flex items-center gap-3 p-3 opacity-70"
            >
              <button
                type="button"
                className="size-5 rounded-full bg-secondary"
                aria-label="Reopen"
                onClick={() => void data.setTaskStatus(task.id, "open")}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold line-through text-ink">
                  {capitalizeLabel(task.title)}
                </p>
              </div>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}
