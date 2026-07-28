import type {
  CollaboratorPresence,
  PresenceViewport,
} from "./presence.js";

export interface MiniMapElement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SceneBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

const EMPTY_BOUNDS: SceneBounds = {
  minX: -500,
  minY: -350,
  maxX: 500,
  maxY: 350,
};

export function viewportSceneRect(viewport: PresenceViewport): MiniMapElement {
  return {
    id: "viewport",
    x: -viewport.scrollX,
    y: -viewport.scrollY,
    width: viewport.width / viewport.zoom,
    height: viewport.height / viewport.zoom,
  };
}

export function miniMapBounds(
  elements: readonly MiniMapElement[],
  viewport: PresenceViewport | null,
  collaborators: readonly CollaboratorPresence[],
): SceneBounds {
  const regions = [...elements];
  if (viewport) regions.push(viewportSceneRect(viewport));
  for (const collaborator of collaborators) {
    if (collaborator.viewport) {
      regions.push(viewportSceneRect(collaborator.viewport));
    }
  }
  if (regions.length === 0) return EMPTY_BOUNDS;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const region of regions) {
    minX = Math.min(minX, region.x);
    minY = Math.min(minY, region.y);
    maxX = Math.max(maxX, region.x + region.width);
    maxY = Math.max(maxY, region.y + region.height);
  }
  const padding = Math.max(120, Math.max(maxX - minX, maxY - minY) * 0.08);
  return {
    minX: minX - padding,
    minY: minY - padding,
    maxX: maxX + padding,
    maxY: maxY + padding,
  };
}

function viewportCentre(viewport: PresenceViewport): { x: number; y: number } {
  const rect = viewportSceneRect(viewport);
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

function isOffscreen(
  local: PresenceViewport | null,
  remote: PresenceViewport | undefined,
): boolean {
  if (!local || !remote) return false;
  const localRect = viewportSceneRect(local);
  const centre = viewportCentre(remote);
  return (
    centre.x < localRect.x ||
    centre.x > localRect.x + localRect.width ||
    centre.y < localRect.y ||
    centre.y > localRect.y + localRect.height
  );
}

export interface MiniMapProps {
  elements: readonly MiniMapElement[];
  viewport: PresenceViewport | null;
  collaborators: readonly CollaboratorPresence[];
  onNavigate: (x: number, y: number) => void;
}

export function MiniMap({
  elements,
  viewport,
  collaborators,
  onNavigate,
}: MiniMapProps) {
  const bounds = miniMapBounds(elements, viewport, collaborators);
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  const localRect = viewport ? viewportSceneRect(viewport) : null;

  return (
    <aside className="vega-minimap" aria-label="Canvas mini-map">
      <div className="vega-minimap__heading">
        <span>Map</span>
        <span>{collaborators.length + 1} here</span>
      </div>
      <svg
        className="vega-minimap__map"
        viewBox={`${bounds.minX} ${bounds.minY} ${width} ${height}`}
        role="img"
        aria-label="Occupied canvas and collaborator locations"
        onClick={(event) => {
          const svg = event.currentTarget;
          const point = svg.createSVGPoint();
          point.x = event.clientX;
          point.y = event.clientY;
          const matrix = svg.getScreenCTM()?.inverse();
          if (!matrix) return;
          const scenePoint = point.matrixTransform(matrix);
          onNavigate(scenePoint.x, scenePoint.y);
        }}
      >
        <rect
          x={bounds.minX}
          y={bounds.minY}
          width={width}
          height={height}
          className="vega-minimap__background"
        />
        {elements.map((element) => (
          <rect
            key={element.id}
            x={element.x}
            y={element.y}
            width={Math.max(element.width, width * 0.008)}
            height={Math.max(element.height, height * 0.008)}
            rx={Math.max(2, width * 0.004)}
            className="vega-minimap__element"
          />
        ))}
        {localRect ? (
          <rect
            x={localRect.x}
            y={localRect.y}
            width={localRect.width}
            height={localRect.height}
            className="vega-minimap__viewport"
          />
        ) : null}
        {collaborators.map((collaborator) => {
          if (!collaborator.viewport) return null;
          const centre = viewportCentre(collaborator.viewport);
          return (
            <g key={collaborator.clientId}>
              <circle
                cx={centre.x}
                cy={centre.y}
                r={Math.max(10, width * 0.018)}
                fill={collaborator.identity.colour}
                className="vega-minimap__collaborator"
              />
              <title>{collaborator.identity.username}</title>
            </g>
          );
        })}
      </svg>
      <div className="vega-minimap__radar" aria-label="Collaborator radar">
        {collaborators.map((collaborator) => {
          const offscreen = isOffscreen(viewport, collaborator.viewport);
          if (!offscreen || !collaborator.viewport) return null;
          const centre = viewportCentre(collaborator.viewport);
          return (
            <button
              type="button"
              key={collaborator.clientId}
              onClick={() => onNavigate(centre.x, centre.y)}
            >
              <span aria-hidden="true">↗</span>
              Find {collaborator.identity.username}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
