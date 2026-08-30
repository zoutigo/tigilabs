import { Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";
import { resolveClientIp } from "../utils/resolve-client-ip";

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    return resolveClientIp(
      req as unknown as Parameters<typeof resolveClientIp>[0],
    );
  }
}
