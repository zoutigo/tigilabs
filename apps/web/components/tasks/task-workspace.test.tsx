import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type { Task, TaskGroup, User } from "@tigilabs/types";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TaskWorkspace } from "./task-workspace";

const apiMocks = vi.hoisted(() => ({
  archiveTaskGroup: vi.fn(),
  completeTask: vi.fn(),
  createTask: vi.fn(),
  createTaskGroup: vi.fn(),
}));

const admin: User = {
  email: "valery@tigilabs.com",
  id: "user-admin",
  name: "Valery M.",
  status: "ACTIVE",
};

const manager: User = {
  email: "serge@tigilabs.com",
  id: "user-manager",
  name: "Serge B.",
  status: "ACTIVE",
};

const doneTask: Task = {
  assignedTo: admin,
  assignedToId: admin.id,
  description: "Rediger les statuts de l'entreprise.",
  dueDate: "2026-05-30T12:00:00.000Z",
  groupId: "group-incorporation",
  id: "task-statuts",
  priority: "HIGH",
  startDate: "2026-05-27T12:00:00.000Z",
  status: "DONE",
  title: "Preparer les statuts",
};

const bankTask: Task = {
  assignedTo: manager,
  assignedToId: manager.id,
  dueDate: "2026-05-31T12:00:00.000Z",
  groupId: "group-incorporation",
  id: "task-bank",
  isOverdue: true,
  priority: "URGENT",
  startDate: "2026-05-29T12:00:00.000Z",
  status: "BLOCKED",
  title: "Ouvrir le compte bancaire",
};

const groups: TaskGroup[] = [
  {
    archivedAt: null,
    completedTasks: 1,
    createdAt: "2026-05-20T12:00:00.000Z",
    createdById: admin.id,
    description: "Suivi des demarches administratives.",
    id: "group-incorporation",
    name: "Immatriculation",
    overdueTasks: 1,
    progress: 50,
    status: "ACTIVE",
    tasks: [doneTask, bankTask],
    totalTasks: 2,
  },
];

vi.mock("../../hooks/use-tasks", () => ({
  useTaskGroups: () => ({ groups }),
}));

vi.mock("../../hooks/use-users", () => ({
  useUsers: () => ({ users: [admin, manager] }),
}));

vi.mock("../../lib/api/tasks", () => apiMocks);

describe("TaskWorkspace", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the responsive task module with tabs, progress and filters", () => {
    render(<TaskWorkspace />);

    expect(
      screen.getByRole("heading", { name: "Immatriculation" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Taches" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByLabelText("Filtrer par statut")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Filtrer par responsable"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Trier par")).toBeInTheDocument();
  });

  it("filters tasks by search text and quick filters", () => {
    render(<TaskWorkspace />);

    fireEvent.change(
      screen.getByPlaceholderText("Rechercher titre, description, responsable"),
      { target: { value: "compte bancaire" } },
    );

    expect(screen.getByText("Ouvrir le compte bancaire")).toBeInTheDocument();
    expect(screen.queryByText("Preparer les statuts")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Filtre rapide"), {
      target: { value: "urgent" },
    });

    expect(
      within(
        screen.getByRole("row", { name: /Ouvrir le compte bancaire/ }),
      ).getByText("Urgente"),
    ).toBeInTheDocument();
  });

  it("marks a task as completed optimistically and calls the API", async () => {
    apiMocks.completeTask.mockRejectedValue(new Error("offline"));

    render(<TaskWorkspace />);
    const row = screen.getByRole("row", {
      name: /Ouvrir le compte bancaire/,
    });

    fireEvent.click(
      within(row).getByRole("button", {
        name: "Marquer Ouvrir le compte bancaire comme terminee",
      }),
    );

    await waitFor(() => {
      expect(apiMocks.completeTask).toHaveBeenCalledWith("task-bank");
    });
    expect(within(row).getByText("Terminee")).toBeInTheDocument();
    expect(within(row).queryByText("En retard")).not.toBeInTheDocument();
  });

  it("shows the required title error before creating a task", async () => {
    render(<TaskWorkspace />);

    fireEvent.click(screen.getByRole("button", { name: "Ajouter" }));

    expect(
      await screen.findByText("L'intitule est obligatoire."),
    ).toBeInTheDocument();
    expect(apiMocks.createTask).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText("Deposer le dossier")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });
});
