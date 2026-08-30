import type { User } from "@tigilabs/types";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function initialsFor(
  user: Pick<User, "firstName" | "lastName" | "name">,
) {
  const source =
    user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.name;

  const initials = source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "?";
}

export function roleLabelFor(user: Pick<User, "role" | "roles">) {
  return user.role ?? user.roles?.[0] ?? "Membre";
}

export function hasPermission(
  user: Pick<User, "permissions">,
  permission: string,
) {
  return user.permissions?.includes(permission) ?? false;
}
