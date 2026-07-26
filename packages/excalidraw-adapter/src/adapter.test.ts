import { describe, it, expect } from "vitest";
import * as Y from "yjs";
import { ExcalidrawAdapter } from "../src/adapter.js";
import type { AdapterProjection, ElementRecord } from "../src/adapter.js";

function createRectangle(id: string, overrides: Partial<Record<string, unknown>> = {}): ElementRecord {
  return {
    id,
    type: "rectangle",
    x: 100,
    y: 200,
    width: 300,
    height: 150,
    angle: 0,
    strokeColor: "#000000",
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 1,
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
    seed: 12345,
    version: 1,
    versionNonce: 100,
    index: "a0",
    isDeleted: false,
    groupIds: [],
    frameId: null,
    boundElements: null,
    updated: Date.now(),
    link: null,
    locked: false,
    roundness: null,
    ...overrides,
  };
}

describe("ExcalidrawAdapter", () => {
  function createDoc(): Y.Doc {
    return new Y.Doc();
  }

  it("creates adapter with empty document", () => {
    const ydoc = createDoc();
    const adapter = new ExcalidrawAdapter({ ydoc });
    const proj = adapter.reconstructScene();
    expect(proj.elements).toEqual([]);
    expect(proj.order).toEqual([]);
  });

  it("publishes a single rectangle to Yjs", () => {
    const ydoc = createDoc();
    const adapter = new ExcalidrawAdapter({ ydoc });
    const rect = createRectangle("r1");

    adapter.publishLocalScene([rect]);

    const elements = ydoc.getMap("elements");
    expect(elements.size).toBe(1);
    const stored = elements.get("r1") as ElementRecord | undefined;
    expect(stored).toBeDefined();
    if (stored) {
      expect(stored.id).toBe("r1");
      expect(stored.type).toBe("rectangle");
    }

    const order = ydoc.getArray("elementOrder");
    expect(order.toArray()).toEqual(["r1"]);
  });

  it("publishes with local-excalidraw origin", () => {
    const testYdoc = new Y.Doc();
    const adapter = new ExcalidrawAdapter({ ydoc: testYdoc });
    let capturedOrigin: unknown;

    const elementsMap = testYdoc.getMap("elements");
    elementsMap.observeDeep((_events, transaction) => {
      capturedOrigin = transaction.origin;
    });

    adapter.publishLocalScene([createRectangle("r1")]);

    expect(capturedOrigin).toBe("local-excalidraw");
  });

  it("rejects malformed elements", () => {
    const ydoc = createDoc();
    const adapter = new ExcalidrawAdapter({ ydoc });
    const bad: ElementRecord[] = [
      { id: "bad", type: "garbage", x: NaN, y: 0 },
    ];

    adapter.publishLocalScene(bad);

    const elements = ydoc.getMap("elements");
    expect(elements.size).toBe(0);
  });

  it("reconstructs scene from Yjs state", () => {
    const ydoc = createDoc();
    const adapter = new ExcalidrawAdapter({ ydoc });

    const r1 = createRectangle("r1", { x: 10, y: 20 });
    const r2 = createRectangle("r2", { x: 100, y: 200 });
    adapter.publishLocalScene([r1, r2]);

    const proj = adapter.reconstructScene();
    expect(proj.elements).toHaveLength(2);
    expect(proj.order).toHaveLength(2);
  });

  it("reconstructs scene in shared order", () => {
    const ydoc = createDoc();
    const adapter = new ExcalidrawAdapter({ ydoc });

    adapter.publishLocalScene([createRectangle("r1"), createRectangle("r2"), createRectangle("r3")]);

    const proj = adapter.reconstructScene();
    const ids = proj.order;
    expect(ids).toContain("r1");
    expect(ids).toContain("r2");
    expect(ids).toContain("r3");
  });

  it("updates element when changed", () => {
    const ydoc = createDoc();
    const adapter = new ExcalidrawAdapter({ ydoc });

    adapter.publishLocalScene([createRectangle("r1", { x: 10 })]);
    let el = ydoc.getMap("elements").get("r1") as ElementRecord | undefined;
    expect(el?.x).toBe(10);

    adapter.publishLocalScene([createRectangle("r1", { x: 999 })]);
    el = ydoc.getMap("elements").get("r1") as ElementRecord | undefined;
    expect(el?.x).toBe(999);
  });

  it("removes deleted elements from Yjs", () => {
    const ydoc = createDoc();
    const adapter = new ExcalidrawAdapter({ ydoc });

    adapter.publishLocalScene([createRectangle("r1"), createRectangle("r2")]);
    expect(ydoc.getMap("elements").size).toBe(2);

    adapter.publishLocalScene([createRectangle("r1")]);
    expect(ydoc.getMap("elements").size).toBe(1);
    expect(ydoc.getMap("elements").get("r2")).toBeUndefined();
  });

  it("suppresses remote callback publication", () => {
    const ydoc1 = new Y.Doc();
    const ydoc2 = new Y.Doc();

    ydoc1.on("update", (update: Uint8Array) => {
      Y.applyUpdate(ydoc2, update);
    });

    const adapter1 = new ExcalidrawAdapter({ ydoc: ydoc1 });
    adapter1.publishLocalScene([createRectangle("r1")]);

    let remoteAppliedCount = 0;
    const adapter2 = new ExcalidrawAdapter({
      ydoc: ydoc2,
      onSceneApplied: () => {
        remoteAppliedCount++;
      },
    });

    adapter2.startObserving();

    adapter1.publishLocalScene([createRectangle("r1", { x: 500 })]);

    adapter2.stopObserving();

    expect(remoteAppliedCount).toBe(1);
  });

  it("does not republish when fingerprints unchanged", () => {
    let transactionCount = 0;

    const testYdoc = new Y.Doc();
    testYdoc.on("update", () => {
      transactionCount++;
    });

    const testAdapter = new ExcalidrawAdapter({ ydoc: testYdoc });
    testAdapter.publishLocalScene([createRectangle("r1")]);
    const countAfterFirst = transactionCount;

    testAdapter.publishLocalScene([createRectangle("r1")]);
    expect(transactionCount).toBe(countAfterFirst);
  });

  it("publishes reorder-only scene changes", () => {
    const ydoc = new Y.Doc();
    const adapter = new ExcalidrawAdapter({ ydoc });
    const first = createRectangle("r1");
    const second = createRectangle("r2");

    adapter.publishLocalScene([first, second]);
    adapter.publishLocalScene([second, first]);

    expect(ydoc.getArray("elementOrder").toArray()).toEqual(["r2", "r1"]);
    expect(adapter.reconstructScene().order).toEqual(["r2", "r1"]);
  });

  it("applies one remote scene per transaction touching elements and order", () => {
    const ydoc = new Y.Doc();
    let applyCount = 0;
    const adapter = new ExcalidrawAdapter({
      ydoc,
      onSceneApplied: () => {
        applyCount += 1;
      },
    });
    adapter.startObserving();

    ydoc.transact(() => {
      ydoc.getMap("elements").set("r1", createRectangle("r1"));
      ydoc.getArray("elementOrder").insert(0, ["r1"]);
    }, "remote-provider");

    expect(applyCount).toBe(1);
    adapter.stopObserving();
  });

  it("handles multiple remote updates", () => {
    const ydoc1 = new Y.Doc();
    const ydoc2 = new Y.Doc();

    ydoc1.on("update", (update: Uint8Array) => {
      Y.applyUpdate(ydoc2, update);
    });

    const projections: AdapterProjection[] = [];
    const adapter = new ExcalidrawAdapter({
      ydoc: ydoc2,
      onSceneApplied: (proj) => projections.push(proj),
    });

    adapter.startObserving();

    const adapter2 = new ExcalidrawAdapter({ ydoc: ydoc1 });
    adapter2.publishLocalScene([createRectangle("r1")]);
    adapter2.publishLocalScene([createRectangle("r1"), createRectangle("r2")]);

    adapter.stopObserving();

    expect(projections.length).toBeGreaterThanOrEqual(1);
    const lastProj = projections[projections.length - 1];
    expect(lastProj?.elements.length).toBe(2);
  });

  it("quarantines invalid remote elements", () => {
    const testYdoc = new Y.Doc();
    const adapter = new ExcalidrawAdapter({ ydoc: testYdoc });
    adapter.startObserving();

    testYdoc.transact(() => {
      const elements = testYdoc.getMap("elements");
      elements.set("bad-id", { id: "bad-id", type: "garbage", x: NaN, y: 0 });
      const order = testYdoc.getArray("elementOrder");
      order.push(["bad-id"]);
    });

    const proj = adapter.reconstructScene();
    expect(proj.elements).toHaveLength(0);

    adapter.stopObserving();
  });

  it("isRemoteApplying flag set during remote update", () => {
    const ydoc1 = new Y.Doc();
    const ydoc2 = new Y.Doc();

    ydoc1.on("update", (update: Uint8Array) => {
      Y.applyUpdate(ydoc2, update);
    });

    let flagDuringCallback = false;

    const adapter = new ExcalidrawAdapter({
      ydoc: ydoc2,
      onSceneApplied: () => {
        flagDuringCallback = adapter.isRemoteApplying;
      },
    });

    adapter.startObserving();

    ydoc1.transact(() => {
      ydoc1.getMap("elements").set("r1", createRectangle("r1"));
      ydoc1.getArray("elementOrder").push(["r1"]);
    });

    expect(flagDuringCallback).toBe(true);
    expect(adapter.isRemoteApplying).toBe(false);

    adapter.stopObserving();
  });
});
