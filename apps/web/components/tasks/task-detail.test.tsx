import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type { Task, User } from "@tigilabs/types";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "../ui/toast";
import { TaskDetail } from "./task-detail";

const router = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
}));

const apiMocks = vi.hoisted(() => ({
  addTaskProgress: vi.fn(),
  completeTask: vi.fn(),
  deleteTask: vi.fn(),
  getTask: vi.fn(),
  initialTask: {
    completedAt: null,
    description:
      "Rediger les statuts de l'entreprise et les preparer pour la legalisation.",
    dueDate: "2026-05-30T12:00:00.000Z",
    groupId: "group-incorporation",
    id: "task-statuts",
    priority: "HIGH",
    progress: [],
    startDate: "2026-05-27T12:00:00.000Z",
    status: "IN_PROGRESS",
    title: "Preparer les statuts",
  },
  reopenTask: vi.fn(),
  updateTask: vi.fn(),
}));

function renderDetail(id = "task-statuts") {
  return render(
    <ToastProvider>
      <TaskDetail id={id} />
    </ToastProvider>,
  );
}

const admin: User = vi.hoisted(() => ({
  email: "valery@tigilabs.com",
  id: "user-admin",
  name: "Valery M.",
  status: "ACTIVE" as const,
}));

const task: Task = {
  assignedTo: admin,
  assignedToId: admin.id,
  completedAt: null,
  createdBy: admin,
  createdById: admin.id,
  description:
    "Rediger les statuts de l'entreprise et les preparer pour la legalisation.",
  dueDate: "2026-05-30T12:00:00.000Z",
  group: {
    archivedAt: null,
    completedTasks: 0,
    createdAt: "2026-05-20T12:00:00.000Z",
    createdById: admin.id,
    id: "group-incorporation",
    name: "Immatriculation",
    overdueTasks: 0,
    progress: 0,
    status: "ACTIVE",
    tasks: [],
    totalTasks: 1,
  },
  groupId: "group-incorporation",
  history: [
    {
      action: "TASK_CREATED",
      createdAt: "2026-05-27T10:00:00.000Z",
      id: "history-1",
      newValue: "Preparer les statuts",
      taskId: "task-statuts",
      user: admin,
      userId: admin.id,
    },
  ],
  id: "task-statuts",
  priority: "HIGH",
  progress: [
    {
      author: admin,
      authorId: admin.id,
      content: "Premiere version redigee.",
      createdAt: "2026-05-28T12:00:00.000Z",
      id: "progress-1",
      taskId: "task-statuts",
    },
  ],
  startDate: "2026-05-27T12:00:00.000Z",
  status: "IN_PROGRESS",
  title: "Preparer les statuts",
};

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("not found");
  },
  useRouter: () => router,
}));

vi.mock("../../hooks/use-users", () => ({
  useUsers: () => ({ users: [admin] }),
}));

vi.mock("../../lib/api/tasks", () => ({
  ...apiMocks,
  mockTasks: [apiMocks.initialTask],
}));

describe("TaskDetail", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the desktop detail structure with tabs, metadata and history", async () => {
    apiMocks.getTask.mockResolvedValue(task);

    renderDetail();

    expect(
      screen.getByRole("heading", { name: "Preparer les statuts" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Details" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      await screen.findByText("Premiere version redigee."),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Immatriculation").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Valery M.").length).toBeGreaterThan(0);

    const historyPanel = screen.getByRole("heading", {
      name: "Historique",
    }).parentElement;
    expect(historyPanel).not.toBeNull();
    expect(
      within(historyPanel as HTMLElement).getByText(/Tache creee/),
    ).toBeInTheDocument();
  });

  it("switches the active tab and marks the matching data attribute", async () => {
    apiMocks.getTask.mockResolvedValue(task);

    renderDetail();
    await screen.findByText("Premiere version redigee.");

    const detailsTab = screen.getByRole("tab", { name: "Details" });
    const avancementTab = screen.getByRole("tab", { name: "Avancement" });
    const historiqueTab = screen.getByRole("tab", { name: "Historique" });
    const layout = detailsTab.closest(".task-detail-layout");
    if (!layout) {
      throw new Error("task-detail-layout not found");
    }

    expect(detailsTab).toHaveAttribute("aria-selected", "true");
    expect(layout).toHaveAttribute("data-active-tab", "details");

    fireEvent.click(avancementTab);
    expect(avancementTab).toHaveAttribute("aria-selected", "true");
    expect(detailsTab).toHaveAttribute("aria-selected", "false");
    expect(layout).toHaveAttribute("data-active-tab", "avancement");

    fireEvent.click(historiqueTab);
    expect(historiqueTab).toHaveAttribute("aria-selected", "true");
    expect(avancementTab).toHaveAttribute("aria-selected", "false");
    expect(layout).toHaveAttribute("data-active-tab", "historique");
  });

  it("adds progress optimistically and validates empty content", async () => {
    apiMocks.getTask.mockResolvedValue(task);
    apiMocks.addTaskProgress.mockRejectedValue(new Error("offline"));

    renderDetail();

    fireEvent.click(
      screen.getByRole("button", { name: "Ajouter une information" }),
    );

    expect(
      await screen.findByText("Le contenu est obligatoire."),
    ).toBeInTheDocument();

    fireEvent.change(
      screen.getByPlaceholderText("Ajouter une information..."),
      {
        target: { value: "Statuts transmis pour relecture." },
      },
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Ajouter une information" }),
    );

    await waitFor(() => {
      expect(apiMocks.addTaskProgress).toHaveBeenCalledWith(
        "task-statuts",
        "Statuts transmis pour relecture.",
      );
    });
    expect(
      screen.getByText("Statuts transmis pour relecture."),
    ).toBeInTheDocument();
  });

  it("marks the task as completed and switches to the reopen action", async () => {
    apiMocks.getTask.mockResolvedValue(task);
    apiMocks.completeTask.mockResolvedValue({
      ...task,
      completedAt: "2026-05-30T12:00:00.000Z",
      status: "DONE",
    });

    renderDetail();

    fireEvent.click(screen.getByRole("button", { name: "Terminer" }));

    await waitFor(() => {
      expect(apiMocks.completeTask).toHaveBeenCalledWith("task-statuts");
    });
    expect(screen.getByRole("button", { name: "Rouvrir" })).toBeInTheDocument();
    expect(screen.getByText("Terminee")).toBeInTheDocument();
  });

  it("edits a task and shows an error message when the update fails", async () => {
    apiMocks.getTask.mockResolvedValue(task);
    apiMocks.updateTask.mockRejectedValueOnce(new Error("offline"));
    apiMocks.updateTask.mockResolvedValueOnce({
      ...task,
      title: "Preparer les statuts modifies",
    });

    renderDetail();

    fireEvent.click(await screen.findByRole("button", { name: "Modifier" }));
    const titleInput = screen.getByDisplayValue("Preparer les statuts");
    fireEvent.change(titleInput, {
      target: { value: "Preparer les statuts modifies" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(
      await screen.findByText(/La mise a jour n'a pas pu etre enregistree/),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(apiMocks.updateTask).toHaveBeenCalledTimes(2);
    });
    expect(
      await screen.findByRole("heading", {
        name: "Preparer les statuts modifies",
      }),
    ).toBeInTheDocument();
  });

  it("deletes a task after confirmation and redirects to the task list", async () => {
    apiMocks.getTask.mockResolvedValue(task);
    apiMocks.deleteTask.mockResolvedValue(undefined);

    renderDetail();

    fireEvent.click(await screen.findByRole("button", { name: "Supprimer" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Confirmer la suppression" }),
    );

    await waitFor(() => {
      expect(apiMocks.deleteTask).toHaveBeenCalledWith("task-statuts");
    });
    expect(router.push).toHaveBeenCalledWith("/tasks");
  });

  it("shows an error message when the deletion fails", async () => {
    apiMocks.getTask.mockResolvedValue(task);
    apiMocks.deleteTask.mockRejectedValue(new Error("offline"));

    renderDetail();

    fireEvent.click(await screen.findByRole("button", { name: "Supprimer" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Confirmer la suppression" }),
    );

    expect(
      await screen.findByText(/La suppression a echoue/),
    ).toBeInTheDocument();
    expect(router.push).not.toHaveBeenCalled();
  });
});
