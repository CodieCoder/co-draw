/**
 * The only package allowed to depend on Excalidraw.
 *
 * Stage 0A establishes compatibility and ownership only. Scene projection,
 * synchronisation, and canvas behaviour remain deferred to their planned work.
 */
export const SUPPORTED_EXCALIDRAW_VERSION = "0.18.1" as const;

export type {
  ExcalidrawProps as ExcalidrawAdapterProps,
} from "@excalidraw/excalidraw/types";
