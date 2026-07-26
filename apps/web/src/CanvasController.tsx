import { useRef, useCallback, useEffect, useState } from "react";
import * as Y from "yjs";
import {
  Excalidraw,
  MainMenu,
  serializeAsJSON,
} from "@vega/excalidraw-adapter/excalidraw";
import type { ExcalidrawImperativeAPI } from "@vega/excalidraw-adapter/excalidraw";
import { ExcalidrawAdapter } from "@vega/excalidraw-adapter";
import type { ElementRecord } from "@vega/excalidraw-adapter";
import { SUPPORTED_EXCALIDRAW_VERSION } from "@vega/excalidraw-adapter";
import { updateCanvasTestState } from "./canvas-test-api/state.js";
import type { SceneInfo } from "./canvas-test-api/types.js";

export interface CanvasControllerProps {
  ydoc?: Y.Doc | null;
}

function redactedScene(elements: readonly ElementRecord[]): SceneInfo {
  const active = elements.filter((element) => element.isDeleted !== true);
  return {
    elementCount: active.length,
    elementTypes: active.map((element) => String(element.type)),
    order: active.map((element) => String(element.id)),
    elements: active.map((element) => ({
      id: String(element.id),
      type: String(element.type),
      x: Number(element.x),
      y: Number(element.y),
      width: Number(element.width),
      height: Number(element.height),
      isDeleted: false,
    })),
  };
}

export function CanvasController({ ydoc: externalYdoc }: CanvasControllerProps) {
  const adapterRef = useRef<ExcalidrawAdapter | null>(null);
  const excalidrawAPIRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const readyRef = useRef(false);
  const [, forceUpdate] = useState(0);

  const applyProjection = useCallback(
    (projection: ReturnType<ExcalidrawAdapter["reconstructScene"]>) => {
      const records = projection.elements.map((element) => ({ ...element }));
      updateCanvasTestState({
        adapterElementCount: records.length,
        scene: redactedScene(records),
      });
      const api = excalidrawAPIRef.current;
      if (api) {
        // Excalidraw validates the adapter-normalized records at its imperative boundary.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        (api as any).updateScene({ elements: records });
      }
    },
    [],
  );

  const excalidrawAPICallback = useCallback(
    (api: ExcalidrawImperativeAPI) => {
      excalidrawAPIRef.current = api;
      const adapter = adapterRef.current;
      if (adapter) {
        applyProjection(adapter.reconstructScene());
      }
    },
    [applyProjection],
  );

  useEffect(() => {
    updateCanvasTestState({
      excalidrawVersion: SUPPORTED_EXCALIDRAW_VERSION,
    });
  }, []);


  useEffect(() => {
    const ydoc = externalYdoc ?? new Y.Doc();
    const ownsDocument = externalYdoc == null;
    readyRef.current = true;
    forceUpdate((n) => n + 1);

    const adapter = new ExcalidrawAdapter({
      ydoc,
      onSceneApplied: (projection) => {
        applyProjection(projection);
      },
    });

    adapter.startObserving();
    adapterRef.current = adapter;

    const initialProjection = adapter.reconstructScene();
    applyProjection(initialProjection);
    updateCanvasTestState({
      canvasStatus: "mounted",
      adapterElementCount: initialProjection.elements.length,
    });

    return () => {
      adapter.stopObserving();
      adapterRef.current = null;
      if (ownsDocument) {
        ydoc.destroy();
      }
      updateCanvasTestState({
        canvasStatus: "not-mounted",
        adapterElementCount: 0,
        scene: null,
      });
    };
  }, [applyProjection, externalYdoc]);

  const handleChange = useCallback(
    (elements: readonly { id: string; type: string }[]) => {
      const adapter = adapterRef.current;
      if (!adapter || adapter.isRemoteApplying) return;
      const records = elements.map((el) => {
        const record: Record<string, unknown> = {};
        const entries = Object.entries(el as Record<string, unknown>);
        for (const [key, value] of entries) {
          record[key] = value;
        }
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        return record as unknown as ElementRecord;
      });
      adapter.publishLocalScene(records);

      updateCanvasTestState({
        adapterElementCount: elements.length,
        scene: redactedScene(records),
      });
    },
    [],
  );

  const exportSceneJson = useCallback(() => {
    const api = excalidrawAPIRef.current;
    if (!api) return;

    const sceneJson = serializeAsJSON(
      api.getSceneElementsIncludingDeleted(),
      api.getAppState(),
      api.getFiles(),
      "local",
    );
    const objectUrl = URL.createObjectURL(
      new Blob([sceneJson], { type: "application/json" }),
    );
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `vega-canvas-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  }, []);

  if (!readyRef.current) {
    return <div>Initializing canvas...</div>;
  }

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Excalidraw
        excalidrawAPI={excalidrawAPICallback}
        onChange={handleChange}
        UIOptions={{
          canvasActions: {
            changeViewBackgroundColor: false,
            clearCanvas: false,
            export: false,
            loadScene: false,
            saveToActiveFile: false,
            toggleTheme: null,
            saveAsImage: false,
          },
        }}
      >
        <MainMenu>
          <MainMenu.Item onSelect={exportSceneJson}>
            Export scene JSON
          </MainMenu.Item>
          <MainMenu.DefaultItems.Help />
        </MainMenu>
      </Excalidraw>
    </div>
  );
}
