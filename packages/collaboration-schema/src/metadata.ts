import type * as Y from "yjs";

export interface DocumentMetadata {
  schemaVersion: number;
  excalidrawVersion: string;
  createdAt: string;
  updatedAt: string;
  lastCompactedAt?: string;
}

export function readDocumentMetadata(metaMap: Y.Map<unknown>): DocumentMetadata | null {
  const schemaVersion = metaMap.get("schemaVersion");
  const excalidrawVersion = metaMap.get("excalidrawVersion");
  const createdAt = metaMap.get("createdAt");
  const updatedAt = metaMap.get("updatedAt");

  if (
    typeof schemaVersion !== "number" ||
    typeof excalidrawVersion !== "string" ||
    typeof createdAt !== "string" ||
    typeof updatedAt !== "string"
  ) {
    return null;
  }

  const lastCompactedAt = metaMap.get("lastCompactedAt");
  const result: DocumentMetadata = {
    schemaVersion,
    excalidrawVersion,
    createdAt,
    updatedAt,
  };
  if (typeof lastCompactedAt === "string") {
    result.lastCompactedAt = lastCompactedAt;
  }
  return result;
}

export function writeDocumentMetadata(
  metaMap: Y.Map<unknown>,
  metadata: DocumentMetadata,
): void {
  metaMap.set("schemaVersion", metadata.schemaVersion);
  metaMap.set("excalidrawVersion", metadata.excalidrawVersion);
  metaMap.set("createdAt", metadata.createdAt);
  metaMap.set("updatedAt", metadata.updatedAt);
  if (metadata.lastCompactedAt) {
    metaMap.set("lastCompactedAt", metadata.lastCompactedAt);
  }
}
