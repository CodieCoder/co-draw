import { Module, type DynamicModule } from "@nestjs/common";
import type { ApiConfiguration } from "@vega/config/api";
import { createPool } from "@vega/database";
import { createStorageClient } from "./storage-readiness.js";
import { HealthController } from "./health.controller.js";
import { DependencyLifecycle } from "./dependency-lifecycle.js";
import { API_CONFIGURATION, DB_POOL, STORAGE_CLIENT } from "./runtime-config.js";

@Module({})
export class AppModule {
  public static register(configuration: ApiConfiguration): DynamicModule {
    const pool = createPool(configuration.databaseUrl);
    const storageClient = createStorageClient({
      endpoint: configuration.objectStorageEndpoint,
      region: configuration.objectStorageRegion,
      accessKey: configuration.objectStorageAccessKey,
      secretKey: configuration.objectStorageSecretKey,
      forcePathStyle: configuration.objectStorageForcePathStyle,
    });

    return {
      module: AppModule,
      controllers: [HealthController],
      providers: [
        { provide: API_CONFIGURATION, useValue: configuration },
        { provide: DB_POOL, useValue: pool },
        { provide: STORAGE_CLIENT, useValue: storageClient },
        DependencyLifecycle,
      ],
    };
  }
}
