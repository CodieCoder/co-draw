import { connect } from "node:net";

import {
  withIsolatedTestStack,
} from "./testing/isolated-stack.mjs";

const proveUpgradeRejected = (collaborationPort, webPort) =>
  new Promise((resolve, reject) => {
    const socket = connect(
      { host: "127.0.0.1", port: collaborationPort },
      () => {
        socket.write(
          [
            "GET /integration-room HTTP/1.1",
            `Host: 127.0.0.1:${collaborationPort}`,
            "Connection: Upgrade",
            "Upgrade: websocket",
            "Sec-WebSocket-Version: 13",
            "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==",
            `Origin: http://127.0.0.1:${webPort}`,
            "",
            "",
          ].join("\r\n"),
        );
      },
    );
    let response = "";
    socket.setEncoding("utf8");
    socket.setTimeout(5_000);
    socket.on("data", (chunk) => {
      response += chunk;
    });
    socket.once("error", reject);
    socket.once("timeout", () => {
      socket.destroy();
      reject(new Error("Collaboration upgrade rejection timed out."));
    });
    socket.once("close", () => {
      if (
        response.startsWith("HTTP/1.1 403") &&
        response.includes("COLLAB_PERMISSION_DENIED")
      ) {
        resolve();
      } else {
        reject(new Error("Collaboration upgrade did not fail closed."));
      }
    });
  });

await withIsolatedTestStack(
  { suite: "foundation" },
  async (stack) => {
    process.stdout.write(
      `Starting isolated Stage 0B integration project ${stack.projectName}.\n`,
    );
    await stack.build();
    await stack.startInfrastructure();
    await stack.initializeInfrastructure(2);
    await stack.migrate(2);
    await stack.migrateStatus();
    await stack.runInfrastructureCheck();
    await stack.startApplications();

    const [apiRoute, collaborationRoute] = await Promise.all([
      fetch(`${stack.apiUrl}/api/v1/rooms`),
      fetch(`${stack.collaborationUrl}/rooms`),
    ]);
    if (apiRoute.status !== 404 || collaborationRoute.status !== 404) {
      throw new Error("An unplanned domain route is available.");
    }
    await proveUpgradeRejected(
      stack.ports.collaboration,
      stack.ports.web,
    );

    await stack.stopInfrastructureService("postgres");
    await Promise.all([
      stack.exactHealth(
        `${stack.apiUrl}/health/live`,
        200,
        stack.liveBody("api"),
      ),
      stack.exactHealth(
        `${stack.collaborationUrl}/health/live`,
        200,
        stack.liveBody("collaboration"),
      ),
      stack.exactHealth(
        `${stack.apiUrl}/health/ready`,
        503,
        stack.notReadyBody(
          "api",
          "database",
          "DATABASE_UNAVAILABLE",
        ),
      ),
      stack.exactHealth(
        `${stack.collaborationUrl}/health/ready`,
        503,
        stack.notReadyBody(
          "collaboration",
          "database",
          "DATABASE_UNAVAILABLE",
        ),
      ),
    ]);

    await stack.startInfrastructureService("postgres");
    await Promise.all([
      stack.exactHealth(
        `${stack.apiUrl}/health/ready`,
        200,
        stack.readyBody("api"),
      ),
      stack.exactHealth(
        `${stack.collaborationUrl}/health/ready`,
        200,
        stack.readyBody("collaboration"),
      ),
    ]);

    await stack.stopInfrastructureService("minio");
    await Promise.all([
      stack.exactHealth(
        `${stack.apiUrl}/health/live`,
        200,
        stack.liveBody("api"),
      ),
      stack.exactHealth(
        `${stack.apiUrl}/health/ready`,
        503,
        stack.notReadyBody(
          "api",
          "object_storage",
          "OBJECT_STORAGE_UNAVAILABLE",
        ),
      ),
      stack.exactHealth(
        `${stack.collaborationUrl}/health/ready`,
        200,
        stack.readyBody("collaboration"),
      ),
    ]);

    await stack.startInfrastructureService("minio");
    await stack.exactHealth(
      `${stack.apiUrl}/health/ready`,
      200,
      stack.readyBody("api"),
    );

    await stack.psql(
      `INSERT INTO public.pgmigrations (name, run_on)
       VALUES ('999_unknown', NOW())`,
    );
    await stack.migrateStatus([1], "ignore");
    await Promise.all([
      stack.exactHealth(
        `${stack.apiUrl}/health/ready`,
        503,
        stack.notReadyBody(
          "api",
          "schema",
          "SCHEMA_UNSUPPORTED",
        ),
      ),
      stack.exactHealth(
        `${stack.collaborationUrl}/health/ready`,
        503,
        stack.notReadyBody(
          "collaboration",
          "schema",
          "SCHEMA_UNSUPPORTED",
        ),
      ),
    ]);
    await stack.psql(
      "DELETE FROM public.pgmigrations WHERE name = '999_unknown'",
    );

    await stack.psql(
      `REVOKE INSERT ON TABLE public.collaboration_documents
       FROM ${stack.collaborationRole}`,
    );
    await stack.exactHealth(
      `${stack.collaborationUrl}/health/ready`,
      503,
      stack.notReadyBody(
        "collaboration",
        "persistence",
        "PERSISTENCE_UNAVAILABLE",
      ),
    );
    await stack.psql(
      `GRANT INSERT ON TABLE public.collaboration_documents
       TO ${stack.collaborationRole}`,
    );
    await stack.exactHealth(
      `${stack.collaborationUrl}/health/ready`,
      200,
      stack.readyBody("collaboration"),
    );

    process.stdout.write(
      "Stage 0B isolated integration checks passed: migration, privileges, privacy, exact health, interruption, and recovery.\n",
    );
  },
);
