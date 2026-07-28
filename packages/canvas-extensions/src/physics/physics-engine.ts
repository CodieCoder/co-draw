import Matter from "matter-js";

import { BODY_FRICTION_AIR, BODY_RESTITUTION, PHYSICS_WORLD_GRAVITY_SCALE } from "./physics-types.js";
import type { PhysicsBodyMapping, PhysicsTransform } from "./physics-types.js";

export interface PhysicsEngineInit {
  width: number;
  height: number;
}

export class PhysicsEngine {
  readonly #engine: Matter.Engine;
  readonly #world: Matter.World;
  readonly #bodies = new Map<number, Matter.Body>();
  readonly #mappings = new Map<string, number>();
  #running = false;
  #startTime = 0;

  constructor(init: PhysicsEngineInit) {
    this.#engine = Matter.Engine.create({
      gravity: { x: 0, y: PHYSICS_WORLD_GRAVITY_SCALE, scale: 0.001 },
    });
    this.#world = this.#engine.world;

    const floor = Matter.Bodies.rectangle(
      init.width / 2,
      init.height + 50,
      init.width * 2,
      100,
      { isStatic: true, friction: 0.5 },
    );
    const leftWall = Matter.Bodies.rectangle(
      -50,
      init.height / 2,
      100,
      init.height * 2,
      { isStatic: true, friction: 0.5 },
    );
    const rightWall = Matter.Bodies.rectangle(
      init.width + 50,
      init.height / 2,
      100,
      init.height * 2,
      { isStatic: true, friction: 0.5 },
    );

    Matter.Composite.add(this.#world, [floor, leftWall, rightWall]);
  }

  addBody(
    elementId: string,
    x: number,
    y: number,
    width: number,
    height: number,
  ): PhysicsBodyMapping {
    this.#removeExisting(elementId);

    const body = Matter.Bodies.rectangle(
      x + width / 2,
      y + height / 2,
      Math.max(width, 10),
      Math.max(height, 10),
      {
        frictionAir: BODY_FRICTION_AIR,
        restitution: BODY_RESTITUTION,
      },
    );

    Matter.Composite.add(this.#world, [body]);
    this.#bodies.set(body.id, body);
    this.#mappings.set(elementId, body.id);

    return { elementId, bodyId: body.id };
  }

  addBodyEllipse(
    elementId: string,
    x: number,
    y: number,
    width: number,
    height: number,
  ): PhysicsBodyMapping {
    this.#removeExisting(elementId);

    const rx = Math.max(width / 2, 5);
    const ry = Math.max(height / 2, 5);
    const cx = x + width / 2;
    const cy = y + height / 2;
    const vertices: Matter.Vector[] = [];
    const segments = 20;
    for (let index = 0; index < segments; index++) {
      const angle = (Math.PI * 2 * index) / segments;
      vertices.push({ x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle) });
    }

    const body = Matter.Bodies.fromVertices(cx, cy, [vertices], {
      frictionAir: BODY_FRICTION_AIR,
      restitution: BODY_RESTITUTION,
    });

    if (body) {
      Matter.Composite.add(this.#world, [body]);
      this.#bodies.set(body.id, body);
      this.#mappings.set(elementId, body.id);
      return { elementId, bodyId: body.id };
    }

    return this.addBody(elementId, x, y, width, height);
  }

  removeBody(elementId: string): void {
    this.#removeExisting(elementId);
  }

  step(delta: number): PhysicsTransform[] {
    Matter.Engine.update(this.#engine, delta);
    if (!this.#running) {
      this.#running = true;
      this.#startTime = performance.now();
    }

    const transforms: PhysicsTransform[] = [];
    for (const [elementId, bodyId] of this.#mappings) {
      const body = this.#bodies.get(bodyId);
      if (!body) continue;
      transforms.push({
        elementId,
        x: body.position.x - (body.bounds.max.x - body.bounds.min.x) / 2,
        y: body.position.y - (body.bounds.max.y - body.bounds.min.y) / 2,
        angle: body.angle,
      });
    }
    return transforms;
  }

  isSettling(speedThreshold: number): boolean {
    if (!this.#running) return false;
    if (performance.now() - this.#startTime < 1000) return false;
    for (const bodyId of this.#mappings.values()) {
      const body = this.#bodies.get(bodyId);
      if (!body) continue;
      const speed = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);
      const angular = Math.abs(body.angularVelocity);
      if (speed > speedThreshold || angular > 0.01) return false;
    }
    return true;
  }

  clear(): void {
    for (const bodyId of this.#mappings.values()) {
      const body = this.#bodies.get(bodyId);
      if (body) Matter.Composite.remove(this.#world, body);
    }
    this.#bodies.clear();
    this.#mappings.clear();
    this.#running = false;
  }

  get isRunning(): boolean {
    return this.#running;
  }

  #removeExisting(elementId: string): void {
    const existingBodyId = this.#mappings.get(elementId);
    if (existingBodyId !== undefined) {
      const body = this.#bodies.get(existingBodyId);
      if (body) Matter.Composite.remove(this.#world, body);
      this.#bodies.delete(existingBodyId);
      this.#mappings.delete(elementId);
    }
  }
}
