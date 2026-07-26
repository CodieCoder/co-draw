import type { ServerResponse } from "node:http";
import type { Socket } from "node:net";

import { Server } from "@hocuspocus/server";
import {
  ConfigurationError,
  parseCollaborationConfiguration,
} from "@vega/config/collaboration";
import {
  createFoundationNotReady,
  createLiveness,
} from "@vega/contracts/health";

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

const bootstrap = async (): Promise<void> => {
  const configuration = parseCollaborationConfiguration(process.env);
  const permissionDenied = (): Error & { readonly reason: string } =>
    Object.assign(new Error("Collaboration access is unavailable."), {
      reason: "COLLAB_PERMISSION_DENIED",
    });
  const stopHandledHook = (): Promise<never> => {
    // Hocuspocus uses an empty rejection as its documented sentinel for
    // "response handled; skip later hooks and the default handler".
    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
    return Promise.reject();
  };

  const server = new Server({
    name: "vega-collaboration",
    address: configuration.host,
    port: configuration.port,
    quiet: true,
    stopOnSignals: false,
    maxUnauthenticatedQueueSize: 64 * 1_024,
    maxUnauthenticatedQueueMessages: 16,
    maxPendingDocuments: 1,

    onAuthenticate() {
      // Authority and persistence arrive in FND-003. Until then, every
      // document request must stop before Hocuspocus creates a Yjs document.
      return stopHandledHook();
    },

    onUpgrade({ socket }) {
      // Reject the upgrade itself so an unauthenticated client cannot allocate
      // a pending room document while the Stage 0 authority path is absent.
      const upgradeSocket = socket as Socket;
      upgradeSocket.end(
        [
          "HTTP/1.1 403 Forbidden",
          "Connection: close",
          "Content-Type: text/plain; charset=utf-8",
          "Content-Length: 24",
          "",
          "COLLAB_PERMISSION_DENIED",
        ].join("\r\n"),
      );
      return Promise.reject(permissionDenied());
    },

    onRequest({ request, response }) {
      if (request.method === "GET" && request.url === "/health/live") {
        writeJson(
          response,
          200,
          createLiveness("collaboration", configuration.releaseId),
        );
        return stopHandledHook();
      }

      if (request.method === "GET" && request.url === "/health/ready") {
        writeJson(
          response,
          503,
          createFoundationNotReady(
            "collaboration",
            configuration.releaseId,
          ),
        );
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

  const shutdown = async (): Promise<void> => {
    await server.destroy();
  };

  process.once("SIGINT", () => {
    void shutdown();
  });
  process.once("SIGTERM", () => {
    void shutdown();
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
