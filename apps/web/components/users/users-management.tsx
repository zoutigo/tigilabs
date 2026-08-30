"use client";

import { Users as UsersIcon } from "lucide-react";
import { useEffect, useState } from "react";
import type { User, UserStatus } from "@tigilabs/types";
import { useRoles, useUsers } from "../../hooks/use-users";
import { updateUser } from "../../lib/api/users";
import { Button } from "../ui/button";
import { useToast } from "../ui/toast";

const statusOptions: Array<{ label: string; value: UserStatus }> = [
  { label: "Actif", value: "ACTIVE" },
  { label: "Invite", value: "INVITED" },
  { label: "Desactive", value: "DISABLED" },
];

export function UsersManagement() {
  const { users: loadedUsers } = useUsers();
  const { roles } = useRoles();
  const [users, setUsers] = useState<User[]>(loadedUsers);
  const { toast } = useToast();

  useEffect(() => {
    setUsers(loadedUsers);
  }, [loadedUsers]);

  async function handleStatusChange(user: User, status: UserStatus) {
    const previous = user.status;
    setUsers((current) =>
      current.map((item) => (item.id === user.id ? { ...item, status } : item)),
    );

    try {
      await updateUser(user.id, { status });
      toast({
        title: `Statut de ${user.name} mis a jour.`,
        variant: "success",
      });
    } catch (error) {
      setUsers((current) =>
        current.map((item) =>
          item.id === user.id ? { ...item, status: previous } : item,
        ),
      );
      toast({
        description: error instanceof Error ? error.message : undefined,
        title: "La mise a jour du statut a echoue.",
        variant: "error",
      });
    }
  }

  async function handleApprove(user: User) {
    const previous = user.status;
    setUsers((current) =>
      current.map((item) =>
        item.id === user.id ? { ...item, status: "ACTIVE" } : item,
      ),
    );

    try {
      await updateUser(user.id, { status: "ACTIVE" });
      toast({
        title: `${user.name} peut maintenant se connecter.`,
        variant: "success",
      });
    } catch (error) {
      setUsers((current) =>
        current.map((item) =>
          item.id === user.id ? { ...item, status: previous } : item,
        ),
      );
      toast({
        description: error instanceof Error ? error.message : undefined,
        title: "La validation du compte a echoue.",
        variant: "error",
      });
    }
  }

  async function handleRoleChange(user: User, roleName: string) {
    const previousRoles = user.roles;
    const previousRole = user.role;
    const nextRoles = roleName ? [roleName] : [];
    setUsers((current) =>
      current.map((item) =>
        item.id === user.id
          ? { ...item, role: roleName || undefined, roles: nextRoles }
          : item,
      ),
    );

    try {
      await updateUser(user.id, { roles: nextRoles });
      toast({ title: `Role de ${user.name} mis a jour.`, variant: "success" });
    } catch (error) {
      setUsers((current) =>
        current.map((item) =>
          item.id === user.id
            ? { ...item, role: previousRole, roles: previousRoles }
            : item,
        ),
      );
      toast({
        description: error instanceof Error ? error.message : undefined,
        title: "La mise a jour du role a echoue.",
        variant: "error",
      });
    }
  }

  return (
    <section className="card">
      <div className="panel-heading">
        <h3>
          <UsersIcon size={18} />
          Utilisateurs
        </h3>
        <span className="badge badge-neutral">{users.length} comptes</span>
      </div>

      <div className="task-table-wrap">
        <table className="task-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Prenom</th>
              <th>Email</th>
              <th>Statut</th>
              <th>Validation</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <strong>{user.lastName ?? user.name}</strong>
                </td>
                <td data-label="Prenom">{user.firstName ?? "-"}</td>
                <td data-label="Email">{user.email}</td>
                <td data-label="Statut">
                  <select
                    aria-label={`Statut de ${user.name}`}
                    onChange={(event) =>
                      handleStatusChange(user, event.target.value as UserStatus)
                    }
                    value={user.status}
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td data-label="Validation">
                  <ValidationCell onApprove={handleApprove} user={user} />
                </td>
                <td data-label="Role">
                  <select
                    aria-label={`Role de ${user.name}`}
                    onChange={(event) =>
                      handleRoleChange(user, event.target.value)
                    }
                    value={user.role ?? user.roles?.[0] ?? ""}
                  >
                    <option value="">Aucun</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.name}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ValidationCell({
  onApprove,
  user,
}: {
  onApprove: (user: User) => void;
  user: User;
}) {
  if (!user.emailVerifiedAt) {
    return <span className="badge badge-warning">Email non confirme</span>;
  }

  if (user.status === "DISABLED") {
    return <span className="badge badge-danger">Compte desactive</span>;
  }

  if (user.status === "ACTIVE") {
    return <span className="badge badge-success">Compte valide</span>;
  }

  return (
    <div className="validation-pending">
      <span className="badge badge-warning">En attente de validation</span>
      <Button onClick={() => onApprove(user)} type="button" variant="secondary">
        Valider
      </Button>
    </div>
  );
}
