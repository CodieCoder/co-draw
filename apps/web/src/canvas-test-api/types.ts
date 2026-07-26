import type { ApplicationProfile } from "@vega/config/web";

export interface CanvasInspectionSnapshot {
  readonly schemaVersion: 1;
  readonly runtime: {
    readonly profile: ApplicationProfile;
    readonly releaseId: string;
  };
  readonly canvas: { readonly status: "not-mounted" };
  readonly room: null;
  readonly scene: null;
  readonly collaboration: { readonly status: "not-configured" };
  readonly persistence: { readonly status: "not-configured" };
}

export interface CanvasTestApi {
  inspect(): CanvasInspectionSnapshot;
}

declare global {
  interface Window {
    readonly __CANVAS_TEST_API__: CanvasTestApi | undefined;
  }
  var __CANVAS_TEST_API__: CanvasTestApi | undefined;
}
