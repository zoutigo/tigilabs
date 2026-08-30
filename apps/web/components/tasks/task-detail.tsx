"use client";

import {
  CheckCircle2,
  MoreVertical,
  Pencil,
  RotateCcw,
  Send,
  Star,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type {
  Task,
  TaskPriority as TaskPriorityValue,
  TaskStatus as TaskStatusValue,
} from "@tigilabs/types";
import { useUsers } from "../../hooks/use-users";
import {
  addTaskProgress,
  completeTask,
  deleteTask,
  getTask,
  mockTasks,
  reopenTask,
  updateTask,
} from "../../lib/api/tasks";
import { Button } from "../ui/button";
import { FormMessage } from "../ui/form-message";
import { Input } from "../ui/input";
import { Modal } from "../ui/modal";
import { useToast } from "../ui/toast";
import { TaskPriority } from "./task-priority";
import { TaskStatus } from "./task-status";

type ProgressForm = {
  content: string;
};

type DetailTab = "avancement" | "details" | "historique";

type EditTaskForm = {
  title: string;
  description?: string;
  startDate?: string;
  dueDate?: string;
  priority: TaskPriorityValue;
  status: TaskStatusValue;
  assignedToId?: string;
};

export function TaskDetail({ id }: Readonly<{ id: string }>) {
  const router = useRouter();
  const { toast } = useToast();
  const { users } = useUsers();
  const [task, setTask] = useState<Task | null>(
    mockTasks.find((item) => item.id === id) ?? null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DetailTab>("details");
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<ProgressForm>({
    defaultValues: { content: "" },
    mode: "onChange",
  });
  const editForm = useForm<EditTaskForm>({
    defaultValues: {
      assignedToId: "",
      description: "",
      priority: "MEDIUM",
      status: "TODO",
      title: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    getTask(id)
      .then((fetched) => {
        if (!cancelled) {
          setTask(fetched);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTask(mockTasks.find((item) => item.id === id) ?? null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!task) {
    if (isLoading) {
      return (
        <section className="empty-state">
          <p>Chargement de la tache...</p>
        </section>
      );
    }

    notFound();
  }

  const responsible = task.assignedTo ?? task.assignee;
  const activeUsers = users.filter((user) => user.status === "ACTIVE");

  function openEdit() {
    if (!task) {
      return;
    }

    setEditError(null);
    editForm.reset({
      assignedToId: task.assignedToId ?? "",
      description: task.description ?? "",
      dueDate: toDateInput(task.dueDate),
      priority: task.priority,
      startDate: toDateInput(task.startDate),
      status: task.status,
      title: task.title,
    });
    setIsEditing(true);
  }

  async function onSubmitEdit(values: EditTaskForm) {
    if (!task) {
      return;
    }

    setEditError(null);
    const payload = {
      ...values,
      assignedToId: values.assignedToId || null,
      dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null,
      startDate: values.startDate
        ? new Date(values.startDate).toISOString()
        : undefined,
    };

    try {
      const updated = await updateTask(task.id, payload);
      setTask(updated);
      setIsEditing(false);
      toast({ title: "Tache mise a jour.", variant: "success" });
    } catch {
      setEditError(
        "La mise a jour n'a pas pu etre enregistree. Verifiez votre connexion et reessayez.",
      );
    }
  }

  async function handleDelete() {
    if (!task) {
      return;
    }

    setDeleteError(null);
    setIsDeleting(true);

    try {
      await deleteTask(task.id);
      toast({ title: "Tache supprimee.", variant: "success" });
      router.push("/tasks");
    } catch {
      setIsDeleting(false);
      setDeleteError(
        "La suppression a echoue. Verifiez votre connexion et reessayez.",
      );
    }
  }

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
    <div className="task-detail-layout" data-active-tab={activeTab}>
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
              {isEditing ? (
                <Button
                  onClick={() => setIsEditing(false)}
                  type="button"
                  variant="secondary"
                >
                  <X size={17} />
                  Annuler
                </Button>
              ) : (
                <Button onClick={openEdit} type="button" variant="secondary">
                  <Pencil size={17} />
                  Modifier
                </Button>
              )}
              <Button
                onClick={() => {
                  setDeleteError(null);
                  setIsDeleteConfirmOpen(true);
                }}
                type="button"
                variant="danger"
              >
                <Trash2 size={17} />
                Supprimer
              </Button>
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
            <button
              aria-selected={activeTab === "details"}
              onClick={() => setActiveTab("details")}
              role="tab"
              type="button"
            >
              Details
            </button>
            <button
              aria-selected={activeTab === "avancement"}
              onClick={() => setActiveTab("avancement")}
              role="tab"
              type="button"
            >
              Avancement
            </button>
            <button
              aria-selected={activeTab === "historique"}
              onClick={() => setActiveTab("historique")}
              role="tab"
              type="button"
            >
              Historique
            </button>
          </div>
        </div>

        <div className={`task-detail-content${isEditing ? " is-editing" : ""}`}>
          <div className="task-panel task-panel-details">
            {isEditing ? (
              <section className="inline-form-panel">
                <h3>Modifier la tache</h3>
                {editError ? (
                  <FormMessage title="Echec de la mise a jour" variant="error">
                    {editError}
                  </FormMessage>
                ) : null}
                <form
                  className="form"
                  onSubmit={editForm.handleSubmit(onSubmitEdit)}
                >
                  <div className="two-columns">
                    <Input
                      error={editForm.formState.errors.title?.message}
                      label="Intitule"
                      {...editForm.register("title", {
                        required: "L'intitule est obligatoire.",
                      })}
                    />
                    <label className="field">
                      <span>Responsable</span>
                      <select {...editForm.register("assignedToId")}>
                        <option value="">Sans responsable</option>
                        {activeUsers.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label className="field">
                    <span>Details</span>
                    <textarea rows={4} {...editForm.register("description")} />
                  </label>
                  <div className="two-columns">
                    <Input
                      label="Date de debut"
                      type="date"
                      {...editForm.register("startDate")}
                    />
                    <Input
                      label="Date de fin prevue"
                      type="date"
                      {...editForm.register("dueDate")}
                    />
                  </div>
                  <div className="two-columns">
                    <label className="field">
                      <span>Priorite</span>
                      <select {...editForm.register("priority")}>
                        <option value="LOW">Basse</option>
                        <option value="MEDIUM">Normale</option>
                        <option value="HIGH">Haute</option>
                        <option value="URGENT">Urgente</option>
                      </select>
                    </label>
                    <label className="field">
                      <span>Statut</span>
                      <select {...editForm.register("status")}>
                        <option value="TODO">A faire</option>
                        <option value="IN_PROGRESS">En cours</option>
                        <option value="BLOCKED">Bloquee</option>
                        <option value="DONE">Terminee</option>
                      </select>
                    </label>
                  </div>
                  <Button
                    disabled={editForm.formState.isSubmitting}
                    type="submit"
                  >
                    Enregistrer
                  </Button>
                </form>
              </section>
            ) : (
              <>
                <div className="task-detail-meta">
                  <Info
                    label="Groupe"
                    value={task.group?.name ?? task.groupId}
                  />
                  <Info
                    label="Responsable"
                    value={responsible?.name ?? "Non affecte"}
                  />
                  <div>
                    <span>Priorite</span>
                    <TaskPriority priority={task.priority} />
                  </div>
                  <Info
                    label="Date de debut"
                    value={formatDate(task.startDate)}
                  />
                  <Info
                    label="Date de fin prevue"
                    value={formatDate(task.dueDate)}
                  />
                  <Info
                    label="Date de fin reelle"
                    value={formatDate(task.completedAt)}
                  />
                </div>

                <section className="task-description-panel">
                  <h3>Description</h3>
                  <p>{task.description ?? "Aucune description renseignee."}</p>
                </section>
              </>
            )}
          </div>

          <section className="timeline-section task-panel task-panel-avancement">
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

      <aside className="task-history-panel task-panel task-panel-historique">
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

      <Modal
        onClose={() => setIsDeleteConfirmOpen(false)}
        open={isDeleteConfirmOpen}
        title="Supprimer la tache"
      >
        {deleteError ? (
          <FormMessage title="Echec de la suppression" variant="error">
            {deleteError}
          </FormMessage>
        ) : (
          <FormMessage title="Cette action est definitive." variant="info">
            La tache « {task.title} » sera supprimee et ne pourra pas etre
            recuperee.
          </FormMessage>
        )}
        <div className="task-detail-actions">
          <Button
            onClick={() => setIsDeleteConfirmOpen(false)}
            type="button"
            variant="secondary"
          >
            Annuler
          </Button>
          <Button
            disabled={isDeleting}
            onClick={handleDelete}
            type="button"
            variant="danger"
          >
            <Trash2 size={17} />
            Confirmer la suppression
          </Button>
        </div>
      </Modal>
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

function toDateInput(value?: string | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
  });
}
