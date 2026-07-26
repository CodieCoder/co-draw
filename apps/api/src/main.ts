import "reflect-metadata";

import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from "@nestjs/platform-fastify";
import {
  ConfigurationError,
  parseApiConfiguration,
} from "@vega/config/api";

import { AppModule } from "./app.module.js";

const bootstrap = async (): Promise<void> => {
  const configuration = parseApiConfiguration(process.env);
  const application = await NestFactory.create<NestFastifyApplication>(
    AppModule.register(configuration),
    new FastifyAdapter({
      logger: false,
      trustProxy: false,
    }),
    {
      logger: ["error", "warn"],
    },
  );

  application.enableCors({
    origin: [...configuration.allowedWebOrigins],
    credentials: true,
  });
  application.enableShutdownHooks();

  await application.listen(configuration.port, configuration.host);
  process.stdout.write(
    `${JSON.stringify({
      event: "service_started",
      service: "api",
      releaseId: configuration.releaseId,
      port: configuration.port,
    })}\n`,
  );
};

void bootstrap().catch((error: unknown) => {
  const failure =
    error instanceof ConfigurationError
      ? { code: error.code, issues: error.issues }
      : { code: "STARTUP_FAILED" };

  process.stderr.write(`${JSON.stringify(failure)}\n`);
  process.exitCode = 1;
});
