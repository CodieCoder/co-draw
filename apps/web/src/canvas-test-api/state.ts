import type {
  ConnectionInfo,
  RoomInfo,
  SceneInfo,
} from "./types.js";

export interface MutableCanvasTestState {
  room: RoomInfo | null;
  scene: SceneInfo | null;
  collaborationStatus: ConnectionInfo["status"];
  collaborationDocumentName: string | undefined;
  canvasStatus: "not-mounted" | "mounted";
  adapterElementCount: number;
  excalidrawVersion: string;
}

export const canvasTestState: MutableCanvasTestState = {
  room: null,
  scene: null,
  collaborationStatus: "disconnected",
  collaborationDocumentName: undefined,
  canvasStatus: "not-mounted",
  adapterElementCount: 0,
  excalidrawVersion: "",
};

export function updateCanvasTestState(
  update: Partial<MutableCanvasTestState>,
): void {
  Object.assign(canvasTestState, update);
}
