import { describe, expect, it } from "vitest";

import { miniMapBounds, viewportSceneRect } from "./MiniMap.js";
import type { CollaboratorPresence, PresenceViewport } from "./presence.js";

const COLLABORATOR_BOB: CollaboratorPresence = {
  clientId: 2,
  identity: {
    guestId: "01933a4f-2a00-7000-8000-000000000001",
    connectionId: "01933a4f-2a00-7000-8000-000000000001:2",
    username: "Bob",
    colour: "#2288aa",
    role: "editor",
  },
  viewport: {
    scrollX: -3_000,
    scrollY: 0,
    zoom: 1,
    width: 1_000,
    height: 800,
  },
  selection: [],
};

const COLLABORATOR_CAROL: CollaboratorPresence = {
  clientId: 3,
  identity: {
    guestId: "01933a4f-2a00-7000-8000-000000000002",
    connectionId: "01933a4f-2a00-7000-8000-000000000002:3",
    username: "Carol",
    colour: "#8822aa",
    role: "editor",
  },
  viewport: {
    scrollX: 2_000,
    scrollY: 500,
    zoom: 0.5,
    width: 1_200,
    height: 900,
  },
  selection: ["el-1"],
};

const COLLABORATOR_NO_VIEWPORT: CollaboratorPresence = {
  clientId: 4,
  identity: {
    guestId: "01933a4f-2a00-7000-8000-000000000003",
    connectionId: "01933a4f-2a00-7000-8000-000000000003:4",
    username: "Dan",
    colour: "#aa2288",
    role: "viewer",
  },
  selection: [],
};

describe("mini-map geometry", () => {
  describe("viewportSceneRect", () => {
    it("projects local viewport into scene coordinates", () => {
      expect(
        viewportSceneRect({
          scrollX: 100,
          scrollY: -50,
          zoom: 2,
          width: 1_000,
          height: 600,
        }),
      ).toEqual({
        id: "viewport",
        x: -100,
        y: 50,
        width: 500,
        height: 300,
      });
    });

    it("handles fractional zoom and large coordinates", () => {
      const rect = viewportSceneRect({
        scrollX: -4_000,
        scrollY: 2_000,
        zoom: 0.75,
        width: 1_920,
        height: 1_080,
      });
      expect(rect.x).toBe(4_000);
      expect(rect.y).toBe(-2_000);
      expect(rect.width).toBeCloseTo(2_560, -2);
      expect(rect.height).toBeCloseTo(1_440, -2);
    });
  });

  describe("miniMapBounds", () => {
    it("returns default bounds for empty input", () => {
      const bounds = miniMapBounds([], null, []);
      expect(bounds).toEqual({
        minX: -500,
        minY: -350,
        maxX: 500,
        maxY: 350,
      });
    });

    it("expands bounds from elements alone", () => {
      const bounds = miniMapBounds(
        [
          { id: "one", x: 100, y: 200, width: 50, height: 50 },
          { id: "two", x: -300, y: -100, width: 80, height: 60 },
        ],
        null,
        [],
      );
      expect(bounds.minX).toBeLessThan(-300);
      expect(bounds.minY).toBeLessThan(-100);
      expect(bounds.maxX).toBeGreaterThan(150);
      expect(bounds.maxY).toBeGreaterThan(250);
    });

    it("includes local viewport in bounds even without elements", () => {
      const viewport: PresenceViewport = {
        scrollX: 0,
        scrollY: 0,
        zoom: 1,
        width: 800,
        height: 600,
      };
      const bounds = miniMapBounds([], viewport, []);
      expect(bounds.minX).toBeLessThanOrEqual(0);
      expect(bounds.maxX).toBeGreaterThanOrEqual(800);
      expect(bounds.minY).toBeLessThanOrEqual(0);
      expect(bounds.maxY).toBeGreaterThanOrEqual(600);
    });

    it("includes distant elements and remote viewports in bounds", () => {
      const bounds = miniMapBounds(
        [{ id: "one", x: -2_000, y: -10, width: 100, height: 100 }],
        null,
        [COLLABORATOR_BOB],
      );
      expect(bounds.minX).toBeLessThan(-2_000);
      expect(bounds.maxX).toBeGreaterThan(4_000);
    });

    it("includes multiple remote collaborators", () => {
      const bounds = miniMapBounds(
        [{ id: "one", x: 0, y: 0, width: 100, height: 100 }],
        null,
        [COLLABORATOR_BOB, COLLABORATOR_CAROL],
      );
      expect(bounds.minX).toBeLessThan(-2_000);
      expect(bounds.maxX).toBeGreaterThan(4_000);
    });

    it("ignores collaborators without viewports", () => {
      const bounds = miniMapBounds(
        [{ id: "one", x: 0, y: 0, width: 100, height: 100 }],
        null,
        [COLLABORATOR_NO_VIEWPORT],
      );
      expect(bounds.minX).toBeLessThan(0);
      expect(bounds.minY).toBeLessThan(0);
      expect(bounds.maxX).toBeGreaterThan(100);
      expect(bounds.maxY).toBeGreaterThan(100);
    });

    it("adds padding proportional to scene extent", () => {
      const smallBounds = miniMapBounds(
        [{ id: "one", x: 0, y: 0, width: 10, height: 10 }],
        null,
        [],
      );
      const largeBounds = miniMapBounds(
        [{ id: "one", x: 0, y: 0, width: 10_000, height: 10_000 }],
        null,
        [],
      );
      const smallPadding = smallBounds.maxX - 10;
      const largePadding = largeBounds.maxX - 10_000;
      expect(largePadding / smallPadding).toBeGreaterThan(1.5);
    });
  });
});

