import { Controller, Post, Get, Param, Req, Res, Inject } from "@nestjs/common";
import { UseGuards } from "@nestjs/common";
import type { FastifyRequest, FastifyReply } from "fastify";
import type { Pool } from "pg";
import { withClient } from "@vega/database";
import { CreateRoomRequestSchema, deriveCapabilities } from "@vega/contracts/room";
import { DB_POOL } from "../runtime-config.js";
import { isUuid, sendApiError } from "../http-policy.js";
import { SessionGuard } from "../session/session.guard.js";
import { createRoom, getRoomWithMembership } from "./room.service.js";

@Controller("api/v1/rooms")
export class RoomController {
  constructor(@Inject(DB_POOL) private readonly pool: Pool) {}

  @Post()
  @UseGuards(SessionGuard)
  async create(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    const body = req.body;
    const parsed = CreateRoomRequestSchema.safeParse(body ?? {});
    if (!parsed.success) {
      return sendApiError(req, res, 400, "VALIDATION_FAILED", "Invalid request body");
    }

    const session = req.vegaSession!;

    try {
      const result = await withClient(this.pool, async (client) => {
        await client.query("BEGIN");
        try {
          const createParams: { name?: string; guestId: string } = {
            guestId: session.guest.id,
          };
          if (parsed.data.name) {
            createParams.name = parsed.data.name;
          }
          const room = await createRoom(client, createParams);
          await client.query("COMMIT");
          return room;
        } catch (err) {
          await client.query("ROLLBACK");
          throw err;
        }
      });

      return res.status(201).send({
        room: {
          id: result.roomId,
          name: result.name,
          status: "active",
          role: "owner",
          createdAt: result.createdAt,
        },
      });
    } catch {
      return sendApiError(req, res, 500, "INTERNAL_ERROR", "Room could not be created");
    }
  }

  @Get(":roomId")
  @UseGuards(SessionGuard)
  async getRoom(@Param("roomId") roomId: string, @Req() req: FastifyRequest, @Res() res: FastifyReply) {
    const session = req.vegaSession!;
    if (!isUuid(roomId)) {
      return sendApiError(req, res, 404, "ROOM_NOT_FOUND", "Room not found");
    }

    const result = await withClient(this.pool, (client) =>
      getRoomWithMembership(client, { roomId, guestId: session.guest.id }),
    );

    if (!result) {
      return sendApiError(req, res, 404, "ROOM_NOT_FOUND", "Room not found");
    }

    const { room, membership } = result;
    const caps = deriveCapabilities(membership.role as "owner" | "editor" | "viewer");

    return res.status(200).send({
      room: {
        id: room.id,
        name: room.name,
        status: room.status,
        createdAt: room.created_at.toISOString(),
        updatedAt: room.updated_at.toISOString(),
        archivedAt: room.archived_at?.toISOString(),
      },
      membership: {
        guestId: membership.guest_id,
        role: membership.role,
      },
      capabilities: caps,
    });
  }
}
