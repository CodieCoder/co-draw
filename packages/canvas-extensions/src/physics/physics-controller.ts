import type * as Y from "yjs";

import type { ExcalidrawElementBounds } from "./physics-body-mapper.js";
import { mapElementToBody } from "./physics-body-mapper.js";
import { PhysicsEngine } from "./physics-engine.js";
import {
  acquireLease,
  releaseAllLeases,
  renewLease,
} from "./physics-lease-client.js";
import {
  ELIGIBLE_ELEMENT_TYPES,
  LEASE_RENEWAL_INTERVAL_MS,
  TRANSFORM_PUBLISH_INTERVAL_MS,
} from "./physics-types.js";
import type {
  PhysicsEngineStatus,
  PhysicsTransform,
} from "./physics-types.js";

export interface PhysicsControllerOptions {
  ydoc: Y.Doc;
  physicsLeases: Y.Map<Record<string, unknown>>;
  guestId: string;
  canvasWidth: number;
  canvasHeight: number;
  preferredReducedMotion: boolean;
  onTransforms: (transforms: PhysicsTransform[]) => void;
  onStatusChange: (status: PhysicsEngineStatus) => void;
}

export class PhysicsController {
  readonly #ydoc: Y.Doc;
  readonly #leases: Y.Map<Record<string, unknown>>;
  readonly #guestId: string;
  readonly #engine: PhysicsEngine;
  readonly #onTransforms: (transforms: PhysicsTransform[]) => void;
  readonly #onStatusChange: (status: PhysicsEngineStatus) => void;
  readonly #preferredReducedMotion: boolean;
  readonly #activatedElements = new Set<string>();
  #status: PhysicsEngineStatus = "idle";
  #frameHandle: ReturnType<typeof requestAnimationFrame> | null = null;
  #renewalHandle: ReturnType<typeof setInterval> | null = null;
  #lastPublish = 0;
  #disposed = false;

  constructor(options: PhysicsControllerOptions) {
    this.#ydoc = options.ydoc;
    this.#leases = options.physicsLeases;
    this.#guestId = options.guestId;
    this.#onTransforms = options.onTransforms;
    this.#onStatusChange = options.onStatusChange;
    this.#preferredReducedMotion = options.preferredReducedMotion;
    this.#engine = new PhysicsEngine({
      width: options.canvasWidth,
      height: options.canvasHeight,
    });
  }

  activateElements(elements: readonly ExcalidrawElementBounds[]): void {
    if (this.#disposed) return;

    const eligible = elements.filter(
      (el) =>
        ELIGIBLE_ELEMENT_TYPES.has(el.type) &&
        !this.#activatedElements.has(el.id),
    );

    console.log("[physics:ctrl] activateElements", eligible.length, eligible.map(e => `${e.type}:${e.id}`));
    if (eligible.length === 0) return;

    const now = Date.now();
    let acquired = false;

    for (const el of eligible) {
      const lease = acquireLease(
        this.#ydoc,
        this.#leases,
        el.id,
        this.#guestId,
        now,
      );
      console.log("[physics:ctrl] lease for", el.id, lease ? "acquired" : "failed");
      if (!lease) continue;

      mapElementToBody(this.#engine, el);
      this.#activatedElements.add(el.id);
      acquired = true;
    }

    if (acquired && this.#status === "idle") {
      console.log("[physics:ctrl] starting simulation");
      this.#startSimulation();
    } else {
      console.log("[physics:ctrl] not starting, acquired:", acquired, "status:", this.#status);
    }
  }

  deactivateAll(): void {
    releaseAllLeases(this.#ydoc, this.#leases, this.#guestId);
    this.#stopSimulation();
  }

  dispose(): void {
    this.#disposed = true;
    this.deactivateAll();
  }

  #startSimulation(): void {
    if (this.#disposed) return;
    this.#status = "running";
    console.log("[physics:ctrl] simulation started, onStatusChange('running')");
    this.#onStatusChange("running");

    this.#renewalHandle = setInterval(() => {
      const now = Date.now();
      for (const elementId of this.#activatedElements) {
        if (!renewLease(this.#ydoc, this.#leases, elementId, this.#guestId, now)) {
          this.#engine.removeBody(elementId);
          this.#activatedElements.delete(elementId);
        }
      }
      if (this.#activatedElements.size === 0) {
        this.#stopSimulation();
      }
    }, LEASE_RENEWAL_INTERVAL_MS);

    this.#lastPublish = 0;
    if (this.#preferredReducedMotion) {
      this.#publishInstant();
    } else {
      this.#tick();
    }
  }

  #stopSimulation(): void {
    if (this.#renewalHandle) {
      clearInterval(this.#renewalHandle);
      this.#renewalHandle = null;
    }
    if (this.#frameHandle) {
      cancelAnimationFrame(this.#frameHandle);
      this.#frameHandle = null;
    }
    this.#engine.clear();
    this.#activatedElements.clear();
    if (this.#status !== "idle") {
      this.#status = "idle";
      this.#onStatusChange("idle");
    }
  }

  #tick(timestamp?: number): void {
    if (this.#disposed) return;

    const now = timestamp ?? performance.now();
    const transforms = this.#engine.step(16);

    if (now - this.#lastPublish >= TRANSFORM_PUBLISH_INTERVAL_MS) {
      this.#lastPublish = now;
      console.log("[physics:ctrl] tick publishing", transforms.length, "transforms");
      this.#onTransforms(transforms);
    }

    if (this.#engine.isSettling(0.5)) {
      this.#publishFinal();
      return;
    }

    this.#frameHandle = requestAnimationFrame((ts) => this.#tick(ts));
  }

  #publishInstant(): void {
    if (this.#disposed) return;
    const transforms = this.#engine.step(0);
    this.#onTransforms(transforms);
    this.#publishFinal();
  }

  #publishFinal(): void {
    const transforms = this.#engine.step(0);
    this.#onTransforms(transforms);
    this.#stopSimulation();
  }
}
