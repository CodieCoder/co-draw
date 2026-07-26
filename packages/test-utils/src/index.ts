import {
  createGuestId,
  type GuestId,
} from "@vega/contracts/identifiers";
import type { Role } from "@vega/contracts/roles";

const TEST_RUN_ID_PATTERN =
  /^[a-z0-9](?:[a-z0-9-]{0,46}[a-z0-9])?$/u;

export const SYNTHETIC_ACTOR_KEYS = [
  "alice",
  "bob",
  "charlie",
] as const;

export type SyntheticActorKey = (typeof SYNTHETIC_ACTOR_KEYS)[number];

export interface SyntheticActor {
  readonly key: SyntheticActorKey;
  readonly username: "Alice" | "Bob" | "Charlie";
  readonly role: Role;
  readonly guestId: GuestId;
  /**
   * Private test setup data. Never attach this value to public application
   * state, browser diagnostics, traces, or evidence.
   */
  readonly privateEmail: `${SyntheticActorKey}+${string}@example.test`;
}

export type SyntheticActors = Readonly<{
  alice: SyntheticActor;
  bob: SyntheticActor;
  charlie: SyntheticActor;
}>;

export const assertSyntheticRunId = (runId: string): void => {
  if (!TEST_RUN_ID_PATTERN.test(runId)) {
    throw new Error("Synthetic test run ID is invalid.");
  }
};

const createActor = (
  key: SyntheticActorKey,
  username: SyntheticActor["username"],
  role: Role,
  runId: string,
): SyntheticActor =>
  Object.freeze({
    key,
    username,
    role,
    guestId: createGuestId(),
    privateEmail: `${key}+${runId}@example.test`,
  });

export const createSyntheticActors = (runId: string): SyntheticActors => {
  assertSyntheticRunId(runId);

  return Object.freeze({
    alice: createActor("alice", "Alice", "owner", runId),
    bob: createActor("bob", "Bob", "editor", runId),
    charlie: createActor("charlie", "Charlie", "viewer", runId),
  });
};
