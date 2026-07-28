declare module "matter-js" {
  export = Matter;
}

declare namespace Matter {
  class Engine {
    world: World;
  }

  namespace Engine {
    function create(options?: Record<string, unknown>): Engine;
    function update(engine: Engine, delta?: number): void;
  }

  class World {
    gravity: { x: number; y: number; scale: number };
    bodies: Body[];
  }

  class Body {
    id: number;
    position: { x: number; y: number };
    velocity: { x: number; y: number };
    angle: number;
    angularVelocity: number;
    bounds: { min: { x: number; y: number }; max: { x: number; y: number } };
    isStatic: boolean;
    friction: number;
  }

  namespace Body {
    function applyForce(body: Body, position: { x: number; y: number }, force: { x: number; y: number }): void;
    function setPosition(body: Body, position: { x: number; y: number }): void;
    function setVelocity(body: Body, velocity: { x: number; y: number }): void;
  }

  interface Bounds {
    min: { x: number; y: number };
    max: { x: number; y: number };
  }

  interface Vector {
    x: number;
    y: number;
  }

  namespace Bodies {
    function rectangle(x: number, y: number, width: number, height: number, options?: Record<string, unknown>): Body;
    function fromVertices(x: number, y: number, vertexSets: Vector[][], options?: Record<string, unknown>): Body | undefined;
  }

  namespace Composite {
    function add(composite: object, bodies: Body[]): void;
    function remove(composite: object, body: Body): void;
  }
}
