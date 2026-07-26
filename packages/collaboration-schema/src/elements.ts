const SUPPORTED_ELEMENT_TYPES = new Set([
  "rectangle",
  "ellipse",
  "diamond",
  "line",
  "arrow",
  "text",
  "image",
  "freedraw",
]);

export interface NormalizedElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  strokeColor: string;
  backgroundColor: string;
  fillStyle: string;
  strokeWidth: number;
  strokeStyle: string;
  roughness: number;
  opacity: number;
  seed: number;
  version: number;
  versionNonce: number;
  index: string | null;
  isDeleted: boolean;
  groupIds: string[];
  frameId: string | null;
  boundElements: Array<{ id: string; type: string }> | null;
  updated: number;
  link: string | null;
  locked: boolean;
  roundness: { type: number; value?: number } | null;
}

export interface NormalizedElementRecord extends Record<string, unknown> {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
}

export function isValidElementId(id: unknown): id is string {
  return typeof id === "string" && id.length > 0 && id.length <= 256;
}

export function isSupportedElementType(type: unknown): type is string {
  return typeof type === "string" && SUPPORTED_ELEMENT_TYPES.has(type);
}

export function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v) && !Number.isNaN(v);
}

export function normalizeElement(raw: Record<string, unknown>): NormalizedElement | null {
  const id = raw.id;
  if (!isValidElementId(id)) return null;

  const type = raw.type;
  if (!isSupportedElementType(type)) return null;

  const x = raw.x;
  const y = raw.y;
  if (!isFiniteNumber(x) || !isFiniteNumber(y)) return null;

  const width = raw.width;
  const height = raw.height;
  if (!isFiniteNumber(width) || !isFiniteNumber(height)) return null;

  const angle = raw.angle;
  if (!isFiniteNumber(angle)) return null;

  const version = raw.version;
  const versionNonce = raw.versionNonce;
  if (typeof version !== "number" || typeof versionNonce !== "number") return null;

  return {
    id,
    type: String(type),
    x,
    y,
    width,
    height,
    angle,
    strokeColor: typeof raw.strokeColor === "string" ? raw.strokeColor : "#000000",
    backgroundColor: typeof raw.backgroundColor === "string" ? raw.backgroundColor : "transparent",
    fillStyle: typeof raw.fillStyle === "string" ? raw.fillStyle : "solid",
    strokeWidth: typeof raw.strokeWidth === "number" ? raw.strokeWidth : 1,
    strokeStyle: typeof raw.strokeStyle === "string" ? raw.strokeStyle : "solid",
    roughness: typeof raw.roughness === "number" ? raw.roughness : 1,
    opacity: typeof raw.opacity === "number" ? raw.opacity : 100,
    seed: typeof raw.seed === "number" ? raw.seed : Math.floor(Math.random() * 2 ** 31),
    version,
    versionNonce,
    index: typeof raw.index === "string" ? raw.index : null,
    isDeleted: Boolean(raw.isDeleted),
    groupIds: Array.isArray(raw.groupIds) ? raw.groupIds.filter((g): g is string => typeof g === "string") : [],
    frameId: typeof raw.frameId === "string" ? raw.frameId : null,
    boundElements: raw.boundElements != null ? (raw.boundElements as Array<{ id: string; type: string }>) : null,
    updated: typeof raw.updated === "number" ? raw.updated : 0,
    link: typeof raw.link === "string" ? raw.link : null,
    locked: Boolean(raw.locked),
    roundness: raw.roundness != null ? (raw.roundness as { type: number; value?: number }) : null,
  };
}

export function elementFingerprint(el: NormalizedElement): string {
  return `${el.id}|${el.type}|${el.x}|${el.y}|${el.width}|${el.height}|${el.angle}|${el.version}`;
}

export function elementsEqual(a: NormalizedElement, b: NormalizedElement): boolean {
  return elementFingerprint(a) === elementFingerprint(b);
}
