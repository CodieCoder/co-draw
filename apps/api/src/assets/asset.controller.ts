import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { S3Client } from "@aws-sdk/client-s3";
import type { ApiConfiguration } from "@vega/config/api";
import {
  CreateAssetRequestSchema,
  UploadAssetContentRequestSchema,
} from "@vega/contracts/assets";
import { withClient } from "@vega/database";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { Pool } from "pg";

import { isUuid, sendApiError } from "../http-policy.js";
import {
  API_CONFIGURATION,
  DB_POOL,
  STORAGE_CLIENT,
} from "../runtime-config.js";
import { SessionGuard } from "../session/session.guard.js";
import {
  AssetServiceError,
  completeImageAsset,
  createImageAsset,
  getImageAsset,
  readImageAssetContent,
  uploadImageAsset,
} from "./asset.service.js";

function sendAssetFailure(
  request: FastifyRequest,
  reply: FastifyReply,
  error: unknown,
) {
  if (!(error instanceof AssetServiceError)) {
    return sendApiError(
      request,
      reply,
      500,
      "INTERNAL_ERROR",
      "Asset operation failed",
    );
  }
  switch (error.reason) {
    case "not_found":
      return sendApiError(request, reply, 404, "ASSET_NOT_FOUND", "Asset not found");
    case "forbidden":
      return sendApiError(
        request,
        reply,
        403,
        "ASSET_ACCESS_DENIED",
        "Asset access denied",
      );
    case "archived":
      return sendApiError(
        request,
        reply,
        409,
        "ROOM_ARCHIVED",
        "Room is archived",
      );
    case "type":
      return sendApiError(
        request,
        reply,
        415,
        "ASSET_TYPE_UNSUPPORTED",
        "Image type is unsupported",
      );
    case "size":
      return sendApiError(
        request,
        reply,
        413,
        "ASSET_TOO_LARGE",
        "Image size is invalid or too large",
      );
    case "state":
      return sendApiError(
        request,
        reply,
        409,
        "ASSET_STATE_INVALID",
        "Asset is not ready for this operation",
      );
    case "storage":
      return sendApiError(
        request,
        reply,
        503,
        "ASSET_UPLOAD_FAILED",
        "Private image storage is unavailable",
      );
  }
}

@Controller("api/v1/rooms/:roomId/assets")
@UseGuards(SessionGuard)
export class AssetController {
  constructor(
    @Inject(DB_POOL) private readonly pool: Pool,
    @Inject(STORAGE_CLIENT) private readonly storage: S3Client,
    @Inject(API_CONFIGURATION)
    private readonly configuration: ApiConfiguration,
  ) {}

  @Post()
  async create(
    @Param("roomId") roomId: string,
    @Body() body: unknown,
    @Req() request: FastifyRequest,
    @Res() reply: FastifyReply,
  ) {
    if (!isUuid(roomId)) {
      return sendApiError(request, reply, 404, "ROOM_NOT_FOUND", "Room not found");
    }
    const parsed = CreateAssetRequestSchema.safeParse(body ?? {});
    if (!parsed.success) {
      return sendApiError(
        request,
        reply,
        400,
        "VALIDATION_FAILED",
        "Invalid image metadata",
      );
    }

    try {
      const asset = await withClient(this.pool, (client) =>
        createImageAsset(client, {
          roomId,
          guestId: request.vegaSession!.guest.id,
          mimeType: parsed.data.mimeType,
          sizeBytes: parsed.data.sizeBytes,
          ...(parsed.data.originalFilename
            ? { originalFilename: parsed.data.originalFilename }
            : {}),
        }),
      );
      return reply.status(201).send({
        asset,
        upload: {
          method: "API_PROXY",
          endpoint: `/api/v1/rooms/${roomId}/assets/${asset.id}/content`,
        },
      });
    } catch (error: unknown) {
      return sendAssetFailure(request, reply, error);
    }
  }

  @Post(":assetId/content")
  async upload(
    @Param("roomId") roomId: string,
    @Param("assetId") assetId: string,
    @Body() body: unknown,
    @Req() request: FastifyRequest,
    @Res() reply: FastifyReply,
  ) {
    if (!isUuid(roomId) || !isUuid(assetId)) {
      return sendApiError(request, reply, 404, "ASSET_NOT_FOUND", "Asset not found");
    }
    const parsed = UploadAssetContentRequestSchema.safeParse(body ?? {});
    if (!parsed.success) {
      return sendApiError(
        request,
        reply,
        400,
        "VALIDATION_FAILED",
        "Invalid image content",
      );
    }
    try {
      const asset = await withClient(this.pool, (client) =>
        uploadImageAsset(
          client,
          this.storage,
          this.configuration.objectStorageBucket,
          {
            roomId,
            assetId,
            guestId: request.vegaSession!.guest.id,
            dataUrl: parsed.data.dataUrl,
          },
        ),
      );
      return reply.status(200).send({ asset });
    } catch (error: unknown) {
      return sendAssetFailure(request, reply, error);
    }
  }

  @Post(":assetId/complete")
  async complete(
    @Param("roomId") roomId: string,
    @Param("assetId") assetId: string,
    @Req() request: FastifyRequest,
    @Res() reply: FastifyReply,
  ) {
    if (!isUuid(roomId) || !isUuid(assetId)) {
      return sendApiError(request, reply, 404, "ASSET_NOT_FOUND", "Asset not found");
    }
    try {
      const asset = await withClient(this.pool, (client) =>
        completeImageAsset(
          client,
          this.storage,
          this.configuration.objectStorageBucket,
          {
            roomId,
            assetId,
            guestId: request.vegaSession!.guest.id,
          },
        ),
      );
      return reply.status(200).send({ asset });
    } catch (error: unknown) {
      return sendAssetFailure(request, reply, error);
    }
  }

  @Get(":assetId")
  async getMetadata(
    @Param("roomId") roomId: string,
    @Param("assetId") assetId: string,
    @Req() request: FastifyRequest,
    @Res() reply: FastifyReply,
  ) {
    if (!isUuid(roomId) || !isUuid(assetId)) {
      return sendApiError(request, reply, 404, "ASSET_NOT_FOUND", "Asset not found");
    }
    try {
      const result = await withClient(this.pool, (client) =>
        getImageAsset(client, {
          roomId,
          assetId,
          guestId: request.vegaSession!.guest.id,
        }),
      );
      return reply.status(200).send({ asset: result.public });
    } catch (error: unknown) {
      return sendAssetFailure(request, reply, error);
    }
  }

  @Get(":assetId/content")
  async getContent(
    @Param("roomId") roomId: string,
    @Param("assetId") assetId: string,
    @Req() request: FastifyRequest,
    @Res() reply: FastifyReply,
  ) {
    if (!isUuid(roomId) || !isUuid(assetId)) {
      return sendApiError(request, reply, 404, "ASSET_NOT_FOUND", "Asset not found");
    }
    try {
      const result = await withClient(this.pool, (client) =>
        readImageAssetContent(
          client,
          this.storage,
          this.configuration.objectStorageBucket,
          {
            roomId,
            assetId,
            guestId: request.vegaSession!.guest.id,
          },
        ),
      );
      return reply
        .header("cache-control", "private, max-age=300")
        .header("content-type", result.mimeType)
        .header("content-length", result.body.byteLength)
        .status(200)
        .send(result.body);
    } catch (error: unknown) {
      return sendAssetFailure(request, reply, error);
    }
  }
}

