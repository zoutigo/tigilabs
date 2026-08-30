import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type { Task, TaskGroup, User } from "@tigilabs/types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TaskWorkspace } from "./task-workspace";

const apiMocks = vi.hoisted(() => ({
  archiveTaskGroup: vi.fn(),
  completeTask: vi.fn(),
  createTask: vi.fn(),
  createTaskGroup: vi.fn(),
  getTaskGroup: vi.fn(),
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
  {
    archivedAt: null,
    completedTasks: 0,
    createdAt: "2026-05-21T12:00:00.000Z",
    createdById: admin.id,
    description: "Organisation du socle prive.",
    id: "group-ops",
    name: "Operations",
    overdueTasks: 0,
    progress: 0,
    status: "ACTIVE",
    // La liste des groupes ne renvoie qu'un resume des taches (id/status/dueDate).
    tasks: [
      {
        dueDate: "2026-06-15T12:00:00.000Z",
        groupId: "group-ops",
        id: "task-roadmap",
        priority: "MEDIUM",
        startDate: "2026-06-01T12:00:00.000Z",
        status: "TODO",
        title: "",
      } as Task,
    ],
    totalTasks: 1,
  },
];

const opsTaskDetail: Task = {
  assignedTo: manager,
  assignedToId: manager.id,
  dueDate: "2026-06-15T12:00:00.000Z",
  groupId: "group-ops",
  id: "task-roadmap",
  priority: "HIGH",
  startDate: "2026-06-01T12:00:00.000Z",
  status: "TODO",
  title: "Structurer la roadmap produit",
};

vi.mock("../../hooks/use-tasks", () => ({
  useTaskGroups: () => ({ groups }),
}));

vi.mock("../../hooks/use-users", () => ({
  useUsers: () => ({ users: [admin, manager] }),
}));

vi.mock("../../lib/api/tasks", () => apiMocks);

describe("TaskWorkspace", () => {
  beforeEach(() => {
    apiMocks.getTaskGroup.mockRejectedValue(new Error("offline"));
  });

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

    fireEvent.click(screen.getByRole("button", { name: "Nouvelle tache" }));
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

  it("keeps the task and group creation forms hidden until their trigger is clicked", () => {
    render(<TaskWorkspace />);

    expect(
      screen.queryByPlaceholderText("Deposer le dossier"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Immatriculation Tigilabs"),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Nouvelle tache" }));
    expect(
      screen.getByPlaceholderText("Deposer le dossier"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Fermer" }));
    expect(
      screen.queryByPlaceholderText("Deposer le dossier"),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Creer un groupe" }));
    expect(
      screen.getByPlaceholderText("Immatriculation Tigilabs"),
    ).toBeInTheDocument();
  });

  it("creates a task optimistically, closes the modal, and keeps the fallback when the API call fails", async () => {
    apiMocks.createTask.mockRejectedValue(new Error("offline"));

    render(<TaskWorkspace />);

    fireEvent.click(screen.getByRole("button", { name: "Nouvelle tache" }));
    fireEvent.change(screen.getByPlaceholderText("Deposer le dossier"), {
      target: { value: "Relire le contrat" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ajouter" }));

    await waitFor(() => {
      expect(apiMocks.createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          groupId: "group-incorporation",
          title: "Relire le contrat",
        }),
      );
    });

    expect(
      screen.queryByPlaceholderText("Deposer le dossier"),
    ).not.toBeInTheDocument();
    expect(await screen.findByText("Relire le contrat")).toBeInTheDocument();
  });

  it("creates a group optimistically, closes the modal, and keeps the fallback when the API call fails", async () => {
    apiMocks.createTaskGroup.mockRejectedValue(new Error("offline"));

    render(<TaskWorkspace />);

    fireEvent.click(screen.getByRole("button", { name: "Creer un groupe" }));
    fireEvent.change(screen.getByPlaceholderText("Immatriculation Tigilabs"), {
      target: { value: "Nouveau groupe" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Creer" }));

    await waitFor(() => {
      expect(apiMocks.createTaskGroup).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Nouveau groupe" }),
      );
    });

    expect(
      screen.queryByPlaceholderText("Immatriculation Tigilabs"),
    ).not.toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "Nouveau groupe" }),
    ).toBeInTheDocument();
  });

  it("fetches and merges the full task details when a group is selected", async () => {
    const opsGroup = groups.find((group) => group.id === "group-ops");
    if (!opsGroup) {
      throw new Error("group-ops fixture is missing");
    }

    apiMocks.getTaskGroup.mockImplementation(async (id: string) =>
      id === "group-ops"
        ? { ...opsGroup, tasks: [opsTaskDetail] }
        : Promise.reject(new Error("offline")),
    );

    render(<TaskWorkspace />);

    const opsGroupButton = screen.getByText("Operations").closest("button");
    if (!opsGroupButton) {
      throw new Error("Operations group button not found");
    }
    fireEvent.click(opsGroupButton);

    const row = await screen.findByRole("row", {
      name: /Structurer la roadmap produit/,
    });
    expect(within(row).getByText("Serge B.")).toBeInTheDocument();
    expect(within(row).getByText("Haute")).toBeInTheDocument();
  });

  it("keeps the API failure from wiping out the summary data already loaded from the groups list", async () => {
    apiMocks.getTaskGroup.mockRejectedValue(new Error("offline"));

    render(<TaskWorkspace />);

    await waitFor(() => {
      expect(apiMocks.getTaskGroup).toHaveBeenCalledWith("group-incorporation");
    });

    expect(screen.getByText("Preparer les statuts")).toBeInTheDocument();
    expect(screen.getByText("Ouvrir le compte bancaire")).toBeInTheDocument();
  });
});
