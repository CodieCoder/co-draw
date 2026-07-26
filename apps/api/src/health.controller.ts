import { Controller, Get, HttpCode, HttpStatus, Inject } from "@nestjs/common";
import {
  createFoundationNotReady,
  createLiveness,
  type Liveness,
  type Readiness,
} from "@vega/contracts/health";
import type { ApiConfiguration } from "@vega/config/api";

import { API_CONFIGURATION } from "./runtime-config.js";

@Controller("health")
export class HealthController {
  public constructor(
    @Inject(API_CONFIGURATION)
    private readonly configuration: ApiConfiguration,
  ) {}

  @Get("live")
  @HttpCode(HttpStatus.OK)
  public live(): Liveness {
    return createLiveness("api", this.configuration.releaseId);
  }

  @Get("ready")
  @HttpCode(HttpStatus.SERVICE_UNAVAILABLE)
  public ready(): Readiness {
    return createFoundationNotReady("api", this.configuration.releaseId);
  }
}
