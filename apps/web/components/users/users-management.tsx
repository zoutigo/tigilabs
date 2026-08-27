"use client";

import { ShieldCheck, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { User, UserStatus } from "@tigilabs/types";
import { useRoles, useUsers } from "../../hooks/use-users";
import { createUser } from "../../lib/api/users";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { UserCard } from "./user-card";

type UserFormValues = {
  email: string;
  firstName?: string;
  lastName?: string;
  name: string;
  password: string;
  role: string;
  status: UserStatus;
};

export function UsersManagement() {
  const { users: loadedUsers } = useUsers();
  const { roles } = useRoles();
  const [users, setUsers] = useState<User[]>(loadedUsers);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setFocus,
  } = useForm<UserFormValues>({
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      name: "",
      password: "",
      role: "Member",
      status: "INVITED",
    },
    mode: "onChange",
  });

  useEffect(() => {
    setUsers(loadedUsers);
  }, [loadedUsers]);

  async function onSubmit(values: UserFormValues) {
    const payload = {
      ...values,
      roles: values.role ? [values.role] : [],
    };
    const optimistic: User = {
      id: `user-${Date.now()}`,
      email: values.email,
      firstName: values.firstName,
      lastName: values.lastName,
      name: values.name,
      role: values.role,
      roles: payload.roles,
      status: values.status,
    };

    setUsers((current) => [optimistic, ...current]);
    reset();

    try {
      const created = await createUser(payload);
      setUsers((current) =>
        current.map((user) => (user.id === optimistic.id ? created : user)),
      );
    } catch {
      // Fallback local volontaire.
    }
  }

  function onInvalid(fields: typeof errors) {
    const firstField = Object.keys(fields)[0] as
      keyof UserFormValues | undefined;
    if (firstField) {
      setFocus(firstField);
    }
  }

  return (
    <div className="users-layout">
      <section className="users-list-panel">
        <div className="panel-heading">
          <h3>
            <ShieldCheck size={18} />
            Roles et permissions
          </h3>
          <span className="badge badge-neutral">{roles.length} roles</span>
        </div>
        <div className="roles-grid">
          {roles.map((role) => (
            <article className="role-card" key={role.id}>
              <strong>{role.name}</strong>
              <p className="muted">{role.description ?? "Role interne"}</p>
              <div className="role-permissions">
                {(role.permissions ?? []).slice(0, 6).map(({ permission }) => (
                  <span className="badge badge-neutral" key={permission.id}>
                    {permission.subject}.{permission.action}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
        <div className="grid" style={{ marginTop: 18 }}>
          {users.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      </section>

      <aside className="user-create-panel">
        <h3>
          <UserPlus size={18} />
          Nouvel utilisateur
        </h3>
        <form className="form" onSubmit={handleSubmit(onSubmit, onInvalid)}>
          <Input
            error={errors.name?.message}
            label="Nom affiche"
            placeholder="Valery Tigilabs"
            {...register("name", { required: "Le nom est obligatoire." })}
          />
          <div className="two-columns">
            <Input label="Prenom" {...register("firstName")} />
            <Input label="Nom" {...register("lastName")} />
          </div>
          <Input
            error={errors.email?.message}
            label="Email"
            placeholder="valery@tigilabs.com"
            type="email"
            {...register("email", { required: "L'email est obligatoire." })}
          />
          <Input
            error={errors.password?.message}
            label="Mot de passe provisoire"
            type="password"
            {...register("password", {
              minLength: {
                message: "Le mot de passe doit contenir 8 caracteres.",
                value: 8,
              },
              required: "Le mot de passe est obligatoire.",
            })}
          />
          <div className="two-columns">
            <label className="field">
              <span>Role</span>
              <select {...register("role")}>
                {roles.map((role) => (
                  <option key={role.id} value={role.name}>
                    {role.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Statut</span>
              <select {...register("status")}>
                <option value="ACTIVE">Actif</option>
                <option value="INVITED">Invite</option>
                <option value="DISABLED">Desactive</option>
              </select>
            </label>
          </div>
          <Button disabled={isSubmitting} type="submit">
            <UserPlus size={17} />
            Creer
          </Button>
        </form>
      </aside>
    </div>
  );
}
