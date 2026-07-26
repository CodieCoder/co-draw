import { Controller, Post, Get, Param, Req, Res, Inject } from "@nestjs/common";
import { UseGuards } from "@nestjs/common";
import type { FastifyRequest, FastifyReply } from "fastify";
import type { Pool } from "pg";
import type { ApiConfiguration } from "@vega/config/api";
import { withClient } from "@vega/database";
import { CreateShareLinkRequestSchema } from "@vega/contracts/share-links";
import { DB_POOL, API_CONFIGURATION } from "../runtime-config.js";
import {
  isOpaqueToken,
  isUuid,
  sendApiError,
} from "../http-policy.js";
import { SessionGuard, OptionalSessionGuard } from "../session/session.guard.js";
import {
  acceptShareLink,
  createShareLink,
  resolveShareLink,
  ShareLinkCreationError,
} from "./share-links.service.js";

@Controller()
export class ShareLinksController {
  constructor(
    @Inject(DB_POOL) private readonly pool: Pool,
    @Inject(API_CONFIGURATION) private readonly config: ApiConfiguration,
  ) {}

  @Post("api/v1/rooms/:roomId/share-links")
  @UseGuards(SessionGuard)
  async create(
    @Param("roomId") roomId: string,
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    const body = req.body;
    const parsed = CreateShareLinkRequestSchema.safeParse(body ?? {});
    if (!parsed.success) {
      return sendApiError(req, res, 400, "VALIDATION_FAILED", "Invalid request body");
    }
    if (!isUuid(roomId)) {
      return sendApiError(req, res, 404, "ROOM_NOT_FOUND", "Room not found");
    }

    const session = req.vegaSession!;
    const baseUrl = this.config.allowedWebOrigins[0] ?? "http://localhost:5173";

    try {
      const link = await withClient(this.pool, (client) => {
        const opts: Parameters<typeof createShareLink>[1] = {
          roomId,
          guestId: session.guest.id,
          defaultRole: parsed.data.defaultRole,
          baseUrl,
        };
        if (parsed.data.expiresAt) opts.expiresAt = parsed.data.expiresAt;
        if (parsed.data.maxUses !== undefined) opts.maxUses = parsed.data.maxUses;
        return createShareLink(client, opts);
      });

      return res.status(201).send({ shareLink: link });
    } catch (error: unknown) {
      if (error instanceof ShareLinkCreationError) {
        if (error.reason === "forbidden") {
          return sendApiError(req, res, 403, "PERMISSION_DENIED", "Owner access is required");
        }
        if (error.reason === "archived") {
          return sendApiError(req, res, 409, "ROOM_ARCHIVED", "Room is archived");
        }
        return sendApiError(req, res, 404, "ROOM_NOT_FOUND", "Room not found");
      }
      return sendApiError(req, res, 500, "INTERNAL_ERROR", "Share link could not be created");
    }
  }

  @Get("api/v1/share-links/:token")
  @UseGuards(OptionalSessionGuard)
  async resolve(@Param("token") rawToken: string, @Req() req: FastifyRequest, @Res() res: FastifyReply) {
    if (!isOpaqueToken(rawToken)) {
      return sendApiError(req, res, 404, "SHARE_LINK_INVALID", "Share link is invalid or expired");
    }
    const result = await withClient(this.pool, (client) =>
      resolveShareLink(client, rawToken),
    );

    if (!result) {
      return sendApiError(req, res, 404, "SHARE_LINK_INVALID", "Share link is invalid or expired");
    }

    const hasSession = !!req.vegaSession;

    return res.status(200).send({
      room: {
        id: result.roomId,
        name: result.roomName,
        status: result.roomStatus,
      },
      invitation: {
        defaultRole: result.defaultRole,
        requiresGuestSession: !hasSession,
      },
    });
  }

  @Post("api/v1/share-links/:token/accept")
  @UseGuards(SessionGuard)
  async accept(@Param("token") rawToken: string, @Req() req: FastifyRequest, @Res() res: FastifyReply) {
    const session = req.vegaSession!;
    if (!isOpaqueToken(rawToken)) {
      return sendApiError(req, res, 404, "SHARE_LINK_INVALID", "Share link is invalid or expired");
    }

    try {
      const result = await withClient(this.pool, async (client) => {
        await client.query("BEGIN");
        try {
          const accepted = await acceptShareLink(client, {
            rawToken,
            guestId: session.guest.id,
          });
          await client.query("COMMIT");
          return accepted;
        } catch (err) {
          await client.query("ROLLBACK");
          throw err;
        }
      });

      if (!result) {
        return sendApiError(req, res, 404, "SHARE_LINK_INVALID", "Share link is invalid or expired");
      }

      return res.status(200).send({
        room: {
          id: result.roomId,
          name: result.roomName,
          status: result.roomStatus,
        },
        membership: {
          role: result.role,
        },
      });
    } catch {
      return sendApiError(req, res, 500, "INTERNAL_ERROR", "Share link could not be accepted");
    }
  }
}
