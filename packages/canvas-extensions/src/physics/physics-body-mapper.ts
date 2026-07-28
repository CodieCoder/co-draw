import type { PhysicsBodyMapping } from "./physics-types.js";
import type { PhysicsEngine } from "./physics-engine.js";

export interface ExcalidrawElementBounds {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  angle?: number;
}

const MIN_SIZE = 10;

export function mapElementToBody(
  engine: PhysicsEngine,
  element: ExcalidrawElementBounds,
): PhysicsBodyMapping | null {
  const width = Math.max(Number(element.width) || 0, MIN_SIZE);
  const height = Math.max(Number(element.height) || 0, MIN_SIZE);

  if (element.type === "ellipse") {
    return engine.addBodyEllipse(
      element.id,
      Number(element.x),
      Number(element.y),
      width,
      height,
    );
  }

  return engine.addBody(
    element.id,
    Number(element.x),
    Number(element.y),
    width,
    height,
  );
}
