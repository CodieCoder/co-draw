import { describe, expect, it } from "vitest";

import { parseCollaboratorPresence } from "./presence.js";
import type {
  PresenceCursor,
  PresenceIdentity,
  PresenceViewport,
} from "./presence.js";

const VALID_IDENTITY: PresenceIdentity = {
  guestId: "01933a4f-2a00-7000-8000-000000000001",
  connectionId: "connection-1",
  username: "Alice",
  colour: "#22aa88",
  role: "editor",
};

const VALID_CURSOR: PresenceCursor = {
  x: 12,
  y: -4,
  visible: true,
  tool: "pointer",
};

const VALID_VIEWPORT: PresenceViewport = {
  scrollX: 10,
  scrollY: 20,
  zoom: 1,
  width: 1_200,
  height: 800,
};

describe("Awareness allowlist", () => {
  describe("identity parsing", () => {
    it("accepts safe public identity with cursor, viewport, and selection", () => {
      const parsed = parseCollaboratorPresence(42, {
        identity: VALID_IDENTITY,
        cursor: VALID_CURSOR,
        viewport: VALID_VIEWPORT,
        selection: { elementIds: ["one"] },
      });
      expect(parsed).toMatchObject({
        clientId: 42,
        identity: { username: "Alice" },
        selection: ["one"],
      });
      expect(JSON.stringify(parsed)).not.toContain("email");
    });

    it("accepts owner role", () => {
      const parsed = parseCollaboratorPresence(1, {
        identity: { ...VALID_IDENTITY, role: "owner" },
      });
      expect(parsed).not.toBeNull();
    });

    it("accepts viewer role", () => {
      const parsed = parseCollaboratorPresence(1, {
        identity: { ...VALID_IDENTITY, role: "viewer" },
      });
      expect(parsed).not.toBeNull();
    });

    it("rejects identity with email field", () => {
      expect(
        parseCollaboratorPresence(1, {
          identity: {
            ...VALID_IDENTITY,
            email: "private@example.test",
          },
        }),
      ).toBeNull();
    });
  });

  describe("UUID validation", () => {
    it("rejects malformed guest IDs", () => {
      expect(
        parseCollaboratorPresence(1, {
          identity: { ...VALID_IDENTITY, guestId: "not-a-uuid" },
        }),
      ).toBeNull();
      expect(
        parseCollaboratorPresence(1, {
          identity: { ...VALID_IDENTITY, guestId: "" },
        }),
      ).toBeNull();
    });

    it("rejects nil UUID", () => {
      expect(
        parseCollaboratorPresence(1, {
          identity: {
            ...VALID_IDENTITY,
            guestId: "00000000-0000-0000-0000-000000000000",
          },
        }),
      ).toBeNull();
    });
  });

  describe("colour validation", () => {
    it("rejects non-hex colours", () => {
      expect(
        parseCollaboratorPresence(1, {
          identity: { ...VALID_IDENTITY, colour: "red" },
        }),
      ).toBeNull();
      expect(
        parseCollaboratorPresence(1, {
          identity: { ...VALID_IDENTITY, colour: "#12" },
        }),
      ).toBeNull();
      expect(
        parseCollaboratorPresence(1, {
          identity: { ...VALID_IDENTITY, colour: "#GGGGGG" },
        }),
      ).toBeNull();
    });
  });

  describe("role validation", () => {
    it("rejects unknown roles", () => {
      expect(
        parseCollaboratorPresence(1, {
          identity: { ...VALID_IDENTITY, role: "admin" },
        }),
      ).toBeNull();
    });
  });

  describe("username validation", () => {
    it("rejects short usernames", () => {
      expect(
        parseCollaboratorPresence(1, {
          identity: { ...VALID_IDENTITY, username: "A" },
        }),
      ).toBeNull();
    });

    it("rejects long usernames", () => {
      expect(
        parseCollaboratorPresence(1, {
          identity: { ...VALID_IDENTITY, username: "A".repeat(41) },
        }),
      ).toBeNull();
    });
  });

  describe("connection ID validation", () => {
    it("rejects empty connection IDs", () => {
      expect(
        parseCollaboratorPresence(1, {
          identity: { ...VALID_IDENTITY, connectionId: "" },
        }),
      ).toBeNull();
    });

    it("rejects overly long connection IDs", () => {
      expect(
        parseCollaboratorPresence(1, {
          identity: { ...VALID_IDENTITY, connectionId: "c".repeat(129) },
        }),
      ).toBeNull();
    });
  });

  describe("cursor parsing", () => {
    it("accepts pointer tool", () => {
      const parsed = parseCollaboratorPresence(1, {
        identity: VALID_IDENTITY,
        cursor: { ...VALID_CURSOR, tool: "pointer" },
      });
      expect(parsed?.cursor?.tool).toBe("pointer");
    });

    it("accepts laser tool", () => {
      const parsed = parseCollaboratorPresence(1, {
        identity: VALID_IDENTITY,
        cursor: { ...VALID_CURSOR, tool: "laser" },
      });
      expect(parsed?.cursor?.tool).toBe("laser");
    });

    it("rejects unknown cursor tools", () => {
      const parsed = parseCollaboratorPresence(1, {
        identity: VALID_IDENTITY,
        cursor: { ...VALID_CURSOR, tool: "hand" as "pointer" },
      });
      expect(parsed?.cursor).toBeUndefined();
    });

    it("rejects non-finite cursor coordinates", () => {
      expect(
        parseCollaboratorPresence(1, {
          identity: VALID_IDENTITY,
          cursor: { ...VALID_CURSOR, x: NaN },
        })?.cursor,
      ).toBeUndefined();
      expect(
        parseCollaboratorPresence(1, {
          identity: VALID_IDENTITY,
          cursor: { ...VALID_CURSOR, y: Infinity },
        })?.cursor,
      ).toBeUndefined();
    });

    it("rejects cursor coordinates beyond scene maximum", () => {
      expect(
        parseCollaboratorPresence(1, {
          identity: VALID_IDENTITY,
          cursor: { ...VALID_CURSOR, x: 20_000_000 },
        })?.cursor,
      ).toBeUndefined();
    });
  });

  describe("viewport parsing", () => {
    it("accepts valid viewport", () => {
      const parsed = parseCollaboratorPresence(1, {
        identity: VALID_IDENTITY,
        viewport: VALID_VIEWPORT,
      });
      expect(parsed?.viewport).toEqual(VALID_VIEWPORT);
    });

    it("rejects zero-width viewport", () => {
      const parsed = parseCollaboratorPresence(1, {
        identity: VALID_IDENTITY,
        viewport: { ...VALID_VIEWPORT, width: 0 },
      });
      expect(parsed?.viewport).toBeUndefined();
    });

    it("rejects zoom below minimum", () => {
      const parsed = parseCollaboratorPresence(1, {
        identity: VALID_IDENTITY,
        viewport: { ...VALID_VIEWPORT, zoom: 0.01 },
      });
      expect(parsed?.viewport).toBeUndefined();
    });

    it("rejects scroll beyond scene maximum", () => {
      const parsed = parseCollaboratorPresence(1, {
        identity: VALID_IDENTITY,
        viewport: { ...VALID_VIEWPORT, scrollX: 20_000_000 },
      });
      expect(parsed?.viewport).toBeUndefined();
    });

    it("rejects viewport with Infinity dimensions", () => {
      const parsed = parseCollaboratorPresence(1, {
        identity: VALID_IDENTITY,
        viewport: { ...VALID_VIEWPORT, width: Infinity },
      });
      expect(parsed?.viewport).toBeUndefined();
    });
  });

  describe("selection parsing", () => {
    it("parses valid selection array", () => {
      const parsed = parseCollaboratorPresence(1, {
        identity: VALID_IDENTITY,
        selection: { elementIds: ["a", "b", "c"] },
      });
      expect(parsed?.selection).toEqual(["a", "b", "c"]);
    });

    it("returns empty selection for missing elementIds", () => {
      const parsed = parseCollaboratorPresence(1, {
        identity: VALID_IDENTITY,
        selection: {},
      });
      expect(parsed?.selection).toEqual([]);
    });

    it("filters non-string element IDs", () => {
      const parsed = parseCollaboratorPresence(1, {
        identity: VALID_IDENTITY,
        selection: { elementIds: ["valid", 42, "also-valid", null] },
      });
      expect(parsed?.selection).toEqual(["valid", "also-valid"]);
    });

    it("caps selection at MAX_SELECTION elements", () => {
      const ids = Array.from({ length: 200 }, (_, i) => `el-${i}`);
      const parsed = parseCollaboratorPresence(1, {
        identity: VALID_IDENTITY,
        selection: { elementIds: ids },
      });
      expect(parsed?.selection).toEqual([]);
    });
  });

  describe("malformed and missing state", () => {
    it("rejects null state", () => {
      expect(parseCollaboratorPresence(1, null)).toBeNull();
    });

    it("rejects array state", () => {
      expect(parseCollaboratorPresence(1, [])).toBeNull();
    });

    it("rejects state without identity", () => {
      expect(
        parseCollaboratorPresence(1, { cursor: VALID_CURSOR }),
      ).toBeNull();
    });

    it("returns a full collaborator with only identity and no cursor/viewport", () => {
      const parsed = parseCollaboratorPresence(1, {
        identity: VALID_IDENTITY,
      });
      expect(parsed).toMatchObject({
        clientId: 1,
        identity: { username: "Alice" },
        selection: [],
      });
      expect(parsed?.cursor).toBeUndefined();
      expect(parsed?.viewport).toBeUndefined();
    });
  });
});

