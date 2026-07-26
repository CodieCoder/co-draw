import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Res,
} from "@nestjs/common";
import type { FastifyReply } from "fastify";
import type { Pool } from "pg";
import type { S3Client } from "@aws-sdk/client-s3";
import type { ApiConfiguration } from "@vega/config/api";
import {
  createLiveness,
  createReady,
  createNotReady,
  type Liveness,
} from "@vega/contracts/health";
import { probeDatabaseReadiness } from "@vega/database";
import { probeStorageReadiness } from "./storage-readiness.js";
import { API_CONFIGURATION, DB_POOL, STORAGE_CLIENT } from "./runtime-config.js";

@Controller("health")
export class HealthController {
  public constructor(
    @Inject(API_CONFIGURATION)
    private readonly configuration: ApiConfiguration,
    @Inject(DB_POOL)
    private readonly pool: Pool,
    @Inject(STORAGE_CLIENT)
    private readonly storageClient: S3Client,
  ) {}

  @Get("live")
  @HttpCode(HttpStatus.OK)
  public live(): Liveness {
    return createLiveness("api", this.configuration.releaseId);
  }

  @Get("ready")
  public async ready(@Res() reply: FastifyReply): Promise<void> {
    const releaseId = this.configuration.releaseId;

    // Deterministic readiness: DB → schema → storage.
    const dbResult = await probeDatabaseReadiness(this.pool);
    if (!dbResult.ready) {
      const reason = dbResult.reason;
      if (reason === "connectivity") {
        return reply.status(HttpStatus.SERVICE_UNAVAILABLE).send(
          createNotReady("api", releaseId, "database", "DATABASE_UNAVAILABLE"),
        );
      }
      return reply.status(HttpStatus.SERVICE_UNAVAILABLE).send(
        createNotReady("api", releaseId, "schema", "SCHEMA_UNSUPPORTED"),
      );
    }

    const storageResult = await probeStorageReadiness(
      this.storageClient,
      this.configuration.objectStorageBucket,
    );
    if (!storageResult.ready) {
      return reply.status(HttpStatus.SERVICE_UNAVAILABLE).send(
        createNotReady(
          "api",
          releaseId,
          "object_storage",
          "OBJECT_STORAGE_UNAVAILABLE",
        ),
      );
    }

    return reply.status(HttpStatus.OK).send(createReady("api", releaseId));
  }
}
