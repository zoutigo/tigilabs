"use client";

import {
  AlignLeft,
  Archive,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Columns3,
  FolderKanban,
  ListFilter,
  MoreVertical,
  Plus,
  Search,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type {
  Task,
  TaskGroup,
  TaskPriority,
  TaskStatus,
  User,
} from "@tigilabs/types";
import { useTaskGroups } from "../../hooks/use-tasks";
import { useUsers } from "../../hooks/use-users";
import {
  archiveTaskGroup,
  completeTask,
  createTask,
  createTaskGroup,
  getTaskGroup,
  updateTaskGroup,
} from "../../lib/api/tasks";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Modal } from "../ui/modal";
import { useToast } from "../ui/toast";
import { TaskPriority as TaskPriorityBadge } from "./task-priority";
import { TaskStatus as TaskStatusBadge } from "./task-status";

type GroupFormValues = {
  name: string;
  description?: string;
};

type TaskFormValues = {
  groupId: string;
  title: string;
  description?: string;
  startDate?: string;
  dueDate?: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedToId?: string;
};

const priorityRank: Record<TaskPriority, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  URGENT: 4,
};

const statusLabels: Record<TaskStatus, string> = {
  TODO: "A faire",
  IN_PROGRESS: "En cours",
  BLOCKED: "Bloquees",
  DONE: "Terminees",
};

export function TaskWorkspace() {
  const { groups: loadedGroups } = useTaskGroups();
  const { users } = useUsers();
  const { toast } = useToast();
  const [groups, setGroups] = useState<TaskGroup[]>(loadedGroups);
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(
    undefined,
  );
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | TaskStatus>("ALL");
  const [quickFilter, setQuickFilter] = useState("all");
  const [responsible, setResponsible] = useState("all");
  const [sortBy, setSortBy] = useState("dueDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [openMenuGroupId, setOpenMenuGroupId] = useState<string | null>(null);
  const [renameGroup, setRenameGroup] = useState<TaskGroup | null>(null);
  const [isGroupFormOpen, setIsGroupFormOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  useEffect(() => {
    setGroups(loadedGroups);
    setSelectedGroupId((current) =>
      loadedGroups.some((group) => group.id === current)
        ? current
        : loadedGroups[0]?.id,
    );
  }, [loadedGroups]);

  useEffect(() => {
    if (!selectedGroupId) {
      return;
    }

    let cancelled = false;

    getTaskGroup(selectedGroupId)
      .then((detail) => {
        if (cancelled) {
          return;
        }

        setGroups((current) =>
          current.map((group) =>
            group.id === detail.id ? { ...group, ...detail } : group,
          ),
        );
      })
      .catch(() => {
        // Le resume charge via la liste des groupes reste affiche.
      });

    return () => {
      cancelled = true;
    };
  }, [selectedGroupId]);

  const activeUsers = users.filter((user) => user.status === "ACTIVE");
  const selectedGroup =
    groups.find((group) => group.id === selectedGroupId) ?? groups[0];
  const allTasks = selectedGroup?.tasks ?? [];
  const filteredTasks = useMemo(
    () =>
      allTasks
        .filter((task) => {
          const text = `${task.title} ${task.description ?? ""} ${
            task.assignedTo?.name ?? task.assignee?.name ?? ""
          }`.toLowerCase();
          const matchesSearch = text.includes(search.trim().toLowerCase());
          const matchesStatus = status === "ALL" || task.status === status;
          const matchesResponsible =
            responsible === "all" ||
            (responsible === "none" && !task.assignedToId) ||
            task.assignedToId === responsible;
          const matchesQuick =
            quickFilter === "all" ||
            (quickFilter === "mine" && task.assignedToId === "user-admin") ||
            (quickFilter === "unassigned" && !task.assignedToId) ||
            (quickFilter === "overdue" && task.isOverdue) ||
            (quickFilter === "urgent" && task.priority === "URGENT");

          return (
            matchesSearch && matchesStatus && matchesResponsible && matchesQuick
          );
        })
        .sort((a, b) => compareTasks(a, b, sortBy, sortOrder)),
    [allTasks, quickFilter, responsible, search, sortBy, sortOrder, status],
  );
  const completionLabel = selectedGroup
    ? `${selectedGroup.completedTasks} / ${selectedGroup.totalTasks} taches terminees`
    : "0 / 0 tache terminee";

  const groupForm = useForm<GroupFormValues>({
    defaultValues: { description: "", name: "" },
    mode: "onChange",
  });
  const renameForm = useForm<GroupFormValues>({
    defaultValues: { description: "", name: "" },
    mode: "onChange",
  });
  const taskForm = useForm<TaskFormValues>({
    defaultValues: {
      assignedToId: "",
      description: "",
      dueDate: "",
      groupId: selectedGroupId ?? "",
      priority: "MEDIUM",
      startDate: toDateInput(new Date().toISOString()),
      status: "TODO",
      title: "",
    },
    mode: "onChange",
  });

  async function handleCreateGroup(values: GroupFormValues) {
    const optimistic = buildLocalGroup(values);
    setGroups((current) => [optimistic, ...current]);
    setSelectedGroupId(optimistic.id);
    groupForm.reset();
    setIsGroupFormOpen(false);

    try {
      const created = await createTaskGroup(values);
      setGroups((current) =>
        current.map((group) => (group.id === optimistic.id ? created : group)),
      );
      setSelectedGroupId(created.id);
      toast({ title: "Groupe cree.", variant: "success" });
    } catch {
      // The local fallback keeps the interface usable without a running API.
      toast({
        description:
          "Le groupe reste visible localement, la synchronisation reessaiera automatiquement.",
        title: "Impossible de synchroniser le groupe.",
        variant: "error",
      });
    }
  }

  function openTaskModal() {
    taskForm.reset({
      assignedToId: "",
      description: "",
      dueDate: "",
      groupId: selectedGroupId ?? groups[0]?.id ?? "",
      priority: "MEDIUM",
      startDate: toDateInput(new Date().toISOString()),
      status: "TODO",
      title: "",
    });
    setIsTaskModalOpen(true);
  }

  async function handleCreateTask(values: TaskFormValues) {
    const targetGroup = groups.find((group) => group.id === values.groupId);
    if (!targetGroup) {
      return;
    }

    const payload = {
      ...values,
      assignedToId: values.assignedToId || null,
      dueDate: values.dueDate
        ? new Date(values.dueDate).toISOString()
        : undefined,
      groupId: targetGroup.id,
      startDate: values.startDate
        ? new Date(values.startDate).toISOString()
        : undefined,
    };
    const optimistic = buildLocalTask(payload, activeUsers);
    patchGroupTasks(targetGroup.id, (tasks) => [optimistic, ...tasks]);
    setSelectedGroupId(targetGroup.id);
    taskForm.reset({
      assignedToId: "",
      description: "",
      dueDate: "",
      groupId: targetGroup.id,
      priority: "MEDIUM",
      startDate: toDateInput(new Date().toISOString()),
      status: "TODO",
      title: "",
    });
    setIsTaskModalOpen(false);

    try {
      const created = await createTask(payload);
      patchGroupTasks(targetGroup.id, (tasks) =>
        tasks.map((task) => (task.id === optimistic.id ? created : task)),
      );
      toast({ title: "Tache creee.", variant: "success" });
    } catch {
      // Fallback local volontaire.
      toast({
        description:
          "La tache reste visible localement, la synchronisation reessaiera automatiquement.",
        title: "Impossible de synchroniser la tache.",
        variant: "error",
      });
    }
  }

  async function handleArchiveGroup(groupId: string) {
    setGroups((current) =>
      current.map((group) =>
        group.id === groupId
          ? {
              ...group,
              archivedAt: new Date().toISOString(),
              status: "ARCHIVED",
            }
          : group,
      ),
    );

    try {
      await archiveTaskGroup(groupId);
    } catch {
      // Fallback local volontaire.
    }
  }

  function openRenameGroup(group: TaskGroup) {
    setOpenMenuGroupId(null);
    renameForm.reset({
      description: group.description ?? "",
      name: group.name,
    });
    setRenameGroup(group);
  }

  async function handleRenameGroup(values: GroupFormValues) {
    if (!renameGroup) {
      return;
    }

    const groupId = renameGroup.id;
    setGroups((current) =>
      current.map((group) =>
        group.id === groupId ? { ...group, ...values } : group,
      ),
    );
    setRenameGroup(null);

    try {
      const updated = await updateTaskGroup(groupId, values);
      setGroups((current) =>
        current.map((group) => (group.id === groupId ? updated : group)),
      );
    } catch {
      // Fallback local volontaire.
    }
  }

  async function handleCompleteTask(task: Task) {
    patchGroupTasks(task.groupId, (tasks) =>
      tasks.map((item) =>
        item.id === task.id
          ? {
              ...item,
              completedAt: new Date().toISOString(),
              isOverdue: false,
              status: "DONE",
            }
          : item,
      ),
    );

    try {
      await completeTask(task.id);
    } catch {
      // Fallback local volontaire.
    }
  }

  function patchGroupTasks(groupId: string, update: (tasks: Task[]) => Task[]) {
    setGroups((current) =>
      current.map((group) =>
        group.id === groupId
          ? recalculateGroup(group, update(group.tasks))
          : group,
      ),
    );
  }

  return (
    <div className="tasks-workspace">
      {openMenuGroupId ? (
        <button
          aria-hidden="true"
          className="dropdown-backdrop"
          onClick={() => setOpenMenuGroupId(null)}
          tabIndex={-1}
          type="button"
        />
      ) : null}
      <div className="tasks-layout">
        <aside className="task-groups-panel">
          <div className="panel-heading">
            <h3>Groupes</h3>
            <span className="badge badge-neutral">{groups.length}</span>
          </div>
          <div className="task-group-list">
            {groups.map((group) => (
              <div
                className={`task-group-button ${
                  group.id === selectedGroupId ? "is-active" : ""
                }`}
                key={group.id}
              >
                <button
                  className="task-group-select"
                  onClick={() => setSelectedGroupId(group.id)}
                  type="button"
                >
                  <strong>{group.name}</strong>
                  <span>
                    {group.completedTasks}/{group.totalTasks} terminees
                  </span>
                  <span className="progress-track">
                    <span style={{ width: `${group.progress}%` }} />
                  </span>
                </button>
                <div className="task-group-menu">
                  <button
                    aria-label={`Options du groupe ${group.name}`}
                    className="icon-button"
                    onClick={() =>
                      setOpenMenuGroupId((current) =>
                        current === group.id ? null : group.id,
                      )
                    }
                    type="button"
                  >
                    <MoreVertical size={15} />
                  </button>
                  {openMenuGroupId === group.id ? (
                    <div className="dropdown-menu" role="menu">
                      <button
                        onClick={() => openRenameGroup(group)}
                        role="menuitem"
                        type="button"
                      >
                        Renommer
                      </button>
                      {group.status !== "ARCHIVED" ? (
                        <button
                          onClick={() => {
                            setOpenMenuGroupId(null);
                            handleArchiveGroup(group.id);
                          }}
                          role="menuitem"
                          type="button"
                        >
                          Archiver
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          {isGroupFormOpen ? (
            <div className="inline-form-panel">
              <div className="toolbar">
                <h3>Creer un groupe</h3>
                <Button
                  aria-label="Fermer"
                  onClick={() => setIsGroupFormOpen(false)}
                  type="button"
                  variant="ghost"
                >
                  <X size={18} />
                </Button>
              </div>
              <form
                className="form"
                onSubmit={groupForm.handleSubmit(handleCreateGroup)}
              >
                <Input
                  error={groupForm.formState.errors.name?.message}
                  label="Nom du groupe"
                  placeholder="Immatriculation Tigilabs"
                  {...groupForm.register("name", {
                    required: "Le nom est obligatoire.",
                  })}
                />
                <section className="task-description-panel">
                  <h3>
                    <AlignLeft size={16} />
                    Description
                  </h3>
                  <textarea
                    className="description-control"
                    placeholder="Contexte du groupe"
                    rows={3}
                    {...groupForm.register("description")}
                  />
                </section>
                <Button type="submit">
                  <Plus size={17} />
                  Creer
                </Button>
              </form>
            </div>
          ) : (
            <Button
              onClick={() => {
                groupForm.reset({ description: "", name: "" });
                setIsGroupFormOpen(true);
              }}
              type="button"
            >
              <Plus size={17} />
              Creer un groupe
            </Button>
          )}
        </aside>

        <main className="task-main-panel">
          {selectedGroup ? (
            <>
              <div className="task-module-header">
                <div className="breadcrumbs">
                  <Link href="/tasks">Groupes</Link>
                  <span>/</span>
                  <span>{selectedGroup.name}</span>
                </div>
                <div className="task-group-header">
                  <div>
                    <span className="badge badge-success">Actif</span>
                    <h2>{selectedGroup.name}</h2>
                  </div>
                  <div className="task-header-actions">
                    <Button onClick={openTaskModal} type="button">
                      <Plus size={17} />
                      Nouvelle tache
                    </Button>
                    <Button
                      aria-label="Options du groupe"
                      type="button"
                      variant="ghost"
                    >
                      <MoreVertical size={18} />
                    </Button>
                  </div>
                </div>
                <div className="task-tabs" role="tablist">
                  <button aria-selected="true" role="tab" type="button">
                    Taches
                  </button>
                  <button aria-selected="false" role="tab" type="button">
                    Informations
                  </button>
                  <button aria-selected="false" role="tab" type="button">
                    Historique
                  </button>
                </div>
                <div className="task-module-progress">
                  <p className="muted">{selectedGroup.description}</p>
                  <div>
                    <span>Progression</span>
                    <strong>{selectedGroup.progress}%</strong>
                  </div>
                  <span className="progress-track">
                    <span style={{ width: `${selectedGroup.progress}%` }} />
                  </span>
                  <small>{completionLabel}</small>
                </div>
              </div>

              <div className="task-filter-panel">
                <label className="task-search">
                  <Search size={18} />
                  <input
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Rechercher titre, description, responsable"
                    value={search}
                  />
                </label>
                <select
                  onChange={(event) =>
                    setStatus(event.target.value as "ALL" | TaskStatus)
                  }
                  aria-label="Filtrer par statut"
                  value={status}
                >
                  <option value="ALL">Tous les statuts</option>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Filtre rapide"
                  onChange={(event) => setQuickFilter(event.target.value)}
                  value={quickFilter}
                >
                  <option value="all">Tous</option>
                  <option value="mine">Mes taches</option>
                  <option value="unassigned">Sans responsable</option>
                  <option value="overdue">En retard</option>
                  <option value="urgent">Urgentes</option>
                </select>
                <select
                  aria-label="Filtrer par responsable"
                  onChange={(event) => setResponsible(event.target.value)}
                  value={responsible}
                >
                  <option value="all">Tous responsables</option>
                  <option value="none">Sans responsable</option>
                  {activeUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Trier par"
                  onChange={(event) => setSortBy(event.target.value)}
                  value={sortBy}
                >
                  <option value="priority">Priorite</option>
                  <option value="startDate">Date de debut</option>
                  <option value="dueDate">Echeance</option>
                  <option value="responsible">Responsable</option>
                  <option value="status">Statut</option>
                  <option value="createdAt">Creation</option>
                </select>
                <button
                  className="tl-button tl-button-secondary"
                  onClick={() =>
                    setSortOrder((current) =>
                      current === "asc" ? "desc" : "asc",
                    )
                  }
                  type="button"
                >
                  <ListFilter size={17} />
                  {sortOrder === "asc" ? "Croissant" : "Decroissant"}
                </button>
                <button
                  aria-label="Archiver le groupe"
                  className="tl-button tl-button-secondary"
                  onClick={() => handleArchiveGroup(selectedGroup.id)}
                  type="button"
                >
                  <Archive size={17} />
                </button>
              </div>

              <div className="task-table-wrap">
                <table className="task-table">
                  <thead>
                    <tr>
                      <th>Tache</th>
                      <th>Responsable</th>
                      <th>Priorite</th>
                      <th>Debut</th>
                      <th>Echeance</th>
                      <th>Statut</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map((task) => (
                      <TaskRow
                        key={task.id}
                        onComplete={handleCompleteTask}
                        task={task}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <section className="empty-state">
              <CircleAlert size={22} />
              <p>Aucun groupe actif pour le moment.</p>
              <p className="muted">
                Les taches sont rangees dans des groupes : creez un premier
                groupe pour commencer a ajouter des taches.
              </p>
              <Button
                onClick={() => {
                  groupForm.reset({ description: "", name: "" });
                  setIsGroupFormOpen(true);
                }}
                type="button"
              >
                <Plus size={17} />
                Creer un groupe
              </Button>
            </section>
          )}
        </main>
      </div>

      <Modal
        onClose={() => setIsTaskModalOpen(false)}
        open={isTaskModalOpen}
        title="Nouvelle tache"
      >
        <form
          className="form"
          onSubmit={taskForm.handleSubmit(handleCreateTask)}
        >
          <div className="meta-card">
            <div className="meta-head">
              <span className="meta-icon">
                <FolderKanban size={16} />
              </span>
              <span className="meta-label">Groupe</span>
            </div>
            <select
              className="meta-field-control"
              {...taskForm.register("groupId", {
                required: "Le groupe est obligatoire.",
              })}
            >
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
          <Input
            error={taskForm.formState.errors.title?.message}
            label="Intitule"
            placeholder="Deposer le dossier"
            {...taskForm.register("title", {
              required: "L'intitule est obligatoire.",
            })}
          />
          <section className="task-description-panel">
            <h3>
              <AlignLeft size={16} />
              Details
            </h3>
            <textarea
              className="description-control"
              placeholder="Contexte et resultat attendu"
              rows={4}
              {...taskForm.register("description")}
            />
          </section>
          <div className="task-detail-meta">
            <div className="meta-card">
              <div className="meta-head">
                <span className="meta-icon">
                  <CalendarDays size={16} />
                </span>
                <span className="meta-label">Date de debut</span>
              </div>
              <input
                className="meta-field-control"
                type="date"
                {...taskForm.register("startDate")}
              />
            </div>
            <div className="meta-card">
              <div className="meta-head">
                <span className="meta-icon">
                  <CalendarClock size={16} />
                </span>
                <span className="meta-label">Date de fin prevue</span>
              </div>
              <input
                className="meta-field-control"
                type="date"
                {...taskForm.register("dueDate")}
              />
            </div>
            <div className="meta-card">
              <div className="meta-head">
                <span className="meta-icon">
                  <UserRound size={16} />
                </span>
                <span className="meta-label">Responsable</span>
              </div>
              <select
                className="meta-field-control"
                {...taskForm.register("assignedToId")}
              >
                <option value="">Sans responsable</option>
                {activeUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="meta-card">
              <div className="meta-head">
                <span className="meta-icon meta-icon-priority">
                  <Sparkles size={16} />
                </span>
                <span className="meta-label">Priorite</span>
              </div>
              <select
                className="meta-field-control"
                {...taskForm.register("priority")}
              >
                <option value="LOW">Basse</option>
                <option value="MEDIUM">Normale</option>
                <option value="HIGH">Haute</option>
                <option value="URGENT">Urgente</option>
              </select>
            </div>
          </div>
          <div className="meta-card">
            <div className="meta-head">
              <span className="meta-icon">
                <CheckCircle2 size={16} />
              </span>
              <span className="meta-label">Statut initial</span>
            </div>
            <select
              className="meta-field-control"
              {...taskForm.register("status")}
            >
              <option value="TODO">A faire</option>
              <option value="IN_PROGRESS">En cours</option>
              <option value="BLOCKED">Bloquee</option>
              <option value="DONE">Terminee</option>
            </select>
          </div>
          <Button disabled={!groups.length} type="submit">
            <Plus size={17} />
            Ajouter
          </Button>
        </form>
      </Modal>

      <Modal
        onClose={() => setRenameGroup(null)}
        open={Boolean(renameGroup)}
        title="Renommer le groupe"
      >
        <form
          className="form"
          onSubmit={renameForm.handleSubmit(handleRenameGroup)}
        >
          <Input
            error={renameForm.formState.errors.name?.message}
            label="Nom"
            {...renameForm.register("name", {
              required: "Le nom est obligatoire.",
            })}
          />
          <section className="task-description-panel">
            <h3>
              <AlignLeft size={16} />
              Description
            </h3>
            <textarea
              className="description-control"
              rows={3}
              {...renameForm.register("description")}
            />
          </section>
          <Button type="submit">Enregistrer</Button>
        </form>
      </Modal>
    </div>
  );
}

function TaskRow({
  onComplete,
  task,
}: Readonly<{ onComplete: (task: Task) => void; task: Task }>) {
  const responsibleUser = task.assignedTo ?? task.assignee;

  return (
    <tr>
      <td>
        <Link href={`/tasks/${task.id}`}>
          <strong>{task.title}</strong>
        </Link>
        {task.description ? (
          <span className="muted">{task.description}</span>
        ) : null}
      </td>
      <td data-label="Responsable">{responsibleUser?.name ?? "-"}</td>
      <td data-label="Priorite">
        <TaskPriorityBadge priority={task.priority} />
      </td>
      <td data-label="Debut">{formatDate(task.startDate)}</td>
      <td data-label="Echeance">
        <span className={task.isOverdue ? "text-danger" : ""}>
          {formatDate(task.dueDate)}
        </span>
      </td>
      <td data-label="Statut">
        <span className="status-stack">
          <TaskStatusBadge status={task.status} />
          {task.isOverdue ? (
            <span className="badge badge-danger">En retard</span>
          ) : null}
        </span>
      </td>
      <td data-label="Action">
        <div className="task-row-actions">
          {task.status !== "DONE" ? (
            <Button
              aria-label={`Marquer ${task.title} comme terminee`}
              onClick={() => onComplete(task)}
              type="button"
              variant="ghost"
            >
              <CheckCircle2 size={18} />
            </Button>
          ) : null}
          <Link
            aria-label={`Ouvrir ${task.title}`}
            className="icon-button"
            href={`/tasks/${task.id}`}
          >
            <Columns3 size={17} />
          </Link>
        </div>
      </td>
    </tr>
  );
}

function compareTasks(
  a: Task,
  b: Task,
  sortBy: string,
  sortOrder: "asc" | "desc",
) {
  const direction = sortOrder === "asc" ? 1 : -1;
  const first = sortValue(a, sortBy);
  const second = sortValue(b, sortBy);

  if (first < second) {
    return -1 * direction;
  }

  if (first > second) {
    return direction;
  }

  return 0;
}

function sortValue(task: Task, sortBy: string) {
  if (sortBy === "priority") {
    return priorityRank[task.priority];
  }

  if (sortBy === "responsible") {
    return task.assignedTo?.name ?? task.assignee?.name ?? "";
  }

  const value = task[sortBy as keyof Task];
  if (typeof value === "string") {
    return value;
  }

  return "";
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString("fr-FR") : "-";
}

function toDateInput(value?: string | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

function buildLocalGroup(values: GroupFormValues): TaskGroup {
  const now = new Date().toISOString();

  return {
    id: `group-${Date.now()}`,
    name: values.name,
    description: values.description,
    status: "ACTIVE",
    createdById: "user-admin",
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
    tasks: [],
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    progress: 0,
  };
}

function buildLocalTask(
  values: {
    assignedToId?: string | null;
    description?: string;
    dueDate?: string;
    groupId: string;
    priority?: TaskPriority;
    startDate?: string;
    status?: TaskStatus;
    title: string;
  },
  users: User[],
): Task {
  const assignedTo =
    users.find((user) => user.id === values.assignedToId) ?? null;
  const now = new Date().toISOString();

  return {
    id: `task-${Date.now()}`,
    groupId: values.groupId,
    title: values.title,
    description: values.description,
    status: values.status ?? "TODO",
    priority: values.priority ?? "MEDIUM",
    startDate: values.startDate ?? now,
    dueDate: values.dueDate ?? null,
    completedAt: values.status === "DONE" ? now : null,
    assignedToId: values.assignedToId,
    assignedTo,
    assignee: assignedTo,
    createdById: "user-admin",
    createdAt: now,
    updatedAt: now,
    isOverdue:
      Boolean(values.dueDate) &&
      new Date(values.dueDate as string).getTime() < Date.now() &&
      values.status !== "DONE",
    progress: [],
    history: [],
  };
}

function recalculateGroup(group: TaskGroup, tasks: Task[]): TaskGroup {
  const completedTasks = tasks.filter((task) => task.status === "DONE").length;

  return {
    ...group,
    completedTasks,
    overdueTasks: tasks.filter((task) => task.isOverdue).length,
    progress: tasks.length
      ? Math.round((completedTasks / tasks.length) * 100)
      : 0,
    tasks,
    totalTasks: tasks.length,
    updatedAt: new Date().toISOString(),
  };
}
