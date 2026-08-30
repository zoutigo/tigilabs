import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type { Task, TaskGroup, User } from "@tigilabs/types";
import { useEffect, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "../ui/toast";
import { TaskWorkspace } from "./task-workspace";

function renderWorkspace() {
  return render(
    <ToastProvider>
      <TaskWorkspace />
    </ToastProvider>,
  );
}

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
  {
    archivedAt: null,
    completedTasks: 1,
    createdAt: "2026-05-22T12:00:00.000Z",
    createdById: admin.id,
    description: "Archives cloturees.",
    id: "group-legal",
    name: "Conformite legale",
    overdueTasks: 0,
    progress: 100,
    status: "ACTIVE",
    tasks: [
      {
        dueDate: "2026-04-01T12:00:00.000Z",
        groupId: "group-legal",
        id: "task-legal",
        priority: "LOW",
        startDate: "2026-03-01T12:00:00.000Z",
        status: "DONE",
        title: "Deposer les statuts finaux",
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

const taskGroupsHook = vi.hoisted(() => ({
  useTaskGroups: vi.fn(),
}));

vi.mock("../../hooks/use-tasks", () => ({
  useTaskGroups: taskGroupsHook.useTaskGroups,
}));

vi.mock("../../hooks/use-users", () => ({
  useUsers: () => ({ users: [admin, manager] }),
}));

vi.mock("../../lib/api/tasks", () => apiMocks);

describe("TaskWorkspace", () => {
  beforeEach(() => {
    apiMocks.getTaskGroup.mockRejectedValue(new Error("offline"));
    taskGroupsHook.useTaskGroups.mockImplementation(() => ({ groups }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the responsive task module with tabs, progress and filters", () => {
    renderWorkspace();

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
    renderWorkspace();

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

    renderWorkspace();
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

  it("links the new task CTA to the create-task page for the selected group", () => {
    renderWorkspace();

    expect(
      screen.getByRole("link", { name: /Nouvelle tache/ }),
    ).toHaveAttribute("href", "/tasks/new?group=group-incorporation");
  });

  it("shows non-completed groups by default and hides fully completed ones", () => {
    renderWorkspace();

    expect(
      screen.getByRole("button", { name: /^Immatriculation/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Operations/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Conformite legale/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /2 en cours.*1 terminees/ }),
    ).toBeInTheDocument();
  });

  it("lets the user switch the group list to completed groups only", () => {
    renderWorkspace();

    fireEvent.click(
      screen.getByRole("button", { name: /2 en cours.*1 terminees/ }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Termines" }));

    expect(
      screen.getByRole("button", { name: /^Conformite legale/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Immatriculation/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Operations/ }),
    ).not.toBeInTheDocument();
  });

  it("shows an empty message when no group matches the completion filter", () => {
    const pendingOnlyGroups = groups.filter(
      (group) => group.id !== "group-legal",
    );
    taskGroupsHook.useTaskGroups.mockImplementation(() => ({
      groups: pendingOnlyGroups,
    }));

    renderWorkspace();

    fireEvent.click(
      screen.getByRole("button", { name: /2 en cours.*0 terminees/ }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Termines" }));

    expect(
      screen.getByText("Aucun groupe termine pour le moment."),
    ).toBeInTheDocument();
  });

  it("keeps the group creation form hidden until its trigger is clicked", () => {
    renderWorkspace();

    expect(
      screen.queryByPlaceholderText("Immatriculation Tigilabs"),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Creer un groupe" }));
    expect(
      screen.getByPlaceholderText("Immatriculation Tigilabs"),
    ).toBeInTheDocument();
  });

  it("creates a group optimistically, closes the modal, and keeps the fallback when the API call fails", async () => {
    apiMocks.createTaskGroup.mockRejectedValue(new Error("offline"));

    renderWorkspace();

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

    renderWorkspace();

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

  it("keeps already-fetched full task detail when the groups summary list is refetched with a new array reference", async () => {
    const opsGroup = groups.find((group) => group.id === "group-ops");
    if (!opsGroup) {
      throw new Error("group-ops fixture is missing");
    }

    apiMocks.getTaskGroup.mockImplementation(async (id: string) =>
      id === "group-ops"
        ? { ...opsGroup, tasks: [opsTaskDetail] }
        : Promise.reject(new Error("offline")),
    );

    const { rerender } = renderWorkspace();

    const opsGroupButton = screen.getByText("Operations").closest("button");
    if (!opsGroupButton) {
      throw new Error("Operations group button not found");
    }
    fireEvent.click(opsGroupButton);

    await screen.findByRole("row", {
      name: /Structurer la roadmap produit/,
    });

    // Simulate the groups summary list being refetched with a brand new
    // array reference (e.g. React Strict Mode double-invoking effects, or a
    // future polling refresh). It only ever carries the lightweight task
    // summary (id/status/dueDate), so this must not wipe the full task
    // detail already fetched for the selected group. The mock must return
    // the same reference on every call, or the effect depending on it
    // would refire on each render and loop forever.
    const refreshedGroups = groups.map((group) => ({ ...group }));
    taskGroupsHook.useTaskGroups.mockImplementation(() => ({
      groups: refreshedGroups,
    }));
    rerender(
      <ToastProvider>
        <TaskWorkspace />
      </ToastProvider>,
    );

    const row = screen.getByRole("row", {
      name: /Structurer la roadmap produit/,
    });
    expect(within(row).getByText("Serge B.")).toBeInTheDocument();
    expect(within(row).getByText("Haute")).toBeInTheDocument();
  });

  it("replaces a stale group selection once the real groups load, keeping the create-task button reachable", async () => {
    const staleMockGroup: TaskGroup = {
      archivedAt: null,
      completedTasks: 0,
      createdAt: "2020-01-01T00:00:00.000Z",
      createdById: "mock-user",
      description: "",
      id: "mock-stale-group",
      name: "Groupe fictif",
      overdueTasks: 0,
      progress: 0,
      status: "ACTIVE",
      tasks: [],
      totalTasks: 0,
    };

    taskGroupsHook.useTaskGroups.mockImplementation(() => {
      const [current, setCurrent] = useState<TaskGroup[]>([staleMockGroup]);
      useEffect(() => {
        setCurrent(groups);
      }, []);
      return { groups: current };
    });

    renderWorkspace();

    expect(
      await screen.findByRole("heading", { name: "Immatriculation" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Nouvelle tache/ }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Groupe fictif")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Aucun groupe actif pour le moment."),
    ).not.toBeInTheDocument();
  });

  it("keeps the API failure from wiping out the summary data already loaded from the groups list", async () => {
    apiMocks.getTaskGroup.mockRejectedValue(new Error("offline"));

    renderWorkspace();

    await waitFor(() => {
      expect(apiMocks.getTaskGroup).toHaveBeenCalledWith("group-incorporation");
    });

    expect(screen.getByText("Preparer les statuts")).toBeInTheDocument();
    expect(screen.getByText("Ouvrir le compte bancaire")).toBeInTheDocument();
  });
});
