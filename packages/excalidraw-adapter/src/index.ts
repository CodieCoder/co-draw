export const SUPPORTED_EXCALIDRAW_VERSION = "0.18.1" as const;

export type {
  ExcalidrawImperativeAPI,
  ExcalidrawProps as ExcalidrawAdapterProps,
} from "@excalidraw/excalidraw/types";

export { ExcalidrawAdapter } from "./adapter.js";
export type { ExcalidrawAdapterConfig, AdapterProjection, ElementRecord } from "./adapter.js";
