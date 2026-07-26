import type { ServerResponse } from "node:http";

import { Server } from "@hocuspocus/server";
import {
  ConfigurationError,
  parseCollaborationConfiguration,
} from "@vega/config/collaboration";
import {
  createLiveness,
  createReady,
  createNotReady,
} from "@vega/contracts/health";
import {
  createPool,
  endPool,
  probeDatabaseReadiness,
  probePersistenceReadiness,
} from "@vega/database";
import { SCHEMA_VERSION } from "@vega/collaboration-schema";

import { mapDatabaseReadiness } from "./health.js";
import { authenticateConnection, parseDocumentName } from "./auth.js";
import { loadSnapshot, persistSnapshot } from "./persistence.js";

const writeJson = (
  response: ServerResponse,
  statusCode: number,
  body: unknown,
): void => {
  const payload = JSON.stringify(body);
  response.writeHead(statusCode, {
    "cache-control": "no-store",
    "content-length": Buffer.byteLength(payload),
    "content-type": "application/json; charset=utf-8",
  });
  response.end(payload);
};

const stopHandledHook = (): Promise<never> => {
  // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
  return Promise.reject();
};

const bootstrap = async (): Promise<void> => {
  const configuration = parseCollaborationConfiguration(process.env);
  const pool = createPool(configuration.databaseUrl);

  const server = new Server({
    name: "vega-collaboration",
    address: configuration.host,
    port: configuration.port,
    quiet: true,
    stopOnSignals: false,
    maxUnauthenticatedQueueSize: 64 * 1_024,
    maxUnauthenticatedQueueMessages: 16,
    maxPendingDocuments: 1,
    debounce: 750,
    maxDebounce: 3_000,

    async onAuthenticate({ documentName, token, connectionConfig }) {
      const roomId = parseDocumentName(documentName);
      if (!roomId) {
        throw new Error("COLLAB_PERMISSION_DENIED");
      }

      if (!token) {
        throw new Error("COLLAB_SESSION_INVALID");
      }

      const authResult = await authenticateConnection(
        pool,
        configuration.collaborationSigningSecret,
        documentName,
        token,
      );

      if (!authResult.ok) {
        throw new Error(authResult.code);
      }

      connectionConfig.readOnly = authResult.claims.mode === "read-only";
      return { claims: authResult.claims };
    },

    async onLoadDocument({ documentName }) {
      const roomId = parseDocumentName(documentName);
      if (!roomId) {
        throw new Error("COLLAB_PERMISSION_DENIED");
      }

      try {
        const snapshot = await loadSnapshot(pool, roomId);
        if (!snapshot) {
          throw new Error("Missing collaboration document");
        }
        return snapshot;
      } catch {
        throw new Error("COLLAB_DOCUMENT_LOAD_FAILED");
      }
    },

    async onStoreDocument({ documentName, document }) {
      const roomId = parseDocumentName(documentName);
      if (!roomId) {
        throw new Error("COLLAB_PERMISSION_DENIED");
      }

      await persistSnapshot(pool, {
        roomId,
        ydoc: document,
        schemaVersion: SCHEMA_VERSION,
        excalidrawVersion: configuration.supportedExcalidrawVersion,
      });
    },

    async onRequest({ request, response }) {
      if (request.method === "GET" && request.url === "/health/live") {
        writeJson(
          response,
          200,
          createLiveness("collaboration", configuration.releaseId),
        );
        return stopHandledHook();
      }

      if (request.method === "GET" && request.url === "/health/ready") {
        const releaseId = configuration.releaseId;

        const dbResult = await probeDatabaseReadiness(pool);
        if (!dbResult.ready) {
          const { status, body } = mapDatabaseReadiness(releaseId, dbResult);
          writeJson(response, status, body);
          return stopHandledHook();
        }

        const persistenceResult = await probePersistenceReadiness(pool);
        if (!persistenceResult.ready) {
          writeJson(
            response,
            503,
            createNotReady("collaboration", releaseId, "persistence", "PERSISTENCE_UNAVAILABLE"),
          );
          return stopHandledHook();
        }

        writeJson(response, 200, createReady("collaboration", releaseId));
        return stopHandledHook();
      }

      response.writeHead(404, {
        "cache-control": "no-store",
        "content-length": "0",
      });
      response.end();
      return stopHandledHook();
    },
  });

  let shutdownPromise: Promise<void> | undefined;
  const shutdown = (): Promise<void> => {
    shutdownPromise ??= (async () => {
      await server.destroy();
      await endPool(pool);
    })();
    return shutdownPromise;
  };

  process.once("SIGINT", () => {
    void shutdown().catch(() => {
      process.exitCode = 1;
    });
  });
  process.once("SIGTERM", () => {
    void shutdown().catch(() => {
      process.exitCode = 1;
    });
  });

  await server.listen();
  process.stdout.write(
    `${JSON.stringify({
      event: "service_started",
      service: "collaboration",
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
