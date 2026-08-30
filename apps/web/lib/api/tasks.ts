import type {
  Task,
  TaskGroup,
  TaskHistory,
  TaskPriority,
  TaskProgress,
  TaskStatus,
} from "@tigilabs/types";
import { mockUsers } from "./users";
import { apiClient } from "./client";

const [admin, manager, member] = mockUsers;
const now = new Date();
const iso = (days: number) => {
  const date = new Date(now);
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

function progress(
  taskId: string,
  authorId: string,
  content: string,
  days: number,
): TaskProgress {
  const author = mockUsers.find((user) => user.id === authorId) ?? admin;

  return {
    id: `${taskId}-progress-${days}`,
    taskId,
    authorId,
    author,
    content,
    createdAt: iso(days),
  };
}

function history(
  taskId: string,
  userId: string,
  action: string,
  newValue: string,
  days: number,
): TaskHistory {
  const user = mockUsers.find((item) => item.id === userId) ?? admin;

  return {
    id: `${taskId}-history-${action}-${days}`,
    taskId,
    userId,
    user,
    action,
    newValue,
    createdAt: iso(days),
  };
}

function task(input: {
  id: string;
  groupId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedToId?: string | null;
  startOffset: number;
  dueOffset?: number;
  completedOffset?: number;
}): Task {
  const assignedTo =
    mockUsers.find((user) => user.id === input.assignedToId) ?? null;
  const dueDate = input.dueOffset === undefined ? null : iso(input.dueOffset);

  return {
    id: input.id,
    groupId: input.groupId,
    title: input.title,
    description: input.description,
    status: input.status,
    priority: input.priority,
    startDate: iso(input.startOffset),
    dueDate,
    completedAt:
      input.completedOffset === undefined ? null : iso(input.completedOffset),
    assignedToId: input.assignedToId,
    assignedTo,
    assignee: assignedTo,
    createdById: admin.id,
    createdBy: admin,
    createdAt: iso(input.startOffset),
    updatedAt: iso(input.completedOffset ?? input.startOffset),
    isOverdue:
      Boolean(dueDate) &&
      new Date(dueDate as string).getTime() < now.getTime() &&
      input.status !== "DONE",
    progress: [
      progress(
        input.id,
        input.assignedToId ?? admin.id,
        "Point de suivi ajoute pour cadrer la prochaine action.",
        input.startOffset,
      ),
    ],
    history: [
      history(
        input.id,
        admin.id,
        "TASK_CREATED",
        input.title,
        input.startOffset,
      ),
    ],
  };
}

const incorporationTasks: Task[] = [
  task({
    id: "task-statuts",
    groupId: "group-incorporation",
    title: "Preparer les statuts",
    description: "Finaliser la version a signer par les associes.",
    status: "DONE",
    priority: "HIGH",
    assignedToId: admin.id,
    startOffset: -8,
    dueOffset: -5,
    completedOffset: -5,
  }),
  task({
    id: "task-legalisation",
    groupId: "group-incorporation",
    title: "Faire legaliser les documents",
    description: "Coordonner la legalisation des signatures et copies.",
    status: "IN_PROGRESS",
    priority: "HIGH",
    assignedToId: manager.id,
    startOffset: -4,
    dueOffset: 1,
  }),
  task({
    id: "task-rccm",
    groupId: "group-incorporation",
    title: "Deposer le dossier RCCM",
    status: "TODO",
    priority: "MEDIUM",
    assignedToId: null,
    startOffset: 2,
    dueOffset: 5,
  }),
  task({
    id: "task-bank",
    groupId: "group-incorporation",
    title: "Ouvrir le compte bancaire",
    status: "BLOCKED",
    priority: "URGENT",
    assignedToId: member.id,
    startOffset: -2,
    dueOffset: -1,
  }),
];

const opsTasks: Task[] = [
  task({
    id: "task-roadmap",
    groupId: "group-ops",
    title: "Structurer la roadmap produit",
    description: "Prioriser les modules internes apres le socle utilisateurs.",
    status: "IN_PROGRESS",
    priority: "HIGH",
    assignedToId: admin.id,
    startOffset: -3,
    dueOffset: 3,
  }),
  task({
    id: "task-permissions",
    groupId: "group-ops",
    title: "Finaliser les permissions",
    description: "Verifier les droits des modules taches et utilisateurs.",
    status: "TODO",
    priority: "MEDIUM",
    assignedToId: manager.id,
    startOffset: -1,
    dueOffset: 6,
  }),
];

function group(input: {
  id: string;
  name: string;
  description: string;
  tasks: Task[];
}): TaskGroup {
  const completedTasks = input.tasks.filter(
    (item) => item.status === "DONE",
  ).length;
  const overdueTasks = input.tasks.filter((item) => item.isOverdue).length;

  return {
    id: input.id,
    name: input.name,
    description: input.description,
    status: "ACTIVE",
    createdById: admin.id,
    createdBy: admin,
    createdAt: iso(-10),
    updatedAt: iso(-1),
    archivedAt: null,
    tasks: input.tasks,
    totalTasks: input.tasks.length,
    completedTasks,
    overdueTasks,
    progress: input.tasks.length
      ? Math.round((completedTasks / input.tasks.length) * 100)
      : 0,
  };
}

export const mockTaskGroups: TaskGroup[] = [
  group({
    id: "group-incorporation",
    name: "Immatriculation Tigilabs",
    description: "Suivi des demarches administratives de constitution.",
    tasks: incorporationTasks,
  }),
  group({
    id: "group-ops",
    name: "Operations internes",
    description: "Organisation du socle prive Tigilabs.",
    tasks: opsTasks,
  }),
];

export const mockTasks: Task[] = mockTaskGroups.flatMap((item) =>
  item.tasks.map((taskItem) => ({ ...taskItem, group: item })),
);

export function getTaskGroups() {
  return apiClient<TaskGroup[]>("/tasks/groups");
}

export function getTaskGroup(id: string) {
  return apiClient<TaskGroup>(`/tasks/groups/${id}`);
}

export function getTasks(query = "") {
  return apiClient<Task[]>(`/tasks${query}`);
}

export function getMyTasks() {
  return apiClient<Task[]>("/tasks/my");
}

export function getTask(id: string) {
  return apiClient<Task>(`/tasks/${id}`);
}

export function createTaskGroup(payload: {
  name: string;
  description?: string;
}) {
  return apiClient<TaskGroup>("/tasks/groups", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function updateTaskGroup(
  id: string,
  payload: { name?: string; description?: string },
) {
  return apiClient<TaskGroup>(`/tasks/groups/${id}`, {
    body: JSON.stringify(payload),
    method: "PATCH",
  });
}

export function archiveTaskGroup(id: string) {
  return apiClient<TaskGroup>(`/tasks/groups/${id}/archive`, {
    method: "PATCH",
  });
}

export function createTask(payload: {
  groupId: string;
  title: string;
  description?: string;
  startDate?: string;
  dueDate?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  assignedToId?: string | null;
}) {
  return apiClient<Task>("/tasks", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function updateTask(
  id: string,
  payload: Partial<{
    title: string;
    description: string;
    startDate: string;
    dueDate: string | null;
    priority: TaskPriority;
    status: TaskStatus;
    assignedToId: string | null;
  }>,
) {
  return apiClient<Task>(`/tasks/${id}`, {
    body: JSON.stringify(payload),
    method: "PATCH",
  });
}

export function completeTask(id: string) {
  return apiClient<Task>(`/tasks/${id}/complete`, { method: "PATCH" });
}

export function reopenTask(id: string) {
  return apiClient<Task>(`/tasks/${id}/reopen`, { method: "PATCH" });
}

export function addTaskProgress(id: string, content: string) {
  return apiClient<TaskProgress>(`/tasks/${id}/progress`, {
    body: JSON.stringify({ content }),
    method: "POST",
  });
}

export function deleteTask(id: string) {
  return apiClient<void>(`/tasks/${id}`, { method: "DELETE" });
}

export function getDashboard() {
  return apiClient<{
    mine: {
      todo: number;
      inProgress: number;
      overdue: number;
      blocked: number;
    };
    urgent: Task[];
    dueSoon: Task[];
    recentActivity: TaskHistory[];
  }>("/tasks/dashboard");
}
