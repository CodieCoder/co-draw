import {
  Inject,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from "@nestjs/common";
import type { ApiConfiguration } from "@vega/config/api";
import type { FastifyRequest, FastifyReply } from "fastify";
import type { Pool } from "pg";
import { withClient } from "@vega/database";
import { SESSION_COOKIE, resolveSession } from "./session.service.js";
import type { ResolvedSession } from "./session.service.js";
import { API_CONFIGURATION, DB_POOL } from "../runtime-config.js";
import {
  buildClearedSessionCookie,
  sendApiError,
} from "../http-policy.js";

declare module "fastify" {
  interface FastifyRequest {
    vegaSession?: ResolvedSession;
  }
}

export const SESSION_REQUEST_KEY = "vegaSession";

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    @Inject(DB_POOL) private readonly pool: Pool,
    @Inject(API_CONFIGURATION) private readonly configuration: ApiConfiguration,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const reply = context.switchToHttp().getResponse<FastifyReply>();

    const rawToken = this.extractToken(request);
    if (!rawToken) {
      sendApiError(request, reply, 401, "SESSION_INVALID", "Session is required");
      return false;
    }

    const session = await withClient(this.pool, (client) =>
      resolveSession(client, rawToken),
    );

    if (!session) {
      reply.header("Set-Cookie", buildClearedSessionCookie(this.configuration));
      sendApiError(
        request,
        reply,
        401,
        "SESSION_EXPIRED",
        "Session is invalid or expired",
      );
      return false;
    }

    request.vegaSession = session;
    return true;
  }

  private extractToken(request: FastifyRequest): string | null {
    const cookie = request.headers.cookie;
    if (!cookie) return null;

    const match = cookie.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]*)`));
    return match?.[1] ?? null;
  }
}

@Injectable()
export class OptionalSessionGuard implements CanActivate {
  constructor(
    @Inject(DB_POOL) private readonly pool: Pool,
    @Inject(API_CONFIGURATION) private readonly configuration: ApiConfiguration,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();

    const rawToken = this.extractToken(request);
    if (!rawToken) return true;

    const session = await withClient(this.pool, (client) =>
      resolveSession(client, rawToken),
    );

    if (session) {
      request.vegaSession = session;
    } else {
      const reply = context.switchToHttp().getResponse<FastifyReply>();
      reply.header("Set-Cookie", buildClearedSessionCookie(this.configuration));
    }

    return true;
  }

  private extractToken(request: FastifyRequest): string | null {
    const cookie = request.headers.cookie;
    if (!cookie) return null;

    const match = cookie.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]*)`));
    return match?.[1] ?? null;
  }
}
