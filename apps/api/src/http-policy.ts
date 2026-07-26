import type { ApiConfiguration } from "@vega/config/api";
import type { ApiErrorCode } from "@vega/contracts/errors";
import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { SESSION_COOKIE } from "./session/session.service.js";

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const OPAQUE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/u;

export const isUuid = (value: string): boolean => UUID_PATTERN.test(value);
export const isOpaqueToken = (value: string): boolean =>
  OPAQUE_TOKEN_PATTERN.test(value);

function requestIdFor(request: FastifyRequest): string {
  const candidate = String(request.id);
  return /^[A-Za-z0-9_-]{1,128}$/u.test(candidate) ? candidate : "unknown";
}

export function sendApiError(
  request: FastifyRequest,
  reply: FastifyReply,
  status: number,
  code: ApiErrorCode,
  message: string,
) {
  return reply.status(status).send({
    error: {
      code,
      message,
      requestId: requestIdFor(request),
    },
  });
}

export function buildSessionCookie(
  rawToken: string,
  configuration: ApiConfiguration,
): string {
  const secure = configuration.profile === "local" ? "" : "; Secure";
  return `${SESSION_COOKIE}=${rawToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400${secure}`;
}

export function buildClearedSessionCookie(
  configuration: ApiConfiguration,
): string {
  const secure = configuration.profile === "local" ? "" : "; Secure";
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

export function registerApiRequestPolicy(
  instance: FastifyInstance,
  configuration: ApiConfiguration,
): void {
  const allowedOrigins = new Set(configuration.allowedWebOrigins);

  instance.addHook("onRequest", async (request, reply) => {
    if (!MUTATION_METHODS.has(request.method)) {
      return;
    }

    const origin = request.headers.origin;
    if (!origin || !allowedOrigins.has(origin)) {
      await sendApiError(
        request,
        reply,
        403,
        "PERMISSION_DENIED",
        "Request origin is not allowed",
      );
      return reply;
    }

    const contentType = request.headers["content-type"];
    if (
      typeof contentType !== "string" ||
      !contentType.toLowerCase().startsWith("application/json")
    ) {
      await sendApiError(
        request,
        reply,
        400,
        "VALIDATION_FAILED",
        "Mutation requests must use application/json",
      );
      return reply;
    }
  });
}
