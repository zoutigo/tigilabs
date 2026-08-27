"use client";

import {
  CheckCircle2,
  MoreVertical,
  RotateCcw,
  Send,
  Star,
} from "lucide-react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { Task } from "@tigilabs/types";
import {
  addTaskProgress,
  completeTask,
  getTask,
  mockTasks,
  reopenTask,
} from "../../lib/api/tasks";
import { Button } from "../ui/button";
import { TaskPriority } from "./task-priority";
import { TaskStatus } from "./task-status";

type ProgressForm = {
  content: string;
};

export function TaskDetail({ id }: Readonly<{ id: string }>) {
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(
    mockTasks.find((item) => item.id === id) ?? null,
  );
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<ProgressForm>({
    defaultValues: { content: "" },
    mode: "onChange",
  });

  useEffect(() => {
    getTask(id)
      .then(setTask)
      .catch(() => setTask(mockTasks.find((item) => item.id === id) ?? null));
  }, [id]);

  if (!task) {
    notFound();
  }

  const responsible = task.assignedTo ?? task.assignee;

  async function handleComplete() {
    if (!task) {
      return;
    }

    setTask({ ...task, completedAt: new Date().toISOString(), status: "DONE" });
    try {
      setTask(await completeTask(task.id));
    } catch {
      router.refresh();
    }
  }

  async function handleReopen() {
    if (!task) {
      return;
    }

    setTask({ ...task, completedAt: null, status: "TODO" });
    try {
      setTask(await reopenTask(task.id));
    } catch {
      router.refresh();
    }
  }

  async function onAddProgress(values: ProgressForm) {
    if (!task) {
      return;
    }

    const optimistic = {
      author: task.createdBy,
      authorId: task.createdById ?? "user-admin",
      content: values.content,
      createdAt: new Date().toISOString(),
      id: `progress-${Date.now()}`,
      taskId: task.id,
    };
    setTask({ ...task, progress: [...(task.progress ?? []), optimistic] });
    reset();

    try {
      const created = await addTaskProgress(task.id, values.content);
      setTask((current) =>
        current
          ? {
              ...current,
              progress: (current.progress ?? []).map((item) =>
                item.id === optimistic.id ? created : item,
              ),
            }
          : current,
      );
    } catch {
      // Fallback local volontaire.
    }
  }

  return (
    <div className="task-detail-layout">
      <article className="task-detail-main">
        <div className="task-module-header">
          <div className="breadcrumbs">
            <Link href="/tasks">Groupes</Link>
            <span>/</span>
            <span>{task.group?.name ?? task.groupId}</span>
            <span>/</span>
            <span>{task.title}</span>
          </div>
          <div className="task-group-header">
            <div>
              <h2>{task.title}</h2>
              <div className="task-title-meta">
                <TaskStatus status={task.status} />
                <button
                  aria-label="Mettre en favori"
                  className="icon-button"
                  type="button"
                >
                  <Star size={16} />
                </button>
              </div>
            </div>
            <div className="task-header-actions">
              <button
                aria-label="Options de la tache"
                className="icon-button"
                type="button"
              >
                <MoreVertical size={18} />
              </button>
            </div>
          </div>
          <div className="task-tabs" role="tablist">
            <button aria-selected="true" role="tab" type="button">
              Details
            </button>
            <button aria-selected="false" role="tab" type="button">
              Avancement
            </button>
            <button aria-selected="false" role="tab" type="button">
              Historique
            </button>
          </div>
        </div>

        <div className="task-detail-content">
          <div className="task-detail-meta">
            <Info label="Groupe" value={task.group?.name ?? task.groupId} />
            <Info
              label="Responsable"
              value={responsible?.name ?? "Non affecte"}
            />
            <div>
              <span>Priorite</span>
              <TaskPriority priority={task.priority} />
            </div>
            <Info label="Date de debut" value={formatDate(task.startDate)} />
            <Info label="Date de fin prevue" value={formatDate(task.dueDate)} />
            <Info
              label="Date de fin reelle"
              value={formatDate(task.completedAt)}
            />
          </div>

          <section className="task-description-panel">
            <h3>Description</h3>
            <p>{task.description ?? "Aucune description renseignee."}</p>
          </section>

          <section className="timeline-section">
            <h3>Avancement</h3>
            <Timeline
              empty="Aucune information d'avancement."
              items={(task.progress ?? []).map((item) => ({
                author: item.author?.name ?? "Utilisateur",
                content: item.content,
                date: item.createdAt,
                id: item.id,
              }))}
            />
            <form
              className="progress-form"
              onSubmit={handleSubmit(onAddProgress)}
            >
              <textarea
                aria-invalid={errors.content ? "true" : undefined}
                placeholder="Ajouter une information..."
                rows={2}
                {...register("content", {
                  required: "Le contenu est obligatoire.",
                  minLength: {
                    message: "Ajoutez au moins 2 caracteres.",
                    value: 2,
                  },
                })}
              />
              <Button
                aria-label="Ajouter une information"
                disabled={isSubmitting}
                type="submit"
              >
                <Send size={17} />
              </Button>
              {errors.content ? (
                <span className="field-error">{errors.content.message}</span>
              ) : null}
            </form>
          </section>

          <div className="task-detail-actions">
            {task.status === "DONE" ? (
              <Button onClick={handleReopen} type="button" variant="secondary">
                <RotateCcw size={17} />
                Rouvrir
              </Button>
            ) : (
              <Button onClick={handleComplete} type="button">
                <CheckCircle2 size={17} />
                Terminer
              </Button>
            )}
          </div>
        </div>
      </article>

      <aside className="task-history-panel">
        <h3>Historique</h3>
        <Timeline
          empty="Aucun changement enregistre."
          items={(task.history ?? []).map((item) => ({
            author: item.user?.name ?? "Utilisateur",
            content: historyLabel(item),
            date: item.createdAt,
            id: item.id,
          }))}
        />
      </aside>
    </div>
  );
}

function Info({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Timeline({
  empty,
  items,
}: Readonly<{
  empty: string;
  items: Array<{ author: string; content: string; date: string; id: string }>;
}>) {
  if (!items.length) {
    return <p className="muted">{empty}</p>;
  }

  return (
    <ol className="timeline">
      {items.map((item) => (
        <li key={item.id}>
          <time>{formatDateTime(item.date)}</time>
          <strong>{item.author}</strong>
          <p>{item.content}</p>
        </li>
      ))}
    </ol>
  );
}

function historyLabel(item: NonNullable<Task["history"]>[number]) {
  const labels: Record<string, string> = {
    ASSIGNEE_CHANGED: "Responsable modifie",
    DUE_DATE_CHANGED: "Date de fin modifiee",
    PRIORITY_CHANGED: "Priorite modifiee",
    PROGRESS_ADDED: "Information d'avancement ajoutee",
    START_DATE_CHANGED: "Date de debut modifiee",
    STATUS_CHANGED: "Statut modifie",
    TASK_COMPLETED: "Tache terminee",
    TASK_CREATED: "Tache creee",
    TASK_REOPENED: "Tache rouverte",
    TITLE_CHANGED: "Intitule modifie",
  };

  return `${labels[item.action] ?? item.action}${
    item.newValue ? ` : ${item.newValue}` : ""
  }`;
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString("fr-FR") : "-";
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
  });
}
