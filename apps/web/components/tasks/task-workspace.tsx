"use client";

import {
  Archive,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  ListFilter,
  Plus,
  Search,
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
} from "../../lib/api/tasks";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { TaskPriority as TaskPriorityBadge } from "./task-priority";
import { TaskStatus as TaskStatusBadge } from "./task-status";

type GroupFormValues = {
  name: string;
  description?: string;
};

type TaskFormValues = {
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
  const [groups, setGroups] = useState<TaskGroup[]>(loadedGroups);
  const [selectedGroupId, setSelectedGroupId] = useState(loadedGroups[0]?.id);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | TaskStatus>("ALL");
  const [quickFilter, setQuickFilter] = useState("all");
  const [responsible, setResponsible] = useState("all");
  const [sortBy, setSortBy] = useState("dueDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    setGroups(loadedGroups);
    setSelectedGroupId((current) => current ?? loadedGroups[0]?.id);
  }, [loadedGroups]);

  const activeUsers = users.filter((user) => user.status === "ACTIVE");
  const selectedGroup = groups.find((group) => group.id === selectedGroupId);
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
  const overdueCount = allTasks.filter((task) => task.isOverdue).length;

  const groupForm = useForm<GroupFormValues>({
    defaultValues: { description: "", name: "" },
    mode: "onChange",
  });
  const taskForm = useForm<TaskFormValues>({
    defaultValues: {
      assignedToId: "",
      description: "",
      dueDate: "",
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

    try {
      const created = await createTaskGroup(values);
      setGroups((current) =>
        current.map((group) => (group.id === optimistic.id ? created : group)),
      );
      setSelectedGroupId(created.id);
    } catch {
      // The local fallback keeps the interface usable without a running API.
    }
  }

  async function handleCreateTask(values: TaskFormValues) {
    if (!selectedGroup) {
      return;
    }

    const payload = {
      ...values,
      assignedToId: values.assignedToId || null,
      dueDate: values.dueDate
        ? new Date(values.dueDate).toISOString()
        : undefined,
      groupId: selectedGroup.id,
      startDate: values.startDate
        ? new Date(values.startDate).toISOString()
        : undefined,
    };
    const optimistic = buildLocalTask(payload, activeUsers);
    patchGroupTasks(selectedGroup.id, (tasks) => [optimistic, ...tasks]);
    taskForm.reset({
      assignedToId: "",
      description: "",
      dueDate: "",
      priority: "MEDIUM",
      startDate: toDateInput(new Date().toISOString()),
      status: "TODO",
      title: "",
    });

    try {
      const created = await createTask(payload);
      patchGroupTasks(selectedGroup.id, (tasks) =>
        tasks.map((task) => (task.id === optimistic.id ? created : task)),
      );
    } catch {
      // Fallback local volontaire.
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
      <section className="task-kpis">
        <Metric label="Groupes actifs" value={groups.length} />
        <Metric label="Taches" value={allTasks.length} />
        <Metric label="Terminees" value={selectedGroup?.completedTasks ?? 0} />
        <Metric label="En retard" value={overdueCount} tone="danger" />
      </section>

      <div className="tasks-layout">
        <aside className="task-groups-panel">
          <div className="panel-heading">
            <h3>Groupes</h3>
            <span className="badge badge-neutral">{groups.length}</span>
          </div>
          <div className="task-group-list">
            {groups.map((group) => (
              <button
                className={`task-group-button ${
                  group.id === selectedGroupId ? "is-active" : ""
                }`}
                key={group.id}
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
            ))}
          </div>
          <form
            className="task-inline-form"
            onSubmit={groupForm.handleSubmit(handleCreateGroup)}
          >
            <Input
              error={groupForm.formState.errors.name?.message}
              label="Nouveau groupe"
              placeholder="Immatriculation Tigilabs"
              {...groupForm.register("name", {
                required: "Le nom est obligatoire.",
              })}
            />
            <label className="field">
              <span>Description</span>
              <textarea
                placeholder="Contexte du groupe"
                rows={3}
                {...groupForm.register("description")}
              />
            </label>
            <Button type="submit">
              <Plus size={17} />
              Creer
            </Button>
          </form>
        </aside>

        <main className="task-main-panel">
          {selectedGroup ? (
            <>
              <div className="task-group-header">
                <div>
                  <h2>{selectedGroup.name}</h2>
                  <p className="muted">{selectedGroup.description}</p>
                  <strong>
                    Progression : {selectedGroup.completedTasks} /{" "}
                    {selectedGroup.totalTasks} taches terminees -{" "}
                    {selectedGroup.progress} %
                  </strong>
                </div>
                <Button
                  onClick={() => handleArchiveGroup(selectedGroup.id)}
                  type="button"
                  variant="secondary"
                >
                  <Archive size={17} />
                  Archiver
                </Button>
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
                    {filteredTasks.map((task) => {
                      const responsibleUser = task.assignedTo ?? task.assignee;

                      return (
                        <tr key={task.id}>
                          <td>
                            <Link href={`/tasks/${task.id}`}>
                              <strong>{task.title}</strong>
                            </Link>
                            {task.description ? (
                              <span className="muted">{task.description}</span>
                            ) : null}
                          </td>
                          <td>{responsibleUser?.name ?? "-"}</td>
                          <td>
                            <TaskPriorityBadge priority={task.priority} />
                          </td>
                          <td>{formatDate(task.startDate)}</td>
                          <td>
                            <span
                              className={task.isOverdue ? "text-danger" : ""}
                            >
                              {formatDate(task.dueDate)}
                            </span>
                          </td>
                          <td>
                            <span className="status-stack">
                              <TaskStatusBadge status={task.status} />
                              {task.isOverdue ? (
                                <span className="badge badge-danger">
                                  En retard
                                </span>
                              ) : null}
                            </span>
                          </td>
                          <td>
                            {task.status !== "DONE" ? (
                              <Button
                                aria-label="Marquer comme terminee"
                                onClick={() => handleCompleteTask(task)}
                                type="button"
                                variant="ghost"
                              >
                                <CheckCircle2 size={18} />
                              </Button>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <section className="empty-state">
              <CircleAlert size={22} />
              <p>Aucun groupe actif pour le moment.</p>
            </section>
          )}
        </main>

        <aside className="task-create-panel">
          <h3>Nouvelle tache</h3>
          <form
            className="form"
            onSubmit={taskForm.handleSubmit(handleCreateTask)}
          >
            <Input
              error={taskForm.formState.errors.title?.message}
              label="Intitule"
              placeholder="Deposer le dossier"
              {...taskForm.register("title", {
                required: "L'intitule est obligatoire.",
              })}
            />
            <label className="field">
              <span>Details</span>
              <textarea
                placeholder="Contexte et resultat attendu"
                rows={4}
                {...taskForm.register("description")}
              />
            </label>
            <div className="two-columns">
              <Input
                label="Date de debut"
                type="date"
                {...taskForm.register("startDate")}
              />
              <Input
                label="Date de fin prevue"
                type="date"
                {...taskForm.register("dueDate")}
              />
            </div>
            <label className="field">
              <span>Responsable</span>
              <select {...taskForm.register("assignedToId")}>
                <option value="">Sans responsable</option>
                {activeUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="two-columns">
              <label className="field">
                <span>Priorite</span>
                <select {...taskForm.register("priority")}>
                  <option value="LOW">Basse</option>
                  <option value="MEDIUM">Normale</option>
                  <option value="HIGH">Haute</option>
                  <option value="URGENT">Urgente</option>
                </select>
              </label>
              <label className="field">
                <span>Statut</span>
                <select {...taskForm.register("status")}>
                  <option value="TODO">A faire</option>
                  <option value="IN_PROGRESS">En cours</option>
                  <option value="BLOCKED">Bloquee</option>
                  <option value="DONE">Terminee</option>
                </select>
              </label>
            </div>
            <Button disabled={!selectedGroup} type="submit">
              <CalendarDays size={17} />
              Ajouter
            </Button>
          </form>
        </aside>
      </div>
    </div>
  );
}

function Metric({
  label,
  tone,
  value,
}: Readonly<{ label: string; tone?: "danger"; value: number }>) {
  return (
    <article className={`metric ${tone === "danger" ? "metric-danger" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
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
