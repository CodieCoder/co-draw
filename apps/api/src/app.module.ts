import { Module, type DynamicModule } from "@nestjs/common";
import type { ApiConfiguration } from "@vega/config/api";

import { HealthController } from "./health.controller.js";
import { API_CONFIGURATION } from "./runtime-config.js";

@Module({})
export class AppModule {
  public static register(configuration: ApiConfiguration): DynamicModule {
    return {
      module: AppModule,
      controllers: [HealthController],
      providers: [
        {
          provide: API_CONFIGURATION,
          useValue: configuration,
        },
      ],
    };
  }
}
