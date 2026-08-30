import { describe, expect, it } from "vitest";
import {
  filterNavLinksByPermissions,
  isChildActive,
  privateNavLinks,
} from "./navigation";

describe("filterNavLinksByPermissions", () => {
  it("keeps every entry when the user holds every required permission", () => {
    const links = filterNavLinksByPermissions(privateNavLinks, [
      "user.manage",
      "role.manage",
    ]);
    const usersGroup = links.find((item) => item.id === "users");

    expect(usersGroup?.children?.map((child) => child.id)).toEqual([
      "users-list",
      "users-roles",
    ]);
  });

  it("drops the roles sub-link when the user only has user.manage", () => {
    const links = filterNavLinksByPermissions(privateNavLinks, ["user.manage"]);
    const usersGroup = links.find((item) => item.id === "users");

    expect(usersGroup?.children?.map((child) => child.id)).toEqual([
      "users-list",
    ]);
  });

  it("hides the whole users group for a user with no relevant permission", () => {
    const links = filterNavLinksByPermissions(privateNavLinks, ["task.create"]);

    expect(links.find((item) => item.id === "users")).toBeUndefined();
  });

  it("hides the users group when no permissions are provided at all", () => {
    const links = filterNavLinksByPermissions(privateNavLinks);

    expect(links.find((item) => item.id === "users")).toBeUndefined();
  });
});

describe("isChildActive for the users group", () => {
  const usersGroup = privateNavLinks.find((item) => item.id === "users");
  const [usersList, usersRoles] = usersGroup?.children ?? [];

  it("marks only the users list link active on /users", () => {
    expect(isChildActive("/users", usersList)).toBe(true);
    expect(isChildActive("/users", usersRoles)).toBe(false);
  });

  it("marks only the roles link active on /users/roles", () => {
    expect(isChildActive("/users/roles", usersList)).toBe(false);
    expect(isChildActive("/users/roles", usersRoles)).toBe(true);
  });

  it("marks the users list link active on a user detail page", () => {
    expect(isChildActive("/users/user-42", usersList)).toBe(true);
    expect(isChildActive("/users/user-42", usersRoles)).toBe(false);
  });
});
