export const ELIGIBLE_ELEMENT_TYPES = new Set([
  "rectangle",
  "ellipse",
  "image",
]);

export const LEASE_DURATION_MS = 3_000;
export const LEASE_RENEWAL_INTERVAL_MS = 1_000;
export const TRANSFORM_PUBLISH_INTERVAL_MS = 100;
export const PHYSICS_WORLD_GRAVITY_SCALE = 50;
export const BODY_FRICTION_AIR = 0.01;
export const BODY_RESTITUTION = 0.3;

export interface PhysicsLease {
  elementId: string;
  guestId: string;
  acquiredAt: number;
  expiresAt: number;
  leaseVersion: number;
}

export interface PhysicsBodyMapping {
  elementId: string;
  bodyId: number;
}

export interface PhysicsTransform {
  elementId: string;
  x: number;
  y: number;
  angle: number;
}

export type PhysicsEngineStatus =
  | "idle"
  | "running"
  | "settling"
  | "failed";
