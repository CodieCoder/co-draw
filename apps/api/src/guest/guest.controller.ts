import { randomUUID } from "node:crypto";
import { Controller, Post, Get, Delete, Req, Res } from "@nestjs/common";
import type { FastifyRequest, FastifyReply } from "fastify";
import type { Pool } from "pg";
import type { ApiConfiguration } from "@vega/config/api";
import { Inject } from "@nestjs/common";
import { withClient } from "@vega/database";
import { CreateGuestSessionRequestSchema } from "@vega/contracts/guest";
import { generateToken, hashToken } from "@vega/auth";
import { API_CONFIGURATION, DB_POOL } from "../runtime-config.js";
import {
  buildClearedSessionCookie,
  buildSessionCookie,
  sendApiError,
} from "../http-policy.js";
import {
  createGuestSession,
  revokeSession,
} from "../session/session.service.js";
import { SessionGuard, OptionalSessionGuard } from "../session/session.guard.js";
import { UseGuards } from "@nestjs/common";

@Controller("api/v1/guest-sessions")
export class GuestController {
  constructor(
    @Inject(DB_POOL) private readonly pool: Pool,
    @Inject(API_CONFIGURATION) private readonly configuration: ApiConfiguration,
  ) {}

  @Post()
  async create(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    const body = req.body;
    const parsed = CreateGuestSessionRequestSchema.safeParse(body);
    if (!parsed.success) {
      return sendApiError(
        req,
        res,
        400,
        "VALIDATION_FAILED",
        "Invalid request body",
      );
    }

    const { username, email } = parsed.data;
    const guestId = randomUUID();
    const sessionId = randomUUID();
    const rawToken = generateToken();
    const tokenHash = hashToken(rawToken);

    try {
      const session = await withClient(this.pool, async (client) => {
        await client.query("BEGIN");
        try {
          const created = await createGuestSession(client, {
            username,
            email,
            guestId,
            sessionId,
            tokenHash,
          });
          await client.query("COMMIT");
          return created;
        } catch (error) {
          await client.query("ROLLBACK");
          throw error;
        }
      });

      res.header("Set-Cookie", buildSessionCookie(rawToken, this.configuration));

      return res.status(201).send({
        guest: session.guest,
        session: { expiresAt: session.expiresAt },
      });
    } catch {
      return sendApiError(
        req,
        res,
        500,
        "INTERNAL_ERROR",
        "Guest session could not be created",
      );
    }
  }

  @Get("current")
  @UseGuards(SessionGuard)
  getCurrent(@Req() req: FastifyRequest) {
    const session = req.vegaSession!;
    return {
      guest: session.guest,
      session: { expiresAt: session.expiresAt },
    };
  }

  @Delete("current")
  @UseGuards(OptionalSessionGuard)
  async revokeCurrent(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    const session = req.vegaSession;
    if (session) {
      await withClient(this.pool, (client) => revokeSession(client, session.sessionId));
    }

    res.header("Set-Cookie", buildClearedSessionCookie(this.configuration));
    return res.status(204).send();
  }
}
