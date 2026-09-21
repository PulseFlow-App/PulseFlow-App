"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { EmptyState, LoadingState } from "@/components/ui/empty-state";
import { useData } from "@/lib/data/use-app-data";
import { isGuestApp, isStaffApp, taskAssignableProfiles } from "@/lib/roles";
import { cn } from "@/lib/utils";
import type { TaskPriority } from "@/lib/design-tokens";
import { useI18n } from "@/lib/i18n/provider";
import { TaskRow } from "@/components/tasks/task-row";
import type { MessageKey } from "@/lib/i18n";

type Filter = "all" | "mine" | "urgent";

export default function TasksPage() {
  const data = useData();
  const { t } = useI18n();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
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
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
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

  const resetForm = () => {
    setTitle("");
    setVillaId("");
    setPriority("normal");
    setAssignee("");
    setDueDate("");
    setTimeStart("");
    setTimeEnd("");
    setNotes("");
    setPhotoUrl(null);
    setShowForm(false);
  };

  const onPickPhoto = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await data.uploadChatAttachment(file);
      if (!url) throw new Error(t("common.error"));
      setPhotoUrl(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setUploading(false);
    }
  };

  const create = async () => {
    setError(null);
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
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
        photo_url: photoUrl,
      });
      resetForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create task.");
    } finally {
      setSaving(false);
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

  const deleteTrailing = (taskId: string) => (
    <button
      type="button"
      className="shrink-0 rounded-full p-2 text-muted transition hover:bg-danger/10 hover:text-danger"
      aria-label={t("common.delete")}
      onClick={() => void removeTask(taskId)}
    >
      <Trash2 className="size-4" />
    </button>
  );

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
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("tasks.titlePlaceholder")}
            />
          </div>
          <div>
            <Label>{t("tasks.villa")}</Label>
            <Select
              value={villaId}
              onChange={(e) => setVillaId(e.target.value)}
            >
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
          <div>
            <Label>
              {t("tasks.examplePhoto")}{" "}
              <span className="font-normal text-muted">
                ({t("common.optional")})
              </span>
            </Label>
            <p className="mb-2 text-xs text-muted">{t("tasks.examplePhotoHint")}</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void onPickPhoto(e.target.files?.[0] ?? null)}
            />
            {photoUrl ? (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoUrl}
                  alt=""
                  className="size-16 rounded-xl object-cover"
                />
                <button
                  type="button"
                  className="text-xs font-semibold text-danger"
                  onClick={() => setPhotoUrl(null)}
                >
                  {t("common.remove")}
                </button>
              </div>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                <Camera className="size-4" />
                {uploading ? t("common.saving") : t("tasks.addPhoto")}
              </Button>
            )}
          </div>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button className="w-full" busy={saving} onClick={() => void create()}>
            {saving ? t("common.saving") : t("tasks.create")}
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
                <TaskRow task={task} trailing={deleteTrailing(task.id)} />
              </Card>
            ))}
            {open.map((task) => (
              <Card key={task.id} className="p-3">
                <TaskRow
                  task={task}
                  trailing={
                    <>
                      {task.priority === "urgent" ? (
                        <span className="text-[10px] font-bold uppercase text-danger">
                          {t("tasks.urgent")}
                        </span>
                      ) : null}
                      {deleteTrailing(task.id)}
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
            <Card key={task.id} className="p-3">
              <TaskRow
                task={task}
                doneStyle
                trailing={deleteTrailing(task.id)}
              />
            </Card>
          ))
        )}
      </section>
    </div>
  );
}
