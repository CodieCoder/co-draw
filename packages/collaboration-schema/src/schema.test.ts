import { describe, it, expect } from "vitest";
import * as Y from "yjs";
import {
  ROOM_YJS_KEYS,
  SCHEMA_VERSION,
  YJS_ORIGINS,
} from "../src/keys.js";
import { normalizeElement, isValidElementId, isSupportedElementType, elementFingerprint } from "../src/elements.js";
import {
  createRoomDocument,
  createInitialSnapshot,
  encodeDocumentAsSnapshot,
  getStateVector,
  applySnapshot,
} from "../src/document.js";
import { readDocumentMetadata } from "../src/metadata.js";

describe("collaboration schema", () => {
  describe("keys", () => {
    it("has distinct top-level keys", () => {
      const keys = Object.values(ROOM_YJS_KEYS);
      expect(new Set(keys).size).toBe(keys.length);
    });

    it("has expected origins", () => {
      expect(YJS_ORIGINS.localExcalidraw).toBe("local-excalidraw");
      expect(YJS_ORIGINS.remoteSync).toBe("remote-sync");
    });

    it("has positive schema version", () => {
      expect(SCHEMA_VERSION).toBeGreaterThan(0);
    });
  });

  describe("element validation", () => {
    it("validates a correct element id", () => {
      expect(isValidElementId("abc-123")).toBe(true);
      expect(isValidElementId("")).toBe(false);
      expect(isValidElementId(null)).toBe(false);
    });

    it("validates supported element types", () => {
      expect(isSupportedElementType("rectangle")).toBe(true);
      expect(isSupportedElementType("ellipse")).toBe(true);
      expect(isSupportedElementType("unknown-type")).toBe(false);
    });

    it("normalizes a valid rectangle element", () => {
      const raw: Record<string, unknown> = {
        id: "elem-001",
        type: "rectangle",
        x: 100,
        y: 200,
        width: 300,
        height: 150,
        angle: 0,
        seed: 12345,
        version: 1,
        versionNonce: 123,
        index: "a0",
        strokeColor: "#000000",
        backgroundColor: "#ff0000",
        fillStyle: "solid",
        strokeWidth: 2,
        strokeStyle: "solid",
        roughness: 1,
        opacity: 100,
        isDeleted: false,
        groupIds: [],
        frameId: null,
        boundElements: null,
        updated: 1234567890,
        link: null,
        locked: false,
        roundness: null,
      };

      const normalized = normalizeElement(raw);
      expect(normalized).not.toBeNull();
      if (normalized) {
        expect(normalized.id).toBe("elem-001");
        expect(normalized.type).toBe("rectangle");
        expect(normalized.x).toBe(100);
        expect(normalized.y).toBe(200);
        expect(normalized.fillStyle).toBe("solid");
      }
    });

    it("preserves required freehand scene fields", () => {
      const normalized = normalizeElement({
        id: "draw-001",
        type: "freedraw",
        x: 10,
        y: 20,
        width: 80,
        height: 40,
        angle: 0,
        version: 2,
        versionNonce: 22,
        points: [[0, 0], [40, 20], [80, 10]],
        pressures: [0.5, 0.7, 0.4],
        simulatePressure: false,
        lastCommittedPoint: null,
      });

      expect(normalized).not.toBeNull();
      expect(normalized?.points).toEqual([[0, 0], [40, 20], [80, 10]]);
      expect(normalized?.pressures).toEqual([0.5, 0.7, 0.4]);
      expect(normalized?.simulatePressure).toBe(false);
    });

    it("preserves required collaborative text fields", () => {
      const normalized = normalizeElement({
        id: "text-001",
        type: "text",
        x: 10,
        y: 20,
        width: 120,
        height: 24,
        angle: 0,
        version: 3,
        versionNonce: 33,
        fontSize: 20,
        fontFamily: 5,
        text: "Shared text",
        textAlign: "left",
        verticalAlign: "top",
        containerId: null,
        originalText: "Shared text",
        autoResize: true,
        lineHeight: 1.25,
      });

      expect(normalized).not.toBeNull();
      expect(normalized?.text).toBe("Shared text");
      expect(normalized?.originalText).toBe("Shared text");
      expect(normalized?.fontSize).toBe(20);
    });

    it("quarantines incomplete type-specific records", () => {
      const incompleteFreehand = normalizeElement({
        id: "draw-bad",
        type: "freedraw",
        x: 0,
        y: 0,
        width: 10,
        height: 10,
        angle: 0,
        version: 1,
        versionNonce: 1,
      });
      const incompleteText = normalizeElement({
        id: "text-bad",
        type: "text",
        x: 0,
        y: 0,
        width: 10,
        height: 10,
        angle: 0,
        version: 1,
        versionNonce: 1,
      });

      expect(incompleteFreehand).toBeNull();
      expect(incompleteText).toBeNull();
    });

    it("rejects element without id", () => {
      expect(normalizeElement({ type: "rectangle", x: 0, y: 0 })).toBeNull();
    });

    it("rejects element with non-finite coordinates", () => {
      expect(
        normalizeElement({
          id: "e1",
          type: "rectangle",
          x: NaN,
          y: 0,
          width: 100,
          height: 100,
          angle: 0,
        }),
      ).toBeNull();
    });

    it("rejects unsupported element type", () => {
      expect(
        normalizeElement({
          id: "e1",
          type: "garbage",
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          angle: 0,
        }),
      ).toBeNull();
    });

    it("computes consistent fingerprints", () => {
      const el = normalizeElement({
        id: "e1",
        type: "rectangle",
        x: 100,
        y: 200,
        width: 300,
        height: 150,
        angle: 0,
        version: 1,
        versionNonce: 100,
      })!;

      const same = normalizeElement({
        id: "e1",
        type: "rectangle",
        x: 100,
        y: 200,
        width: 300,
        height: 150,
        angle: 0,
        version: 1,
        versionNonce: 100,
      })!;

      expect(elementFingerprint(el)).toBe(elementFingerprint(same));
    });
  });

  describe("document creation and snapshot", () => {
    it("creates room document with expected shared types", () => {
      const doc = createRoomDocument();
      expect(doc.elements).toBeDefined();
      expect(doc.elementOrder).toBeDefined();
      expect(doc.documentMetadata).toBeDefined();
      expect(doc.elements.size).toBe(0);
      expect(doc.elementOrder.length).toBe(0);
    });

    it("creates initial snapshot with correct version", () => {
      const excalidrawVersion = "0.18.1";
      const snapshot = createInitialSnapshot(excalidrawVersion);
      expect(snapshot).toBeInstanceOf(Uint8Array);
      expect(snapshot.length).toBeGreaterThan(0);

      const ydoc = new Y.Doc();
      applySnapshot(ydoc, snapshot);
      const meta = readDocumentMetadata(ydoc.getMap("documentMetadata"));
      expect(meta).not.toBeNull();
      if (meta) {
        expect(meta.schemaVersion).toBe(SCHEMA_VERSION);
        expect(meta.excalidrawVersion).toBe(excalidrawVersion);
      }
    });

    it("encodes and decodes document state", () => {
      const { ydoc, elements, elementOrder, documentMetadata: metaMap } = createRoomDocument();

      const rect: Record<string, unknown> = {
        id: "r1",
        type: "rectangle",
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        angle: 0,
        seed: 1,
        version: 1,
        versionNonce: 1,
        index: "a0",
      };

      ydoc.transact(() => {
        elements.set("r1", rect);
        elementOrder.push(["r1"]);
        metaMap.set("schemaVersion", 1);
        metaMap.set("excalidrawVersion", "0.18.1");
        metaMap.set("createdAt", "2026-07-26T00:00:00.000Z");
        metaMap.set("updatedAt", "2026-07-26T00:00:00.000Z");
      });

      const snapshot = encodeDocumentAsSnapshot(ydoc);
      expect(snapshot.length).toBeGreaterThan(0);

      const ydoc2 = new Y.Doc();
      applySnapshot(ydoc2, snapshot);

      const elements2 = ydoc2.getMap("elements");
      expect(elements2.size).toBe(1);
      expect(elements2.get("r1")).toEqual(rect);

      const order2 = ydoc2.getArray("elementOrder");
      expect(order2.toArray()).toEqual(["r1"]);
    });

    it("encodes state vector", () => {
      const { ydoc } = createRoomDocument();
      const sv = getStateVector(ydoc);
      expect(sv).toBeInstanceOf(Uint8Array);
    });
  });
});
