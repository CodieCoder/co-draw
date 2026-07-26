import {
  Inject,
  Injectable,
  type OnApplicationShutdown,
} from "@nestjs/common";
import type { S3Client } from "@aws-sdk/client-s3";
import type { Pool } from "pg";

import { endPool } from "@vega/database";

import { DB_POOL, STORAGE_CLIENT } from "./runtime-config.js";

@Injectable()
export class DependencyLifecycle implements OnApplicationShutdown {
  private closed = false;

  public constructor(
    @Inject(DB_POOL) private readonly pool: Pool,
    @Inject(STORAGE_CLIENT) private readonly storageClient: S3Client,
  ) {}

  public async onApplicationShutdown(): Promise<void> {
    if (this.closed) {
      return;
    }
    this.closed = true;
    this.storageClient.destroy();
    await endPool(this.pool);
  }
}
