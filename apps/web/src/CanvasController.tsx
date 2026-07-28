import { useRef, useCallback, useEffect, useMemo, useState } from "react";
import type { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";
import {
  Excalidraw,
  MainMenu,
  serializeAsJSON,
} from "@vega/excalidraw-adapter/excalidraw";
import type {
  AppState,
  BinaryFiles,
  Collaborator,
  ExcalidrawImperativeAPI,
  SocketId,
} from "@vega/excalidraw-adapter/excalidraw";
import { ExcalidrawAdapter } from "@vega/excalidraw-adapter";
import type { ElementRecord } from "@vega/excalidraw-adapter";
import { SUPPORTED_EXCALIDRAW_VERSION } from "@vega/excalidraw-adapter";
import { ROOM_YJS_KEYS } from "@vega/collaboration-schema";
import {
  PhysicsController,
  ELIGIBLE_ELEMENT_TYPES,
  type ExcalidrawElementBounds,
  type PhysicsEngineStatus,
} from "@vega/canvas-extensions";
import { ImageAssetManager } from "./image-assets.js";
import { MiniMap } from "./MiniMap.js";
import type { MiniMapElement } from "./MiniMap.js";
import {
  PresenceController,
  type PresenceSnapshot,
  type PresenceViewport,
} from "./presence.js";
import { updateCanvasTestState } from "./canvas-test-api/state.js";
import type { SceneInfo } from "./canvas-test-api/types.js";
import "./CanvasController.css";

export interface CanvasControllerProps {
  ydoc?: Y.Doc | null;
  roomId?: string;
  provider?: HocuspocusProvider | null;
  participant?: {
    guestId: string;
    username: string;
    colour: string;
    role: "owner" | "editor" | "viewer";
  };
  canUploadAssets?: boolean;
}

const EMPTY_PRESENCE: PresenceSnapshot = { collaborators: [] };

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

function minimapProjection(
  elements: readonly ElementRecord[],
): MiniMapElement[] {
  return elements
    .filter((element) => element.isDeleted !== true)
    .map((element) => ({
      id: String(element.id),
      x: Number(element.x),
      y: Number(element.y),
      width: Number(element.width),
      height: Number(element.height),
    }));
}

function viewportFromAppState(appState: AppState): PresenceViewport {
  return {
    scrollX: appState.scrollX,
    scrollY: appState.scrollY,
    zoom: appState.zoom.value,
    width: appState.width,
    height: appState.height,
  };
}

export function CanvasController({
  ydoc: externalYdoc,
  roomId,
  provider,
  participant,
  canUploadAssets = false,
}: CanvasControllerProps) {
  const adapterRef = useRef<ExcalidrawAdapter | null>(null);
  const excalidrawAPIRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const imageManagerRef = useRef<ImageAssetManager | null>(null);
  const presenceControllerRef = useRef<PresenceController | null>(null);
  const presenceRef = useRef<PresenceSnapshot>(EMPTY_PRESENCE);
  const applyingCollaboratorsRef = useRef(false);
  const [assetStatus, setAssetStatus] = useState<string | null>(null);
  const [minimapElements, setMinimapElements] = useState<MiniMapElement[]>([]);
  const minimapRef = useRef<MiniMapElement[]>([]);
  const viewportRef = useRef<PresenceViewport | null>(null);
  const syncScheduledRef = useRef(false);
  const [viewport, setViewport] = useState<PresenceViewport | null>(null);
  const [physicsStatus, setPhysicsStatus] =
    useState<PhysicsEngineStatus>("idle");
  const physicsControllerRef = useRef<PhysicsController | null>(null);

  const scheduleUiSync = useCallback(() => {
    if (syncScheduledRef.current) return;
    syncScheduledRef.current = true;
    requestAnimationFrame(() => {
      syncScheduledRef.current = false;
      setMinimapElements(minimapRef.current);
      const vp = viewportRef.current;
      if (vp) setViewport(vp);
    });
  }, []);
  const [presence, setPresence] =
    useState<PresenceSnapshot>(EMPTY_PRESENCE);
  const previousCollaboratorIdsRef = useRef<string>("");

  const applyCollaborators = useCallback((snapshot: PresenceSnapshot) => {
    presenceRef.current = snapshot;
    const api = excalidrawAPIRef.current;
    if (!api) return;

    const nextIds = snapshot.collaborators
      .map((c) => `${c.clientId}:${c.cursor?.x ?? ""}:${c.cursor?.y ?? ""}:${c.selection.join(",")}`)
      .sort()
      .join("|");
    if (nextIds === previousCollaboratorIdsRef.current) return;
    previousCollaboratorIdsRef.current = nextIds;

    applyingCollaboratorsRef.current = true;
    try {
      const collaborators = new Map<SocketId, Collaborator>();
      for (const remote of snapshot.collaborators) {
        const socketId = String(remote.clientId) as SocketId;
        const selectedElementIds = Object.fromEntries(
          remote.selection.map((id) => [id, true] as const),
        );
        const collaborator: Collaborator = {
          id: remote.identity.guestId,
          socketId,
          username: remote.identity.username,
          button: "up",
          color: {
            background: remote.identity.colour,
            stroke: remote.identity.colour,
          },
          selectedElementIds,
          ...(remote.cursor?.visible
            ? {
                pointer: {
                  x: remote.cursor.x,
                  y: remote.cursor.y,
                  tool: remote.cursor.tool,
                },
              }
            : {}),
        };
        collaborators.set(socketId, collaborator);
      }
      api.updateScene({ collaborators });
    } finally {
      applyingCollaboratorsRef.current = false;
    }
  }, []);

  const applyProjection = useCallback(
    (projection: ReturnType<ExcalidrawAdapter["reconstructScene"]>) => {
      const records = projection.elements.map((element) => ({ ...element }));
      updateCanvasTestState({
        adapterElementCount: records.length,
        scene: redactedScene(records),
      });
      minimapRef.current = minimapProjection(records);
      scheduleUiSync();
      const api = excalidrawAPIRef.current;
      if (api) {
        // Excalidraw validates the adapter-normalized records at its imperative boundary.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        (api as any).updateScene({ elements: records });
      }
    },
    [scheduleUiSync],
  );

  const excalidrawAPICallback = useCallback(
    (api: ExcalidrawImperativeAPI) => {
      excalidrawAPIRef.current = api;
      const adapter = adapterRef.current;
      if (adapter) {
        applyProjection(adapter.reconstructScene());
      }
      viewportRef.current = viewportFromAppState(api.getAppState());
      scheduleUiSync();
    },
    [applyProjection, scheduleUiSync],
  );

  useEffect(() => {
    updateCanvasTestState({
      excalidrawVersion: SUPPORTED_EXCALIDRAW_VERSION,
    });
  }, []);


  useEffect(() => {
    const ydoc = externalYdoc ?? new Y.Doc();
    const ownsDocument = externalYdoc == null;

    const adapter = new ExcalidrawAdapter({
      ydoc,
      onSceneApplied: (projection) => {
        applyProjection(projection);
      },
    });

    adapter.startObserving();
    adapterRef.current = adapter;

    const imageManager =
      roomId && externalYdoc
        ? new ImageAssetManager({
            roomId,
            ydoc,
            canUpload: canUploadAssets,
            getApi: () => excalidrawAPIRef.current,
            onStatus: setAssetStatus,
          })
        : null;
    imageManagerRef.current = imageManager;
    imageManager?.start();

    const initialProjection = adapter.reconstructScene();
    applyProjection(initialProjection);
    updateCanvasTestState({
      canvasStatus: "mounted",
      adapterElementCount: initialProjection.elements.length,
    });

    return () => {
      adapter.stopObserving();
      adapterRef.current = null;
      imageManager?.stop();
      imageManagerRef.current = null;
      if (ownsDocument) {
        ydoc.destroy();
      }
      updateCanvasTestState({
        canvasStatus: "not-mounted",
        adapterElementCount: 0,
        scene: null,
      });
    };
  }, [applyProjection, canUploadAssets, externalYdoc, roomId]);

  useEffect(() => {
    if (!provider || !provider.awareness || !participant) return;
    const presenceController = new PresenceController({
      awareness: provider.awareness,
      identity: participant,
      onChange: (snapshot) => {
        setPresence(snapshot);
        applyCollaborators(snapshot);
      },
    });
    presenceControllerRef.current = presenceController;
    presenceController.start();

    return () => {
      presenceController.stop();
      presenceControllerRef.current = null;
      presenceRef.current = EMPTY_PRESENCE;
      previousCollaboratorIdsRef.current = "";
      setPresence(EMPTY_PRESENCE);
      applyCollaborators(EMPTY_PRESENCE);
    };
  }, [applyCollaborators, participant, provider]);

  const handleChange = useCallback(
    (
      elements: readonly { id: string; type: string }[],
      appState: AppState,
      files: BinaryFiles,
    ) => {
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
      imageManagerRef.current?.handleLocalFiles(files);

      minimapRef.current = minimapProjection(records);
      viewportRef.current = viewportFromAppState(appState);
      scheduleUiSync();
      presenceControllerRef.current?.updateViewport(viewportRef.current);
      presenceControllerRef.current?.updateSelection(
        Object.keys(appState.selectedElementIds),
      );

      updateCanvasTestState({
        adapterElementCount: elements.length,
        scene: redactedScene(records),
      });
    },
    [scheduleUiSync],
  );

  const handleScrollChange = useCallback(() => {
    const appState = excalidrawAPIRef.current?.getAppState();
    if (!appState) return;
    viewportRef.current = viewportFromAppState(appState);
    scheduleUiSync();
    presenceControllerRef.current?.updateViewport(viewportRef.current);
  }, [scheduleUiSync]);

  const handlePointerUpdate = useCallback(
    ({ pointer, button }: { pointer: { x: number; y: number; tool: "pointer" | "laser" }; button: "up" | "down" }) => {
      presenceControllerRef.current?.updateCursor({
        x: pointer.x,
        y: pointer.y,
        visible: true,
        tool: pointer.tool,
      });
      if (button === "up") {
        const appState = excalidrawAPIRef.current?.getAppState();
        if (appState) {
          presenceControllerRef.current?.updateSelection(
            Object.keys(appState.selectedElementIds),
          );
        }
      }
    },
    [],
  );

  const handleActivatePhysics = useCallback(() => {
    const api = excalidrawAPIRef.current;
    const adapter = adapterRef.current;
    if (!api || !adapter || !participant || !externalYdoc) {
      console.warn("[physics] blocked", { api: !!api, adapter: !!adapter, participant: !!participant, externalYdoc: !!externalYdoc });
      return;
    }

    if (physicsControllerRef.current) {
      physicsControllerRef.current.deactivateAll();
      physicsControllerRef.current = null;
      setPhysicsStatus("idle");
      return;
    }

    const appState = api.getAppState();
    const selectedIds = Object.keys(appState.selectedElementIds);
    console.log("[physics] selected ids", selectedIds);
    if (selectedIds.length === 0) return;

    const allElements = api.getSceneElementsIncludingDeleted();
    const selected = allElements
      .filter(
        (el) =>
          selectedIds.includes(el.id) &&
          !el.isDeleted &&
          ELIGIBLE_ELEMENT_TYPES.has(el.type),
      )
      .map(
        (el): ExcalidrawElementBounds => {
          const angle = (el as Record<string, unknown>).angle as number | undefined;
          const bounds: ExcalidrawElementBounds = {
            id: el.id,
            type: el.type,
            x: el.x,
            y: el.y,
            width: el.width,
            height: el.height,
          };
          if (typeof angle === "number") bounds.angle = angle;
          return bounds;
        },
      );

    console.log("[physics] eligible elements", selected.length, selected.map(e => e.type));
    if (selected.length === 0) return;

    const physicsLeases = externalYdoc.getMap<Record<string, unknown>>(
      ROOM_YJS_KEYS.physicsLeases,
    );
    console.log("[physics] creating controller, guestId:", participant.guestId);

    const controller = new PhysicsController({
      ydoc: externalYdoc,
      physicsLeases,
      guestId: participant.guestId,
      canvasWidth: appState.width,
      canvasHeight: appState.height,
      preferredReducedMotion: window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches,
      onTransforms: (transforms) => {
        console.log("[physics] transforms", transforms.length);
        const projection = adapter.reconstructScene();
        const transformMap = new Map(
          transforms.map((t) => [t.elementId, t]),
        );
        const updated = projection.elements.map((el) => {
          const transform = transformMap.get(el.id);
          if (!transform) return el;
          return {
            ...el,
            x: transform.x,
            y: transform.y,
            angle: transform.angle,
          };
        });
        const updatedRecords = updated.map(
          (el) => ({ ...el }) as ElementRecord,
        );
        adapter.publishLocalScene(updatedRecords);
        applyProjection({
          elements: updated,
          order: projection.order,
        });
      },
      onStatusChange: (status) => {
        console.log("[physics] status:", status);
        setPhysicsStatus(status);
      },
    });

    controller.activateElements(selected);
    console.log("[physics] activated, controller created");
    physicsControllerRef.current = controller;
  }, [externalYdoc, participant, applyProjection]);

  useEffect(() => {
    return () => {
      physicsControllerRef.current?.dispose();
      physicsControllerRef.current = null;
    };
  }, []);

  const navigateTo = useCallback((x: number, y: number) => {
    const api = excalidrawAPIRef.current;
    if (!api) return;
    const appState = api.getAppState();
    api.updateScene({
      appState: {
        scrollX: appState.width / (2 * appState.zoom.value) - x,
        scrollY: appState.height / (2 * appState.zoom.value) - y,
      },
    });
  }, []);

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

  const uiOptions = useMemo(() => ({
    canvasActions: {
      changeViewBackgroundColor: false,
      clearCanvas: false,
      export: false,
      loadScene: false,
      saveToActiveFile: false,
      toggleTheme: null,
      saveAsImage: false,
    } as const,
  }), []);

  return (
    <div className="vega-canvas">
      <Excalidraw
        excalidrawAPI={excalidrawAPICallback}
        onChange={handleChange}
        isCollaborating={Boolean(provider)}
        onPointerUpdate={handlePointerUpdate}
        onScrollChange={handleScrollChange}
        UIOptions={uiOptions}
      >
        <MainMenu>
          <MainMenu.Item onSelect={exportSceneJson}>
            Export scene JSON
          </MainMenu.Item>
          {participant && (
            <MainMenu.Item onSelect={handleActivatePhysics}>
              {physicsControllerRef.current ? "Stop Physics" : "Activate Physics"}
            </MainMenu.Item>
          )}
          <MainMenu.DefaultItems.Help />
        </MainMenu>
      </Excalidraw>
      {roomId ? (
        <MiniMap
          elements={minimapElements}
          viewport={viewport}
          collaborators={presence.collaborators}
          onNavigate={navigateTo}
        />
      ) : null}
      {assetStatus ? (
        <div className="vega-canvas__status" role="status">
          {assetStatus}
        </div>
      ) : null}
      {physicsStatus !== "idle" ? (
        <div className="vega-canvas__status" role="status">
          Physics: {physicsStatus}
        </div>
      ) : null}
    </div>
  );
}
