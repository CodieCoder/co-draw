import * as Y from "yjs";
import { ROOM_YJS_KEYS, SCHEMA_VERSION } from "./keys.js";
import type { DocumentMetadata } from "./metadata.js";

export interface RoomYjsDocument {
  ydoc: Y.Doc;
  elements: Y.Map<Record<string, unknown>>;
  elementOrder: Y.Array<string>;
  productObjects: Y.Map<Record<string, unknown>>;
  deletedObjects: Y.Map<Record<string, unknown>>;
  documentMetadata: Y.Map<unknown>;
  physicsLeases: Y.Map<Record<string, unknown>>;
}

export function createRoomDocument(): RoomYjsDocument {
  const ydoc = new Y.Doc();

  const elements = ydoc.getMap<Record<string, unknown>>(ROOM_YJS_KEYS.elements);
  const elementOrder = ydoc.getArray<string>(ROOM_YJS_KEYS.elementOrder);
  const productObjects = ydoc.getMap<Record<string, unknown>>(ROOM_YJS_KEYS.productObjects);
  const deletedObjects = ydoc.getMap<Record<string, unknown>>(ROOM_YJS_KEYS.deletedObjects);
  const documentMetadata = ydoc.getMap<unknown>(ROOM_YJS_KEYS.documentMetadata);
  const physicsLeases = ydoc.getMap<Record<string, unknown>>(ROOM_YJS_KEYS.physicsLeases);

  return { ydoc, elements, elementOrder, productObjects, deletedObjects, documentMetadata, physicsLeases };
}

export function createInitialSnapshot(excalidrawVersion: string): Uint8Array {
  const { ydoc } = createRoomDocument();

  const now = new Date().toISOString();
  const metadata: DocumentMetadata = {
    schemaVersion: SCHEMA_VERSION,
    excalidrawVersion,
    createdAt: now,
    updatedAt: now,
  };

  ydoc.transact(() => {
    const metaMap = ydoc.getMap<unknown>(ROOM_YJS_KEYS.documentMetadata);
    metaMap.set("schemaVersion", metadata.schemaVersion);
    metaMap.set("excalidrawVersion", metadata.excalidrawVersion);
    metaMap.set("createdAt", metadata.createdAt);
    metaMap.set("updatedAt", metadata.updatedAt);
  });

  return Y.encodeStateAsUpdate(ydoc);
}

export function encodeDocumentAsSnapshot(ydoc: Y.Doc): Uint8Array {
  return Y.encodeStateAsUpdate(ydoc);
}

export function getStateVector(ydoc: Y.Doc): Uint8Array {
  return Y.encodeStateVector(ydoc);
}

export function applySnapshot(ydoc: Y.Doc, snapshot: Uint8Array): void {
  Y.applyUpdate(ydoc, snapshot);
}
