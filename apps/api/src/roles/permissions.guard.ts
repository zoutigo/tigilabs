import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permissions = this.reflector.getAllAndOverride<string[]>(
      "permissions",
      [context.getHandler(), context.getClass()],
    );

    if (!permissions?.length) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: { permissions?: string[] } }>();
    const missing = permissions.filter(
      (permission) => !request.user?.permissions?.includes(permission),
    );

    if (missing.length) {
      throw new ForbiddenException(
        `Permission manquante: ${missing.join(", ")}`,
      );
    }

    return true;
  }
}
