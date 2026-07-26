import { describe, expect, expectTypeOf, it } from "vitest";
import { v4 as createUuidV4, version as uuidVersion } from "uuid";

import {
  createAssetId,
  createGuestId,
  guestIdSchema,
  type GuestId,
  type RoomId,
  type roomIdSchema,
} from "./identifiers.js";

describe("identifier contracts", () => {
  it("generates canonical UUIDv7 identifiers", () => {
    const guestId = createGuestId();
    const assetId = createAssetId();

    expect(uuidVersion(guestId)).toBe(7);
    expect(uuidVersion(assetId)).toBe(7);
    expect(guestId).toBe(guestId.toLowerCase());
  });

  it("normalises uppercase UUIDv7 input", () => {
    const generated = createGuestId();
    expect(guestIdSchema.parse(generated.toUpperCase())).toBe(generated);
  });

  it("rejects malformed and non-v7 UUIDs", () => {
    expect(guestIdSchema.safeParse("not-an-id").success).toBe(false);
    expect(guestIdSchema.safeParse(createUuidV4()).success).toBe(false);
  });

  it("keeps identifier brands distinct at type level", () => {
    expectTypeOf<GuestId>().not.toEqualTypeOf<RoomId>();
    expectTypeOf<typeof guestIdSchema>().not.toEqualTypeOf<typeof roomIdSchema>();
  });
});
