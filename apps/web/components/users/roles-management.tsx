"use client";

import { Plus, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { Role } from "@tigilabs/types";
import { usePermissions, useRoles } from "../../hooks/use-users";
import {
  createRole,
  setRolePermissions,
  updateRole,
} from "../../lib/api/users";
import { InlineNameField } from "../account/inline-name-field";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useToast } from "../ui/toast";

type RoleFormValues = {
  name: string;
  description?: string;
};

export function RolesManagement() {
  const { roles: loadedRoles, setRoles } = useRoles();
  const { permissions } = usePermissions();
  const [roles, setLocalRoles] = useState<Role[]>(loadedRoles);
  const [pendingRoleIds, setPendingRoleIds] = useState<Set<string>>(
    () => new Set(),
  );
  const { toast } = useToast();
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<RoleFormValues>({
    defaultValues: { description: "", name: "" },
  });

  useEffect(() => {
    setLocalRoles(loadedRoles);
  }, [loadedRoles]);

  function syncRoles(next: Role[]) {
    setLocalRoles(next);
    setRoles(next);
  }

  async function onCreateRole(values: RoleFormValues) {
    try {
      const created = await createRole({
        description: values.description || undefined,
        name: values.name,
      });
      syncRoles([...roles, created]);
      reset();
      toast({ title: `Role ${created.name} cree.`, variant: "success" });
    } catch (error) {
      toast({
        description: error instanceof Error ? error.message : undefined,
        title: "La creation du role a echoue.",
        variant: "error",
      });
    }
  }

  async function handleRename(role: Role, name: string) {
    const updated = await updateRole(role.id, { name });
    syncRoles(roles.map((item) => (item.id === role.id ? updated : item)));
  }

  async function handleTogglePermission(
    role: Role,
    permissionId: string,
    checked: boolean,
  ) {
    if (pendingRoleIds.has(role.id)) {
      return;
    }

    const currentIds = (role.permissions ?? []).map(
      ({ permission }) => permission.id,
    );
    const nextIds = checked
      ? Array.from(new Set([...currentIds, permissionId]))
      : currentIds.filter((id) => id !== permissionId);

    const previousRoles = roles;
    syncRoles(
      roles.map((item) =>
        item.id === role.id
          ? {
              ...item,
              permissions: permissions
                .filter((permission) => nextIds.includes(permission.id))
                .map((permission) => ({ permission })),
            }
          : item,
      ),
    );
    setPendingRoleIds((prev) => new Set(prev).add(role.id));

    try {
      const updated = await setRolePermissions(role.id, nextIds);
      syncRoles(
        previousRoles.map((item) => (item.id === role.id ? updated : item)),
      );
    } catch (error) {
      syncRoles(previousRoles);
      toast({
        description: error instanceof Error ? error.message : undefined,
        title: "La mise a jour des permissions a echoue.",
        variant: "error",
      });
    } finally {
      setPendingRoleIds((prev) => {
        const next = new Set(prev);
        next.delete(role.id);
        return next;
      });
    }
  }

  return (
    <div className="users-layout">
      <section className="users-list-panel">
        <div className="panel-heading">
          <h3>
            <ShieldCheck size={18} />
            Permissions par role
          </h3>
          <span className="badge badge-neutral">{roles.length} roles</span>
        </div>

        <div className="task-table-wrap">
          <table className="task-table">
            <thead>
              <tr>
                <th>Permission</th>
                {roles.map((role) => (
                  <th key={role.id}>{role.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissions.map((permission) => (
                <tr key={permission.id}>
                  <td>
                    <strong>
                      {permission.subject}.{permission.action}
                    </strong>
                    {permission.description ? (
                      <span className="muted">{permission.description}</span>
                    ) : null}
                  </td>
                  {roles.map((role) => {
                    const checked = (role.permissions ?? []).some(
                      ({ permission: rolePermission }) =>
                        rolePermission.id === permission.id,
                    );

                    return (
                      <td data-label={role.name} key={role.id}>
                        <input
                          aria-label={`${permission.subject}.${permission.action} pour ${role.name}`}
                          checked={checked}
                          disabled={pendingRoleIds.has(role.id)}
                          onChange={(event) =>
                            handleTogglePermission(
                              role,
                              permission.id,
                              event.target.checked,
                            )
                          }
                          type="checkbox"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <aside className="user-create-panel">
        <h3>
          <ShieldCheck size={18} />
          Renommer un role
        </h3>
        <div className="grid" style={{ gap: 12, marginBottom: 24 }}>
          {roles.map((role) => (
            <InlineNameField
              icon={ShieldCheck}
              key={role.id}
              label="Nom du role"
              onSave={(value) => handleRename(role, value)}
              successMessage="Role renomme."
              value={role.name}
            />
          ))}
        </div>

        <h3>
          <Plus size={18} />
          Nouveau role
        </h3>
        <form className="form" onSubmit={handleSubmit(onCreateRole)}>
          <Input
            error={errors.name?.message}
            label="Nom du role"
            placeholder="SUPERVISOR"
            {...register("name", { required: "Le nom est obligatoire." })}
          />
          <Input
            label="Description"
            placeholder="Role interne"
            {...register("description")}
          />
          <Button disabled={isSubmitting} type="submit">
            <Plus size={17} />
            Creer le role
          </Button>
        </form>
      </aside>
    </div>
  );
}
