import type { WebConfiguration } from "@vega/config/web";

import type {
  CanvasInspectionSnapshot,
  CanvasTestApi,
} from "./types.js";
import { canvasTestState as state } from "./state.js";

export const installCanvasTestApi = (configuration: WebConfiguration): void => {
  const createSnapshot = (): CanvasInspectionSnapshot => ({
    schemaVersion: 1 as const,
    runtime: {
      profile: configuration.profile,
      releaseId: configuration.releaseId,
    },
    canvas: {
      status: state.canvasStatus,
      ...(state.canvasStatus === "mounted"
        ? {
            adapter: {
              excalidrawVersion: state.excalidrawVersion,
              elementCount: state.adapterElementCount,
            },
          }
        : {}),
    },
    room: state.room,
    scene: state.scene,
    collaboration: {
      status: state.collaborationStatus,
      ...(state.collaborationDocumentName
        ? { documentName: state.collaborationDocumentName }
        : {}),
    },
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
