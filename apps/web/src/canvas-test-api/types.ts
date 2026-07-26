import type { ApplicationProfile } from "@vega/config/web";

export interface RoomInfo {
  readonly id: string;
  readonly status: string;
  readonly role: string;
}

export interface SceneInfo {
  readonly elementCount: number;
  readonly elementTypes: string[];
  readonly order: string[];
  readonly elements: readonly {
    readonly id: string;
    readonly type: string;
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    readonly isDeleted: boolean;
  }[];
}

export interface ConnectionInfo {
  readonly status: "disconnected" | "connecting" | "connected" | "reconnecting" | "failed";
}

export interface CanvasInspectionSnapshot {
  readonly schemaVersion: 1;
  readonly runtime: {
    readonly profile: ApplicationProfile;
    readonly releaseId: string;
  };
  readonly canvas: {
    readonly status: "not-mounted" | "mounted";
    readonly adapter?: {
      readonly excalidrawVersion: string;
      readonly elementCount: number;
    };
  };
  readonly room: RoomInfo | null;
  readonly scene: SceneInfo | null;
  readonly collaboration: {
    readonly status: "not-configured" | ConnectionInfo["status"];
    readonly documentName?: string;
  };
  readonly persistence: { readonly status: "not-configured" };
}

export interface CanvasTestApi {
  inspect(): CanvasInspectionSnapshot;
}
