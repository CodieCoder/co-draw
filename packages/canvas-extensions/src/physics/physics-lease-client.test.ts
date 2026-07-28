import { describe, expect, it } from "vitest";
import * as Y from "yjs";

import { LEASE_DURATION_MS } from "./physics-types.js";
import {
  acquireLease,
  findActiveLease,
  releaseAllLeases,
  releaseLease,
  renewLease,
} from "./physics-lease-client.js";

function setup() {
  const ydoc = new Y.Doc();
  const map = ydoc.getMap<Record<string, unknown>>("physicsLeases");
  return { ydoc, map };
}

describe("physics lease client", () => {
  describe("acquireLease", () => {
    it("acquires a lease for an unclaimed element", () => {
      const { ydoc, map } = setup();
      const now = Date.now();
      const lease = acquireLease(ydoc, map, "el-1", "guest-1", now);
      expect(lease).not.toBeNull();
      expect(lease!.elementId).toBe("el-1");
      expect(lease!.guestId).toBe("guest-1");
      expect(lease!.leaseVersion).toBe(1);
      expect(lease!.expiresAt).toBeGreaterThan(now);
    });

    it("refuses to acquire an active lease owned by another guest", () => {
      const { ydoc, map } = setup();
      const now = Date.now();
      acquireLease(ydoc, map, "el-1", "guest-1", now);
      const second = acquireLease(ydoc, map, "el-1", "guest-2", now);
      expect(second).toBeNull();
    });

    it("allows the same guest to re-acquire their own lease", () => {
      const { ydoc, map } = setup();
      const now = Date.now();
      acquireLease(ydoc, map, "el-1", "guest-1", now);
      const second = acquireLease(ydoc, map, "el-1", "guest-1", now);
      expect(second).not.toBeNull();
      expect(second!.leaseVersion).toBe(2);
    });

    it("returns null when existing lease is active and owned by another", () => {
      const { ydoc, map } = setup();
      const now = Date.now();
      acquireLease(ydoc, map, "el-1", "guest-1", now);
      expect(findActiveLease(map, "el-1", now)).not.toBeNull();
      const blocked = acquireLease(ydoc, map, "el-1", "guest-2", now);
      expect(blocked).toBeNull();
    });
  });

  describe("findActiveLease", () => {
    it("returns null for an unclaimed element", () => {
      const { map } = setup();
      expect(findActiveLease(map, "el-1", Date.now())).toBeNull();
    });

    it("returns the active lease", () => {
      const { ydoc, map } = setup();
      const now = Date.now();
      acquireLease(ydoc, map, "el-1", "guest-1", now);
      const found = findActiveLease(map, "el-1", now);
      expect(found).not.toBeNull();
      expect(found!.guestId).toBe("guest-1");
    });

    it("returns null for expired leases", () => {
      const { ydoc, map } = setup();
      const now = Date.now();
      acquireLease(ydoc, map, "el-1", "guest-1", now);
      const future = now + LEASE_DURATION_MS + 1;
      expect(findActiveLease(map, "el-1", future)).toBeNull();
    });
  });

  describe("renewLease", () => {
    it("extends the expiry of an active lease", () => {
      const { ydoc, map } = setup();
      const now = Date.now();
      acquireLease(ydoc, map, "el-1", "guest-1", now);
      const renewed = renewLease(ydoc, map, "el-1", "guest-1", now + 500);
      expect(renewed).toBe(true);
      const found = findActiveLease(map, "el-1", now + LEASE_DURATION_MS - 1);
      expect(found).not.toBeNull();
    });

    it("refuses to renew for a different guest", () => {
      const { ydoc, map } = setup();
      const now = Date.now();
      acquireLease(ydoc, map, "el-1", "guest-1", now);
      const renewed = renewLease(ydoc, map, "el-1", "guest-2", now + 500);
      expect(renewed).toBe(false);
    });

    it("refuses to renew an expired lease", () => {
      const { ydoc, map } = setup();
      const now = Date.now();
      acquireLease(ydoc, map, "el-1", "guest-1", now);
      const future = now + LEASE_DURATION_MS + 1;
      const renewed = renewLease(ydoc, map, "el-1", "guest-1", future);
      expect(renewed).toBe(false);
    });
  });

  describe("releaseLease", () => {
    it("releases an active lease", () => {
      const { ydoc, map } = setup();
      const now = Date.now();
      acquireLease(ydoc, map, "el-1", "guest-1", now);
      releaseLease(ydoc, map, "el-1", "guest-1");
      expect(findActiveLease(map, "el-1", now)).toBeNull();
    });

    it("is a no-op for a non-existent lease", () => {
      const { ydoc, map } = setup();
      releaseLease(ydoc, map, "el-1", "guest-1");
      expect(findActiveLease(map, "el-1", Date.now())).toBeNull();
    });

    it("does not release a lease owned by another guest", () => {
      const { ydoc, map } = setup();
      const now = Date.now();
      acquireLease(ydoc, map, "el-1", "guest-1", now);
      releaseLease(ydoc, map, "el-1", "guest-2");
      expect(findActiveLease(map, "el-1", now)).not.toBeNull();
    });
  });

  describe("releaseAllLeases", () => {
    it("releases all leases owned by a guest", () => {
      const { ydoc, map } = setup();
      const now = Date.now();
      acquireLease(ydoc, map, "el-1", "guest-1", now);
      acquireLease(ydoc, map, "el-2", "guest-1", now);
      acquireLease(ydoc, map, "el-3", "guest-2", now);

      releaseAllLeases(ydoc, map, "guest-1");

      expect(findActiveLease(map, "el-1", now)).toBeNull();
      expect(findActiveLease(map, "el-2", now)).toBeNull();
      expect(findActiveLease(map, "el-3", now)).not.toBeNull();
    });

    it("is a no-op when guest has no leases", () => {
      const { ydoc, map } = setup();
      releaseAllLeases(ydoc, map, "guest-1");
      expect(findActiveLease(map, "el-1", Date.now())).toBeNull();
    });
  });
});
