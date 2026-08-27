import { render, screen, within } from "@testing-library/react";
import type { Task, TaskGroup, TaskHistory } from "@tigilabs/types";
import { describe, expect, it, vi } from "vitest";
import { TaskDashboard } from "./task-dashboard";

const user = {
  email: "valery@tigilabs.com",
  id: "user-admin",
  name: "Valery M.",
  status: "ACTIVE" as const,
};

const urgentTask: Task = {
  assignedTo: user,
  assignedToId: user.id,
  dueDate: "2026-05-31T00:00:00.000Z",
  group: {
    archivedAt: null,
    completedTasks: 5,
    createdAt: "2026-05-20T00:00:00.000Z",
    createdById: user.id,
    id: "group-incorporation",
    name: "Immatriculation",
    overdueTasks: 1,
    progress: 71,
    status: "ACTIVE",
    tasks: [],
    totalTasks: 7,
  },
  groupId: "group-incorporation",
  id: "task-rccm",
  priority: "URGENT",
  status: "TODO",
  title: "Preparer dossier RCCM",
};

const history: TaskHistory = {
  action: "TASK_CREATED",
  createdAt: "2026-05-27T10:00:00.000Z",
  id: "history-1",
  newValue: "Preparer dossier RCCM",
  taskId: urgentTask.id,
  user,
  userId: user.id,
};

const groups: TaskGroup[] = [
  {
    archivedAt: null,
    completedTasks: 5,
    createdAt: "2026-05-20T00:00:00.000Z",
    createdById: user.id,
    id: "group-incorporation",
    name: "Immatriculation",
    overdueTasks: 1,
    progress: 71,
    status: "ACTIVE",
    tasks: [urgentTask],
    totalTasks: 7,
  },
  {
    archivedAt: null,
    completedTasks: 2,
    createdAt: "2026-05-20T00:00:00.000Z",
    createdById: user.id,
    id: "group-recruitment",
    name: "Recrutement Dev",
    overdueTasks: 0,
    progress: 40,
    status: "ACTIVE",
    tasks: [],
    totalTasks: 5,
  },
];

vi.mock("../../hooks/use-tasks", () => ({
  useTaskDashboard: () => ({
    dashboard: {
      dueSoon: [urgentTask],
      mine: {
        blocked: 0,
        inProgress: 7,
        overdue: 4,
        todo: 18,
      },
      recentActivity: [history],
      urgent: [urgentTask],
    },
  }),
  useTaskGroups: () => ({ groups }),
}));

describe("TaskDashboard", () => {
  it("renders the maquette KPI cards with group completion totals", () => {
    render(<TaskDashboard />);

    expect(screen.getByText("Mes taches")).toBeInTheDocument();
    expect(screen.getAllByText("A faire").length).toBeGreaterThan(0);
    expect(screen.getByText("18")).toBeInTheDocument();
    expect(screen.getByText("En cours")).toBeInTheDocument();
    expect(screen.getAllByText("7")).toHaveLength(2);
    expect(screen.getByText("En retard")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("Terminees")).toBeInTheDocument();
    expect(screen.getByText("Cette semaine")).toBeInTheDocument();
  });

  it("shows urgent tasks, due dates and group progress links", () => {
    render(<TaskDashboard />);

    expect(
      screen.getAllByRole("link", { name: /Preparer dossier RCCM/ })[0],
    ).toHaveAttribute("href", "/tasks/task-rccm");

    const progressPanel = screen
      .getByText("Progression des groupes")
      .closest("section");

    expect(progressPanel).not.toBeNull();
    expect(
      within(progressPanel as HTMLElement).getByText("71%"),
    ).toBeInTheDocument();
    expect(
      within(progressPanel as HTMLElement).getByRole("link", {
        name: "Voir tous les groupes",
      }),
    ).toHaveAttribute("href", "/tasks");
  });
});
