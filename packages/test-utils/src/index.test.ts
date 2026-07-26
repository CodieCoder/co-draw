import { guestIdSchema } from "@vega/contracts/identifiers";
import { describe, expect, it } from "vitest";

import {
  createSyntheticActors,
  SYNTHETIC_ACTOR_KEYS,
} from "./index.js";

describe("synthetic collaborator fixtures", () => {
  it("creates frozen, run-scoped Alice, Bob, and Charlie identities", () => {
    const actors = createSyntheticActors("stage-0c-a1b2c3d4");

    expect(SYNTHETIC_ACTOR_KEYS).toEqual([
      "alice",
      "bob",
      "charlie",
    ]);
    expect(
      Object.values(actors).map(({ username, role }) => ({
        username,
        role,
      })),
    ).toEqual([
      { username: "Alice", role: "owner" },
      { username: "Bob", role: "editor" },
      { username: "Charlie", role: "viewer" },
    ]);
    expect(
      Object.values(actors).every(({ guestId }) =>
        guestIdSchema.safeParse(guestId).success),
    ).toBe(true);
    expect(
      Object.values(actors).map(({ privateEmail }) => privateEmail),
    ).toEqual([
      "alice+stage-0c-a1b2c3d4@example.test",
      "bob+stage-0c-a1b2c3d4@example.test",
      "charlie+stage-0c-a1b2c3d4@example.test",
    ]);
    expect(Object.isFrozen(actors)).toBe(true);
    expect(Object.values(actors).every(Object.isFrozen)).toBe(true);
  });

  it("rejects unsafe run identifiers without echoing the rejected value", () => {
    const rejected = "unsafe/private@example.com";

    expect(() => createSyntheticActors(rejected)).toThrow(
      "Synthetic test run ID is invalid.",
    );

    try {
      createSyntheticActors(rejected);
    } catch (error: unknown) {
      expect(String(error)).not.toContain(rejected);
    }
  });
});
