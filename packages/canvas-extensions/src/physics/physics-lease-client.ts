import { YJS_ORIGINS } from "@vega/collaboration-schema";
import type * as Y from "yjs";

import type { PhysicsLease } from "./physics-types.js";
import { LEASE_DURATION_MS } from "./physics-types.js";

function leaseKey(elementId: string): string {
  return elementId;
}

function readLease(
  map: Y.Map<Record<string, unknown>>,
  elementId: string,
): PhysicsLease | null {
  const raw = map.get(leaseKey(elementId));
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const candidate = raw as Record<string, unknown>;
  if (
    typeof candidate.elementId !== "string" ||
    typeof candidate.guestId !== "string" ||
    typeof candidate.acquiredAt !== "number" ||
    typeof candidate.expiresAt !== "number" ||
    typeof candidate.leaseVersion !== "number"
  ) {
    return null;
  }
  return candidate as unknown as PhysicsLease;
}

function isExpired(lease: PhysicsLease, now: number): boolean {
  return now >= lease.expiresAt;
}

export function findActiveLease(
  map: Y.Map<Record<string, unknown>>,
  elementId: string,
  now: number,
): PhysicsLease | null {
  const lease = readLease(map, elementId);
  if (!lease || isExpired(lease, now)) return null;
  return lease;
}

export function acquireLease(
  ydoc: Y.Doc,
  map: Y.Map<Record<string, unknown>>,
  elementId: string,
  guestId: string,
  now: number,
): PhysicsLease | null {
  const existing = findActiveLease(map, elementId, now);
  if (existing && existing.guestId !== guestId) return null;

  const leaseVersion = existing ? existing.leaseVersion + 1 : 1;
  const lease: PhysicsLease = {
    elementId,
    guestId,
    acquiredAt: now,
    expiresAt: now + LEASE_DURATION_MS,
    leaseVersion,
  };

  let confirmed: PhysicsLease | null = null;
  ydoc.transact(() => {
    map.set(leaseKey(elementId), { ...lease });
  }, YJS_ORIGINS.physicsSimulation);

  confirmed = readLease(map, elementId);
  if (!confirmed || confirmed.guestId !== guestId) return null;
  return confirmed;
}

export function renewLease(
  ydoc: Y.Doc,
  map: Y.Map<Record<string, unknown>>,
  elementId: string,
  guestId: string,
  now: number,
): boolean {
  const existing = readLease(map, elementId);
  if (!existing || existing.guestId !== guestId || isExpired(existing, now)) {
    return false;
  }

  ydoc.transact(() => {
    map.set(leaseKey(elementId), {
      ...existing,
      expiresAt: now + LEASE_DURATION_MS,
    });
  }, YJS_ORIGINS.physicsSimulation);

  return true;
}

export function releaseLease(
  ydoc: Y.Doc,
  map: Y.Map<Record<string, unknown>>,
  elementId: string,
  guestId: string,
): void {
  const existing = readLease(map, elementId);
  if (!existing || existing.guestId !== guestId) return;

  ydoc.transact(() => {
    map.delete(leaseKey(elementId));
  }, YJS_ORIGINS.physicsSimulation);
}

export function releaseAllLeases(
  ydoc: Y.Doc,
  map: Y.Map<Record<string, unknown>>,
  guestId: string,
): void {
  const toRelease: string[] = [];
  map.forEach((_value: Record<string, unknown>, key: string) => {
    const lease = readLease(map, key);
    if (lease && lease.guestId === guestId) {
      toRelease.push(key);
    }
  });
  if (toRelease.length === 0) return;

  ydoc.transact(() => {
    for (const key of toRelease) {
      map.delete(leaseKey(key));
    }
  }, YJS_ORIGINS.physicsSimulation);
}
