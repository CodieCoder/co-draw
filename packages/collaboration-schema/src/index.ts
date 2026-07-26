export {
  YJS_ORIGINS,
  ROOM_YJS_KEYS,
  DOCUMENT_METADATA_KEYS,
  SCHEMA_VERSION,
} from "./keys.js";

export { readDocumentMetadata, writeDocumentMetadata } from "./metadata.js";
export type { DocumentMetadata } from "./metadata.js";

export {
  isValidElementId,
  isSupportedElementType,
  isFiniteNumber,
  normalizeElement,
  elementFingerprint,
  elementsEqual,
} from "./elements.js";
export type { NormalizedElement, NormalizedElementRecord } from "./elements.js";

export {
  createRoomDocument,
  createInitialSnapshot,
  encodeDocumentAsSnapshot,
  getStateVector,
  applySnapshot,
} from "./document.js";
export type { RoomYjsDocument } from "./document.js";
