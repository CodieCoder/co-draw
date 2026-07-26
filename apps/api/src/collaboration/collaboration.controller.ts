import { Controller, Get, Param, Req, Res, Inject } from "@nestjs/common";
import { UseGuards } from "@nestjs/common";
import type { FastifyRequest, FastifyReply } from "fastify";
import type { Pool } from "pg";
import type { ApiConfiguration } from "@vega/config/api";
import { withClient } from "@vega/database";
import { signCollaborationToken } from "@vega/auth";
import {
  COLLABORATION_TOKEN_LIFETIME_MS,
  documentNameForRoom,
  collaborationModeForRole,
} from "@vega/contracts/collaboration-token";
import { SCHEMA_VERSION } from "@vega/collaboration-schema";
import { DB_POOL, API_CONFIGURATION } from "../runtime-config.js";
import { isUuid, sendApiError } from "../http-policy.js";
import { SessionGuard } from "../session/session.guard.js";
import { getRoomWithMembership } from "../room/room.service.js";

@Controller("api/v1/rooms/:roomId/collaboration")
export class CollaborationController {
  constructor(
    @Inject(DB_POOL) private readonly pool: Pool,
    @Inject(API_CONFIGURATION) private readonly config: ApiConfiguration,
  ) {}

  @Get()
  @UseGuards(SessionGuard)
  async bootstrap(
    @Param("roomId") roomId: string,
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    const session = req.vegaSession!;
    if (!isUuid(roomId)) {
      return sendApiError(req, res, 404, "ROOM_NOT_FOUND", "Room not found or access denied");
    }

    const result = await withClient(this.pool, (client) =>
      getRoomWithMembership(client, { roomId, guestId: session.guest.id }),
    );

    if (!result) {
      return sendApiError(req, res, 404, "ROOM_NOT_FOUND", "Room not found or access denied");
    }

    const { room, membership } = result;
    if (room.status !== "active") {
      return sendApiError(req, res, 409, "ROOM_ARCHIVED", "Room is archived");
    }
    const role = membership.role as "owner" | "editor" | "viewer";
    const mode = collaborationModeForRole(role);

    const now = Date.now();
    const claims = {
      version: 1 as const,
      sessionId: session.sessionId,
      guestId: session.guest.id,
      roomId,
      role,
      mode,
      issuedAt: now,
      expiresAt: now + COLLABORATION_TOKEN_LIFETIME_MS,
    };

    const accessToken = signCollaborationToken(claims, this.config.collaborationSigningSecret);

    const documentName = documentNameForRoom(roomId);

    return res.status(200).send({
      room: {
        id: room.id,
        status: room.status,
      },
      guest: {
        id: session.guest.id,
        username: session.guest.username,
        colour: session.guest.colour,
      },
      access: {
        role,
        mode,
      },
      collaboration: {
        documentName,
        websocketUrl: this.config.collaborationUrl,
        accessToken,
        expiresAt: new Date(now + COLLABORATION_TOKEN_LIFETIME_MS).toISOString(),
        schemaVersion: SCHEMA_VERSION,
      },
    });
  }
}
