export const YJS_ORIGINS = {
  localExcalidraw: "local-excalidraw",
  remoteSync: "remote-sync",
  restoreDeletedObject: "restore-deleted-object",
  physicsSimulation: "physics-simulation",
  offlineReconciliation: "offline-reconciliation",
  documentMigration: "document-migration",
} as const;

export const ROOM_YJS_KEYS = {
  elements: "elements",
  elementOrder: "elementOrder",
  productObjects: "productObjects",
  deletedObjects: "deletedObjects",
  documentMetadata: "documentMetadata",
  physicsLeases: "physicsLeases",
} as const;

export const DOCUMENT_METADATA_KEYS = {
  schemaVersion: "schemaVersion",
  excalidrawVersion: "excalidrawVersion",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  lastCompactedAt: "lastCompactedAt",
} as const;

export const SCHEMA_VERSION = 1;
