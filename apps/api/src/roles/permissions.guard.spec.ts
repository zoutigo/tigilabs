import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PermissionsGuard } from "./permissions.guard";

function buildContext(userPermissions: string[] | undefined): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user: { permissions: userPermissions } }),
    }),
  } as unknown as ExecutionContext;
}

describe("PermissionsGuard", () => {
  function buildGuard(requiredPermissions: string[] | undefined) {
    const reflector = {
      getAllAndOverride: () => requiredPermissions,
    } as unknown as Reflector;

    return new PermissionsGuard(reflector);
  }

  it("allows the request when no permission is required", () => {
    const guard = buildGuard(undefined);

    expect(guard.canActivate(buildContext([]))).toBe(true);
  });

  it("allows the request when the user has every required permission", () => {
    const guard = buildGuard(["task.create"]);

    expect(
      guard.canActivate(buildContext(["task.create", "task.assign"])),
    ).toBe(true);
  });

  it("throws a ForbiddenException naming the missing permission", () => {
    const guard = buildGuard(["calendar.event.create"]);

    expect(() => guard.canActivate(buildContext(["task.create"]))).toThrow(
      ForbiddenException,
    );
    expect(() => guard.canActivate(buildContext(["task.create"]))).toThrow(
      "Permission manquante: calendar.event.create",
    );
  });

  it("throws naming only the permissions the user is missing", () => {
    const guard = buildGuard(["task.create", "task.assign"]);

    expect(() => guard.canActivate(buildContext(["task.create"]))).toThrow(
      "Permission manquante: task.assign",
    );
  });

  it("throws when the request has no authenticated user", () => {
    const guard = buildGuard(["task.create"]);

    expect(() => guard.canActivate(buildContext(undefined))).toThrow(
      ForbiddenException,
    );
  });
});
