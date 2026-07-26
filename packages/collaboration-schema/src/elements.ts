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
  [key: string]: unknown;
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

type NormalizedPoint = [number, number];

function normalizePoint(raw: unknown): NormalizedPoint | null {
  return Array.isArray(raw) &&
    raw.length === 2 &&
    isFiniteNumber(raw[0]) &&
    isFiniteNumber(raw[1])
    ? [raw[0], raw[1]]
    : null;
}

function normalizePoints(raw: unknown): NormalizedPoint[] | null {
  if (!Array.isArray(raw)) return null;
  const points: NormalizedPoint[] = [];
  for (const candidate of raw) {
    const point = normalizePoint(candidate);
    if (!point) return null;
    points.push(point);
  }
  return points;
}

function normalizeBinding(
  raw: unknown,
): Record<string, unknown> | null | undefined {
  if (raw === null) return null;
  if (typeof raw !== "object" || Array.isArray(raw)) return undefined;

  const binding = raw as Record<string, unknown>;
  if (
    !isValidElementId(binding.elementId) ||
    !isFiniteNumber(binding.focus) ||
    !isFiniteNumber(binding.gap)
  ) {
    return undefined;
  }

  const normalized: Record<string, unknown> = {
    elementId: binding.elementId,
    focus: binding.focus,
    gap: binding.gap,
  };
  if (binding.fixedPoint !== undefined) {
    const fixedPoint = normalizePoint(binding.fixedPoint);
    if (!fixedPoint) return undefined;
    normalized.fixedPoint = fixedPoint;
  }
  return normalized;
}

// Excalidraw renderers require these fields. Stripping them produces
// valid-looking shared records that can crash a remote canvas at render time.
function normalizeTypeSpecificFields(
  raw: Record<string, unknown>,
  type: string,
): Record<string, unknown> | null {
  if (type === "text") {
    if (
      !isFiniteNumber(raw.fontSize) ||
      !isFiniteNumber(raw.fontFamily) ||
      typeof raw.text !== "string" ||
      typeof raw.textAlign !== "string" ||
      typeof raw.verticalAlign !== "string" ||
      (raw.containerId !== null && !isValidElementId(raw.containerId)) ||
      typeof raw.originalText !== "string" ||
      typeof raw.autoResize !== "boolean" ||
      !isFiniteNumber(raw.lineHeight)
    ) {
      return null;
    }
    return {
      fontSize: raw.fontSize,
      fontFamily: raw.fontFamily,
      text: raw.text,
      textAlign: raw.textAlign,
      verticalAlign: raw.verticalAlign,
      containerId: raw.containerId,
      originalText: raw.originalText,
      autoResize: raw.autoResize,
      lineHeight: raw.lineHeight,
    };
  }

  if (type === "line" || type === "arrow") {
    const points = normalizePoints(raw.points);
    const lastCommittedPoint =
      raw.lastCommittedPoint === null
        ? null
        : normalizePoint(raw.lastCommittedPoint);
    const startBinding = normalizeBinding(raw.startBinding);
    const endBinding = normalizeBinding(raw.endBinding);
    if (
      !points ||
      (lastCommittedPoint === null && raw.lastCommittedPoint !== null) ||
      startBinding === undefined ||
      endBinding === undefined ||
      (raw.startArrowhead !== null &&
        typeof raw.startArrowhead !== "string") ||
      (raw.endArrowhead !== null && typeof raw.endArrowhead !== "string")
    ) {
      return null;
    }

    const fields: Record<string, unknown> = {
      points,
      lastCommittedPoint,
      startBinding,
      endBinding,
      startArrowhead: raw.startArrowhead,
      endArrowhead: raw.endArrowhead,
    };
    if (type === "arrow") {
      if (typeof raw.elbowed !== "boolean") return null;
      fields.elbowed = raw.elbowed;
    }
    return fields;
  }

  if (type === "freedraw") {
    const points = normalizePoints(raw.points);
    const rawPressures = raw.pressures;
    const pressures = Array.isArray(rawPressures)
      ? rawPressures.filter(isFiniteNumber)
      : null;
    const lastCommittedPoint =
      raw.lastCommittedPoint === null
        ? null
        : normalizePoint(raw.lastCommittedPoint);
    if (
      !points ||
      !pressures ||
      !Array.isArray(rawPressures) ||
      pressures.length !== rawPressures.length ||
      (lastCommittedPoint === null && raw.lastCommittedPoint !== null) ||
      typeof raw.simulatePressure !== "boolean"
    ) {
      return null;
    }
    return {
      points,
      pressures,
      simulatePressure: raw.simulatePressure,
      lastCommittedPoint,
    };
  }

  if (type === "image") {
    const scale = normalizePoint(raw.scale);
    if (
      (raw.fileId !== null && typeof raw.fileId !== "string") ||
      !["pending", "saved", "error"].includes(String(raw.status)) ||
      !scale ||
      (raw.crop !== null &&
        (typeof raw.crop !== "object" || Array.isArray(raw.crop)))
    ) {
      return null;
    }
    return {
      fileId: raw.fileId,
      status: raw.status,
      scale,
      crop: raw.crop,
    };
  }

  return {};
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
  if (!isFiniteNumber(version) || !isFiniteNumber(versionNonce)) return null;

  const typeSpecificFields = normalizeTypeSpecificFields(raw, type);
  if (!typeSpecificFields) return null;

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
    ...typeSpecificFields,
  };
}

export function elementFingerprint(el: NormalizedElement): string {
  return `${el.id}|${el.type}|${el.x}|${el.y}|${el.width}|${el.height}|${el.angle}|${el.version}`;
}

export function elementsEqual(a: NormalizedElement, b: NormalizedElement): boolean {
  return elementFingerprint(a) === elementFingerprint(b);
}
