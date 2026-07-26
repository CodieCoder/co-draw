import type { WebConfiguration } from "@vega/config/web";

import type { CanvasInspectionSnapshot, CanvasTestApi } from "./types.js";

export const installCanvasTestApi = (configuration: WebConfiguration): void => {
  const createSnapshot = (): CanvasInspectionSnapshot => ({
    schemaVersion: 1 as const,
    runtime: {
      profile: configuration.profile,
      releaseId: configuration.releaseId,
    },
    canvas: { status: "not-mounted" },
    room: null,
    scene: null,
    collaboration: { status: "not-configured" },
    persistence: { status: "not-configured" },
  });

  const api: CanvasTestApi = {
    inspect() {
      return Object.freeze(createSnapshot());
    },
  };

  Object.defineProperty(globalThis, "__CANVAS_TEST_API__", {
    value: Object.freeze(api),
    writable: false,
    configurable: false,
  });
};
