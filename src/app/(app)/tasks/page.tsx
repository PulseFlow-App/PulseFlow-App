"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { EmptyState, LoadingState } from "@/components/ui/empty-state";
import { useData } from "@/lib/data/use-app-data";
import { formatWorkWindow } from "@/lib/notifications";
import { isGuestApp, isStaffApp, taskAssignableProfiles } from "@/lib/roles";
import { formatShortDate, cn } from "@/lib/utils";
import type { TaskPriority } from "@/lib/design-tokens";
import { useI18n } from "@/lib/i18n/provider";
import { LocalizedText } from "@/components/i18n/localized-text";
import { TaskAssigneeMeta } from "@/components/tasks/task-assignee-meta";
import { TaskCompleteControl } from "@/components/tasks/task-complete-control";
import type { MessageKey } from "@/lib/i18n";

type Filter = "all" | "mine" | "urgent";

export default function TasksPage() {
  const data = useData();
  const { t } = useI18n();
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
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const assignees = useMemo(
    () => taskAssignableProfiles(data.profiles),
    [data.profiles],
  );

  useEffect(() => {
    if (data.profile && isStaffApp(data.profile.role)) {
      router.replace("/jobs");
    }
    if (data.profile && isGuestApp(data.profile.role)) {
      router.replace("/home");
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
  const pendingVerify = filtered.filter((t) => t.status === "pending_verify");
  const done = filtered.filter((t) => t.status === "done");
  const openCount = open.length + pendingVerify.length;

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
        notes: notes.trim() || null,
      });
      setTitle("");
      setVillaId("");
      setPriority("normal");
      setAssignee("");
      setDueDate("");
      setTimeStart("");
      setTimeEnd("");
      setNotes("");
      setShowForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create task.");
    }
  };

  const removeTask = async (id: string) => {
    if (!window.confirm(t("tasks.deleteConfirm"))) return;
    try {
      await data.deleteTask(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
    }
  };

  return (
    <div className="space-y-4 animate-rise">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="type-title">{t("tasks.title")}</h1>
          <p className="type-meta mt-1">{t("tasks.openCount", { count: openCount })}</p>
        </div>
        <Button
          size="xs"
          className="shrink-0"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? (
            t("common.cancel")
          ) : (
            <>
              <Plus className="size-3.5" strokeWidth={2.4} /> {t("tasks.add")}
            </>
          )}
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
              {assignees.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>
              {t("common.notes")}{" "}
              <span className="font-normal text-muted">
                ({t("common.optional")})
              </span>
            </Label>
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("tasks.notesPlaceholder")}
            />
          </div>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button className="w-full" onClick={() => void create()}>
            {t("tasks.create")}
          </Button>
        </Card>
      ) : null}

      {error && !showForm ? (
        <p className="text-sm text-danger">{error}</p>
      ) : null}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted">{t("tasks.open")}</h2>
        {open.length === 0 && pendingVerify.length === 0 ? (
          <EmptyState title={t("tasks.noOpen")} description={t("tasks.noOpenHint")} />
        ) : (
          <>
            {pendingVerify.map((task) => (
              <Card key={task.id} className="p-3">
                <TaskCompleteControl
                  task={task}
                  meta={
                    <>
                      <p className="truncate font-semibold text-ink">
                        <LocalizedText text={task.title} />
                      </p>
                      <TaskAssigneeMeta
                        task={task}
                        villaLabel={task.villa?.name ?? t("common.general")}
                        schedule={
                          formatWorkWindow(
                            task.due_date,
                            task.time_start,
                            task.time_end,
                          ) ??
                          (task.due_date
                            ? formatShortDate(task.due_date)
                            : null)
                        }
                      />
                    </>
                  }
                  trailing={
                    <button
                      type="button"
                      className="shrink-0 rounded-full p-2 text-muted transition hover:bg-danger/10 hover:text-danger"
                      aria-label={t("common.delete")}
                      onClick={() => void removeTask(task.id)}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  }
                />
              </Card>
            ))}
            {open.map((task) => (
              <Card key={task.id} className="p-3">
                <TaskCompleteControl
                  task={task}
                  meta={
                    <>
                      <p className="truncate font-semibold text-ink">
                        <LocalizedText text={task.title} />
                      </p>
                      <TaskAssigneeMeta
                        task={task}
                        villaLabel={task.villa?.name ?? t("common.general")}
                        schedule={
                          formatWorkWindow(
                            task.due_date,
                            task.time_start,
                            task.time_end,
                          ) ??
                          (task.due_date
                            ? formatShortDate(task.due_date)
                            : null)
                        }
                      />
                      {task.notes ? (
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted">
                          <LocalizedText text={task.notes} />
                        </p>
                      ) : null}
                    </>
                  }
                  trailing={
                    <>
                      {task.priority === "urgent" ? (
                        <span className="text-[10px] font-bold uppercase text-danger">
                          {t("tasks.urgent")}
                        </span>
                      ) : null}
                      <button
                        type="button"
                        className="shrink-0 rounded-full p-2 text-muted transition hover:bg-danger/10 hover:text-danger"
                        aria-label={t("common.delete")}
                        onClick={() => void removeTask(task.id)}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </>
                  }
                />
              </Card>
            ))}
          </>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted">{t("tasks.done")}</h2>
        {done.length === 0 ? (
          <p className="text-sm text-muted">{t("tasks.noDone")}</p>
        ) : (
          done.map((task) => (
            <Card key={task.id} className="p-3 opacity-70">
              <TaskCompleteControl
                task={task}
                meta={
                  <p className="truncate text-sm font-semibold line-through text-ink">
                    <LocalizedText text={task.title} />
                  </p>
                }
                trailing={
                  <button
                    type="button"
                    className="shrink-0 rounded-full p-2 text-muted transition hover:bg-danger/10 hover:text-danger"
                    aria-label={t("common.delete")}
                    onClick={() => void removeTask(task.id)}
                  >
                    <Trash2 className="size-4" />
                  </button>
                }
              />
            </Card>
          ))
        )}
      </section>
    </div>
  );
}
