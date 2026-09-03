import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { TaskGroup, User } from "@tigilabs/types";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "../ui/toast";
import { TaskCreateForm } from "./task-create-form";

const router = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
}));

const apiMocks = vi.hoisted(() => ({
  createTask: vi.fn(),
}));

const admin: User = {
  email: "valery@tigilabs.com",
  id: "user-admin",
  name: "Valery M.",
  status: "ACTIVE",
};

const groups: TaskGroup[] = [
  {
    archivedAt: null,
    completedTasks: 0,
    createdAt: "2026-05-20T12:00:00.000Z",
    createdById: admin.id,
    description: "",
    id: "group-incorporation",
    name: "Immatriculation",
    overdueTasks: 0,
    progress: 0,
    status: "ACTIVE",
    tasks: [],
    totalTasks: 0,
  },
  {
    archivedAt: null,
    completedTasks: 0,
    createdAt: "2026-05-21T12:00:00.000Z",
    createdById: admin.id,
    description: "",
    id: "group-ops",
    name: "Operations",
    overdueTasks: 0,
    progress: 0,
    status: "ACTIVE",
    tasks: [],
    totalTasks: 0,
  },
];

vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));

vi.mock("../../hooks/use-tasks", () => ({
  useTaskGroups: () => ({ groups }),
}));

vi.mock("../../hooks/use-users", () => ({
  useUsers: () => ({ users: [admin] }),
}));

vi.mock("../../lib/api/tasks", () => apiMocks);

function renderForm(defaultGroupId?: string) {
  return render(
    <ToastProvider>
      <TaskCreateForm defaultGroupId={defaultGroupId} />
    </ToastProvider>,
  );
}

describe("TaskCreateForm", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("preselects the group passed via defaultGroupId", () => {
    renderForm("group-ops");

    const select = screen
      .getByText("Groupe")
      .closest(".meta-card")
      ?.querySelector("select");
    expect(select).toHaveValue("group-ops");
  });

  it("shows the required title error and does not call the API", async () => {
    renderForm();

    fireEvent.click(screen.getByRole("button", { name: "Ajouter la tache" }));

    expect(
      await screen.findByText("L'intitule est obligatoire."),
    ).toBeInTheDocument();
    expect(apiMocks.createTask).not.toHaveBeenCalled();
  });

  it("creates the task and redirects to the group's synthesis view", async () => {
    apiMocks.createTask.mockResolvedValue({ id: "task-new" });

    renderForm("group-incorporation");

    fireEvent.change(screen.getByPlaceholderText("Deposer le dossier"), {
      target: { value: "Relire le contrat" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ajouter la tache" }));

    await waitFor(() => {
      expect(apiMocks.createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          groupId: "group-incorporation",
          title: "Relire le contrat",
        }),
      );
    });

    expect(router.push).toHaveBeenCalledWith(
      "/tasks?group=group-incorporation",
    );
  });

  it("shows the backend's explicit error message when the API call fails (e.g. missing RBAC permission)", async () => {
    apiMocks.createTask.mockRejectedValue(
      new Error("Permission manquante: task.create"),
    );

    renderForm("group-incorporation");

    fireEvent.change(screen.getByPlaceholderText("Deposer le dossier"), {
      target: { value: "Relire le contrat" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ajouter la tache" }));

    expect(
      await screen.findByText("Impossible de creer la tache."),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Permission manquante: task.create"),
    ).toBeInTheDocument();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("falls back to a generic description when the API rejects without an Error instance", async () => {
    apiMocks.createTask.mockRejectedValue("offline");

    renderForm("group-incorporation");

    fireEvent.change(screen.getByPlaceholderText("Deposer le dossier"), {
      target: { value: "Relire le contrat" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ajouter la tache" }));

    expect(
      await screen.findByText("Impossible de creer la tache."),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(
        "La tache n'a pas pu etre synchronisee, reessayez dans quelques instants.",
      ),
    ).toBeInTheDocument();
    expect(router.push).not.toHaveBeenCalled();
  });
});
