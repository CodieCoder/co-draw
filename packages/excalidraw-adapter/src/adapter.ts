import type * as Y from "yjs";
import { ROOM_YJS_KEYS, YJS_ORIGINS } from "@vega/collaboration-schema";
import { normalizeElement, elementFingerprint } from "@vega/collaboration-schema";
import type { NormalizedElement } from "@vega/collaboration-schema";

export type ElementRecord = Record<string, unknown>;

export interface AdapterProjection {
  elements: NormalizedElement[];
  order: string[];
}

export interface ExcalidrawAdapterConfig {
  ydoc: Y.Doc;
  onSceneApplied?: (projection: AdapterProjection) => void;
}

export class ExcalidrawAdapter {
  #ydoc: Y.Doc;
  #elementsMap: Y.Map<ElementRecord>;
  #elementOrder: Y.Array<string>;
  #previousProjection: Map<string, string>;
  #previousOrder: string[];
  #remoteApplying: boolean;
  #onSceneApplied: ((projection: AdapterProjection) => void) | undefined;
  #yjsObserver: ((transaction: Y.Transaction) => void) | null;

  constructor(config: ExcalidrawAdapterConfig) {
    this.#ydoc = config.ydoc;
    this.#elementsMap = config.ydoc.getMap<ElementRecord>(ROOM_YJS_KEYS.elements);
    this.#elementOrder = config.ydoc.getArray<string>(ROOM_YJS_KEYS.elementOrder);
    this.#previousProjection = new Map();
    this.#previousOrder = [];
    this.#remoteApplying = false;
    this.#onSceneApplied = config.onSceneApplied;
    this.#yjsObserver = null;

    this.#snapshotProjection();
  }

  get ydoc(): Y.Doc {
    return this.#ydoc;
  }

  get isRemoteApplying(): boolean {
    return this.#remoteApplying;
  }

  publishLocalScene(elements: ElementRecord[]): void {
    if (this.#remoteApplying) return;

    const normalized: NormalizedElement[] = [];
    const quarantined: ElementRecord[] = [];

    for (const raw of elements) {
      const el = normalizeElement(raw);
      if (el) {
        normalized.push(el);
      } else {
        quarantined.push(raw);
      }
    }

    const nextOrder = normalized.map((e) => e.id);
    const nextFingerprints = new Map<string, string>();

    for (const el of normalized) {
      nextFingerprints.set(el.id, elementFingerprint(el));
    }

    if (this.#projectionEqual(nextFingerprints, nextOrder)) {
      return;
    }

    this.#rememberProjection(nextFingerprints, nextOrder);

    this.#ydoc.transact(() => {
      const currentIds = new Set(this.#elementOrder.toArray());

      for (const el of normalized) {
        const existing = this.#elementsMap.get(el.id);
        if (!this.#elementRecordsEqual(existing, el)) {
          this.#elementsMap.set(el.id, el);
        }
      }

      for (const id of currentIds) {
        if (!nextFingerprints.has(id)) {
          this.#elementsMap.delete(id);
        }
      }

      const currentOrder = this.#elementOrder.toArray();
      if (!this.#ordersEqual(currentOrder, nextOrder)) {
        if (currentOrder.length > 0) {
          this.#elementOrder.delete(0, currentOrder.length);
        }
        if (nextOrder.length > 0) {
          this.#elementOrder.insert(0, nextOrder);
        }
      }
    }, YJS_ORIGINS.localExcalidraw);
  }

  reconstructScene(): AdapterProjection {
    const order = this.#elementOrder.toArray();
    const elements: NormalizedElement[] = [];

    const seen = new Set<string>();
    for (const id of order) {
      if (seen.has(id)) continue;
      seen.add(id);

      const raw = this.#elementsMap.get(id);
      if (!raw) continue;

      const el = normalizeElement(raw);
      if (el) {
        elements.push(el);
      }
    }

    this.#elementsMap.forEach((raw, id) => {
      if (!seen.has(id)) {
        seen.add(id);
        const el = normalizeElement(raw);
        if (el) {
          elements.push(el);
        }
      }
    });

    return { elements, order: elements.map((e) => e.id) };
  }

  startObserving(): void {
    if (this.#yjsObserver) return;

    this.#yjsObserver = (transaction: Y.Transaction) => {
      if (transaction.origin === YJS_ORIGINS.localExcalidraw) return;
      const changedParents =
        transaction.changedParentTypes as ReadonlyMap<unknown, unknown>;
      if (
        !changedParents.has(this.#elementsMap) &&
        !changedParents.has(this.#elementOrder)
      ) {
        return;
      }

      this.#applyRemoteUpdate();
    };

    this.#ydoc.on("afterTransaction", this.#yjsObserver);
  }

  stopObserving(): void {
    if (this.#yjsObserver) {
      this.#ydoc.off("afterTransaction", this.#yjsObserver);
      this.#yjsObserver = null;
    }
  }

  destroy(): void {
    this.stopObserving();
  }

  #applyRemoteUpdate(): void {
    this.#remoteApplying = true;
    try {
      const projection = this.reconstructScene();
      this.#snapshotProjection();
      this.#onSceneApplied?.(projection);
    } finally {
      this.#remoteApplying = false;
    }
  }

  #snapshotProjection(): void {
    this.#previousProjection.clear();
    const proj = this.reconstructScene();
    for (const el of proj.elements) {
      this.#previousProjection.set(el.id, elementFingerprint(el));
    }
    this.#previousOrder = [...proj.order];
  }

  #projectionEqual(next: Map<string, string>, nextOrder: string[]): boolean {
    if (next.size !== this.#previousProjection.size) return false;
    for (const [id, fp] of next) {
      if (this.#previousProjection.get(id) !== fp) return false;
    }
    for (const id of this.#previousProjection.keys()) {
      if (!next.has(id)) return false;
    }
    return this.#ordersEqual(this.#previousOrder, nextOrder);
  }

  #ordersEqual(left: readonly string[], right: readonly string[]): boolean {
    return (
      left.length === right.length &&
      left.every((value, index) => value === right[index])
    );
  }

  #rememberProjection(
    fingerprints: Map<string, string>,
    order: readonly string[],
  ): void {
    this.#previousProjection.clear();
    for (const [id, fingerprint] of fingerprints) {
      this.#previousProjection.set(id, fingerprint);
    }
    this.#previousOrder = [...order];
  }

  #elementRecordsEqual(existing: ElementRecord | undefined, normalized: NormalizedElement): boolean {
    if (!existing) return false;
    const fpExisting = elementFingerprint(normalizeElement(existing) ?? ({} as NormalizedElement));
    const fpNew = elementFingerprint(normalized);
    return fpExisting === fpNew;
  }
}
