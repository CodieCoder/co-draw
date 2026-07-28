import type { Awareness } from "y-protocols/awareness";

export interface PresenceIdentity {
  guestId: string;
  connectionId: string;
  username: string;
  colour: string;
  role: "owner" | "editor" | "viewer";
}

export interface PresenceCursor {
  x: number;
  y: number;
  visible: boolean;
  tool: "pointer" | "laser";
}

export interface PresenceViewport {
  scrollX: number;
  scrollY: number;
  zoom: number;
  width: number;
  height: number;
}

export interface CollaboratorPresence {
  clientId: number;
  identity: PresenceIdentity;
  cursor?: PresenceCursor;
  viewport?: PresenceViewport;
  selection: string[];
}

export interface PresenceSnapshot {
  collaborators: CollaboratorPresence[];
}

const HEX_COLOUR = /^#[0-9a-f]{6}$/iu;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const MAX_SCENE_COORDINATE = 10_000_000;
const MAX_SELECTION = 100;

function finiteBounded(value: unknown, absoluteMax: number): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    Math.abs(value) <= absoluteMax
  );
}

function parseIdentity(value: unknown): PresenceIdentity | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const identity = value as Record<string, unknown>;
  if (
    typeof identity.guestId !== "string" ||
    !UUID_PATTERN.test(identity.guestId) ||
    typeof identity.connectionId !== "string" ||
    identity.connectionId.length < 1 ||
    identity.connectionId.length > 128 ||
    typeof identity.username !== "string" ||
    identity.username.length < 2 ||
    identity.username.length > 40 ||
    "email" in identity ||
    typeof identity.colour !== "string" ||
    !HEX_COLOUR.test(identity.colour) ||
    !["owner", "editor", "viewer"].includes(String(identity.role))
  ) {
    return null;
  }
  return identity as unknown as PresenceIdentity;
}

function parseCursor(value: unknown): PresenceCursor | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  const cursor = value as Record<string, unknown>;
  if (
    !finiteBounded(cursor.x, MAX_SCENE_COORDINATE) ||
    !finiteBounded(cursor.y, MAX_SCENE_COORDINATE) ||
    typeof cursor.visible !== "boolean" ||
    !["pointer", "laser"].includes(String(cursor.tool))
  ) {
    return;
  }
  return cursor as unknown as PresenceCursor;
}

function parseViewport(value: unknown): PresenceViewport | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  const viewport = value as Record<string, unknown>;
  if (
    !finiteBounded(viewport.scrollX, MAX_SCENE_COORDINATE) ||
    !finiteBounded(viewport.scrollY, MAX_SCENE_COORDINATE) ||
    !finiteBounded(viewport.zoom, 30) ||
    Number(viewport.zoom) < 0.05 ||
    !finiteBounded(viewport.width, 20_000) ||
    Number(viewport.width) <= 0 ||
    !finiteBounded(viewport.height, 20_000) ||
    Number(viewport.height) <= 0
  ) {
    return;
  }
  return viewport as unknown as PresenceViewport;
}

function parseSelection(value: unknown): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  const elementIds = (value as Record<string, unknown>).elementIds;
  if (!Array.isArray(elementIds) || elementIds.length > MAX_SELECTION) return [];
  return elementIds.filter(
    (id): id is string => typeof id === "string" && id.length <= 128,
  );
}

export function parseCollaboratorPresence(
  clientId: number,
  value: unknown,
): CollaboratorPresence | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const state = value as Record<string, unknown>;
  const identity = parseIdentity(state.identity);
  if (!identity) return null;
  const cursor = parseCursor(state.cursor);
  const viewport = parseViewport(state.viewport);
  return {
    clientId,
    identity,
    ...(cursor ? { cursor } : {}),
    ...(viewport ? { viewport } : {}),
    selection: parseSelection(state.selection),
  };
}

type Throttled<T extends unknown[]> = ((...args: T) => void) & {
  cancel(): void;
};

function throttle<T extends unknown[]>(
  delay: number,
  action: (...args: T) => void,
): Throttled<T> {
  let lastRun = 0;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let pending: T | null = null;
  const throttled = (...args: T) => {
    const elapsed = Date.now() - lastRun;
    pending = args;
    const run = () => {
      if (!pending) return;
      const next = pending;
      pending = null;
      timeout = null;
      lastRun = Date.now();
      action(...next);
    };
    if (elapsed >= delay && !timeout) run();
    else if (!timeout) timeout = setTimeout(run, Math.max(0, delay - elapsed));
  };
  throttled.cancel = () => {
    if (timeout) clearTimeout(timeout);
    timeout = null;
    pending = null;
  };
  return throttled;
}

export interface PresenceControllerOptions {
  awareness: Awareness;
  identity: Omit<PresenceIdentity, "connectionId">;
  onChange: (snapshot: PresenceSnapshot) => void;
}

export class PresenceController {
  readonly #awareness: Awareness;
  readonly #onChange: (snapshot: PresenceSnapshot) => void;
  readonly #publishCursor: Throttled<[PresenceCursor]>;
  readonly #publishViewport: Throttled<[PresenceViewport]>;
  readonly #publishSelection: Throttled<[string[]]>;
  #observer: (() => void) | null = null;

  constructor(options: PresenceControllerOptions) {
    this.#awareness = options.awareness;
    this.#onChange = options.onChange;
    this.#publishCursor = throttle(50, (cursor) => {
      this.#awareness.setLocalStateField("cursor", cursor);
    });
    this.#publishViewport = throttle(150, (viewport) => {
      this.#awareness.setLocalStateField("viewport", viewport);
    });
    this.#publishSelection = throttle(100, (elementIds) => {
      this.#awareness.setLocalStateField("selection", { elementIds });
    });
    this.#awareness.setLocalStateField("identity", {
      ...options.identity,
      connectionId: `${options.identity.guestId}:${this.#awareness.clientID}`,
    });
  }

  start(): void {
    if (this.#observer) return;
    this.#observer = () => this.#emit();
    this.#awareness.on("change", this.#observer);
    this.#emit();
  }

  stop(): void {
    if (this.#observer) {
      this.#awareness.off("change", this.#observer);
      this.#observer = null;
    }
    this.#publishCursor.cancel();
    this.#publishViewport.cancel();
    this.#publishSelection.cancel();
    this.#awareness.setLocalState(null);
  }

  updateCursor(cursor: PresenceCursor): void {
    this.#publishCursor(cursor);
  }

  updateViewport(viewport: PresenceViewport): void {
    this.#publishViewport(viewport);
  }

  updateSelection(elementIds: string[]): void {
    this.#publishSelection(elementIds.slice(0, MAX_SELECTION));
  }

  #emit(): void {
    const collaborators: CollaboratorPresence[] = [];
    this.#awareness.getStates().forEach((state, clientId) => {
      if (clientId === this.#awareness.clientID) return;
      const parsed = parseCollaboratorPresence(clientId, state);
      if (parsed) collaborators.push(parsed);
    });
    collaborators.sort((a, b) =>
      a.identity.username.localeCompare(b.identity.username),
    );
    this.#onChange({ collaborators });
  }
}
