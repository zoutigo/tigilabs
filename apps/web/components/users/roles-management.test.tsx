import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Permission, Role } from "@tigilabs/types";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "../ui/toast";
import { RolesManagement } from "./roles-management";

const apiMocks = vi.hoisted(() => ({
  createRole: vi.fn(),
  setRolePermissions: vi.fn(),
  updateRole: vi.fn(),
}));

const setRoles = vi.hoisted(() => vi.fn());

const userManage: Permission = {
  action: "manage",
  id: "perm-user-manage",
  subject: "user",
};

const roleManage: Permission = {
  action: "manage",
  id: "perm-role-manage",
  subject: "role",
};

const adminRole: Role = {
  description: "Acces complet",
  id: "role-admin",
  name: "ADMIN",
  permissions: [{ permission: userManage }, { permission: roleManage }],
};

const managerRole: Role = {
  description: "Gestion des taches",
  id: "role-manager",
  name: "MANAGER",
  permissions: [],
};

const permissionsList: Permission[] = [userManage, roleManage];
const rolesList: Role[] = [adminRole, managerRole];

vi.mock("../../hooks/use-users", () => ({
  usePermissions: () => ({ permissions: permissionsList }),
  useRoles: () => ({ roles: rolesList, setRoles }),
}));

vi.mock("../../lib/api/users", () => apiMocks);

function renderRoles() {
  return render(
    <ToastProvider>
      <RolesManagement />
    </ToastProvider>,
  );
}

describe("RolesManagement", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the permission matrix with existing role assignments", () => {
    renderRoles();

    expect(screen.getByLabelText("user.manage pour ADMIN")).toBeChecked();
    expect(screen.getByLabelText("user.manage pour MANAGER")).not.toBeChecked();
  });

  it("grants a permission to a role and persists the change", async () => {
    apiMocks.setRolePermissions.mockResolvedValue({
      ...managerRole,
      permissions: [{ permission: userManage }],
    });
    renderRoles();

    fireEvent.click(screen.getByLabelText("user.manage pour MANAGER"));

    await waitFor(() => {
      expect(apiMocks.setRolePermissions).toHaveBeenCalledWith("role-manager", [
        "perm-user-manage",
      ]);
    });
  });

  it("reverts the checkbox and shows an error toast when saving permissions fails", async () => {
    apiMocks.setRolePermissions.mockRejectedValue(
      new Error("role.manage est protege."),
    );
    renderRoles();

    const checkbox = screen.getByLabelText(
      "role.manage pour ADMIN",
    ) as HTMLInputElement;

    fireEvent.click(checkbox);

    expect(
      await screen.findByText("La mise a jour des permissions a echoue."),
    ).toBeInTheDocument();
    expect(screen.getByText("role.manage est protege.")).toBeInTheDocument();
    await waitFor(() => {
      expect(checkbox.checked).toBe(true);
    });
  });

  it("creates a new role from the form", async () => {
    const created: Role = { id: "role-new", name: "SUPERVISOR" };
    apiMocks.createRole.mockResolvedValue(created);
    renderRoles();

    fireEvent.change(screen.getByLabelText("Nom du role"), {
      target: { value: "SUPERVISOR" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Creer le role/i }));

    await waitFor(() => {
      expect(apiMocks.createRole).toHaveBeenCalledWith({
        description: undefined,
        name: "SUPERVISOR",
      });
    });
    expect(
      await screen.findByText("Role SUPERVISOR cree."),
    ).toBeInTheDocument();
  });

  it("shows a validation error when creating a role without a name", async () => {
    renderRoles();

    fireEvent.click(screen.getByRole("button", { name: /Creer le role/i }));

    expect(
      await screen.findByText("Le nom est obligatoire."),
    ).toBeInTheDocument();
    expect(apiMocks.createRole).not.toHaveBeenCalled();
  });
});
