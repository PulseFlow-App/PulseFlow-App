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
import type { TaskPriority } from "@/lib/design-tokens";
import { useI18n } from "@/lib/i18n/provider";
import { useLocalizedDemoText } from "@/lib/demo/use-localized-demo-text";
import type { MessageKey } from "@/lib/i18n";

type Filter = "all" | "mine" | "urgent";

export default function TasksPage() {
  const data = useData();
  const { t } = useI18n();
  const label = useLocalizedDemoText();
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
          <h1 className="font-display text-2xl font-bold text-ink">{t("tasks.title")}</h1>
          <p className="text-sm text-muted">{t("tasks.openCount", { count: open.length })}</p>
        </div>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="size-4" /> {t("tasks.add")}
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
            {t(`tasks.filter.${f}` as MessageKey)}
          </button>
        ))}
      </div>

      {showForm ? (
        <Card className="space-y-3 p-4">
          <div>
            <Label>{t("tasks.titleField")}</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label>{t("tasks.villa")}</Label>
            <Select value={villaId} onChange={(e) => setVillaId(e.target.value)}>
              <option value="">{t("common.general")}</option>
              {data.villas.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t("tasks.priority")}</Label>
              <Select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
              >
                <option value="normal">{t("tasks.priority.normal")}</option>
                <option value="urgent">{t("tasks.priority.urgent")}</option>
              </Select>
            </div>
            <div>
              <Label>{t("tasks.day")}</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t("common.from")}</Label>
              <Input
                type="time"
                value={timeStart}
                onChange={(e) => setTimeStart(e.target.value)}
              />
            </div>
            <div>
              <Label>{t("common.until")}</Label>
              <Input
                type="time"
                value={timeEnd}
                onChange={(e) => setTimeEnd(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label>{t("tasks.assignee")}</Label>
            <Select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
            >
              <option value="">{t("tasks.unassigned")}</option>
              {data.profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </Select>
          </div>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button className="w-full" onClick={() => void create()}>
            {t("tasks.create")}
          </Button>
        </Card>
      ) : null}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted">{t("tasks.open")}</h2>
        {open.length === 0 ? (
          <EmptyState title={t("tasks.noOpen")} description={t("tasks.noOpenHint")} />
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
                  {label(task.title)}
                </p>
                <p className="truncate text-xs text-muted">
                  {task.villa?.name ?? t("common.general")}
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
                  {t("tasks.urgent")}
                </span>
              ) : null}
            </Card>
          ))
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted">{t("tasks.done")}</h2>
        {done.length === 0 ? (
          <p className="text-sm text-muted">{t("tasks.noDone")}</p>
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
                  {label(task.title)}
                </p>
              </div>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}
