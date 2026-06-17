// Reusable SVG map of the underground network.
//
// Two modes (chosen by which prop you pass):
//   • pass `lines`    -> "full" map: draws the coloured line paths + stations
//                        (used in Setup).
//   • pass `stations` -> "planning" map: draws ONLY the station nodes, no lines
//                        (used in Planning — the lines must stay hidden).
//
// Optional highlighting: `startId`, `destId`, and `routeStationIds` (a Set/array
// of stations currently on the built route). Pure SVG in JSX — no DOM access.

import { useMemo } from "react";

const VIEW_W = 820;
const VIEW_H = 700;

// `routePath` is the ordered list of station ids the player has built so far
// (their OWN selected route — not the hidden network). `currentId` is where the
// route currently ends. We draw that path on the map and pulse the current stop.
function NetworkMap({ lines, stations, startId, destId, routePath = [], currentId, onStationClick }) {
  const routeSet = useMemo(() => new Set(routePath), [routePath]);

  // Build the unique node list (+ interchange flag) from whichever input we got.
  const nodes = useMemo(() => {
    if (lines) {
      const byId = new Map();
      for (const line of lines) {
        for (const s of line.stations) {
          if (!byId.has(s.id)) byId.set(s.id, { id: s.id, name: s.name, x: s.x, y: s.y, lineCount: 0 });
          byId.get(s.id).lineCount += 1;
        }
      }
      return [...byId.values()];
    }
    return (stations ?? []).map((s) => ({ ...s, lineCount: 1 }));
  }, [lines, stations]);

  // Coordinates of the player's route, in order, for drawing the route polyline.
  const coordById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const routePoints = routePath
    .map((id) => coordById.get(id))
    .filter(Boolean)
    .map((n) => `${n.x},${n.y}`)
    .join(" ");

  const nodeClass = (n) => {
    if (n.id === startId) return "node-start";
    if (n.id === destId) return "node-dest";
    if (routeSet.has(n.id)) return "node-on-route";
    return "";
  };
  const nodeFill = (n) => {
    if (n.id === startId) return "var(--success)";
    if (n.id === destId) return "var(--danger)";
    if (routeSet.has(n.id)) return "var(--accent-2)";
    return n.lineCount > 1 ? "#ffffff" : "#cfd6e6";
  };

  return (
    <svg className="lr-map" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} role="img" aria-label="Network map">
      {/* coloured line paths (full mode only) */}
      {lines &&
        lines.map((line, i) => (
          <polyline
            key={line.id}
            className="line-path"
            points={line.stations.map((s) => `${s.x},${s.y}`).join(" ")}
            stroke={line.color}
            strokeWidth="7"
            style={{ animationDelay: `${i * 0.25}s` }}
          />
        ))}

      {/* the player's OWN route (only the segments they have selected) */}
      {routePath.length >= 2 && (
        <polyline className="route-path" points={routePoints} fill="none" />
      )}

      {/* station nodes + labels */}
      {nodes.map((n) => {
        const highlighted = n.id === startId || n.id === destId || routeSet.has(n.id);
        const r = n.id === startId || n.id === destId ? 11 : n.lineCount > 1 ? 9 : 6.5;
        return (
          <g
            key={n.id}
            className={onStationClick ? "node-clickable" : undefined}
            onClick={onStationClick ? () => onStationClick(n.id) : undefined}
          >
            {/* pulsing ring on the station the route currently ends at */}
            {n.id === currentId && (
              <circle className="node-current" cx={n.x} cy={n.y} r={13} fill="none" />
            )}
            <circle
              className={`station-dot ${nodeClass(n)}`}
              cx={n.x}
              cy={n.y}
              r={r}
              fill={nodeFill(n)}
              stroke="#0b1020"
              strokeWidth="2.5"
            />
            <text className="station-label" x={n.x} y={n.y - 16} textAnchor="middle"
              style={highlighted ? { fill: "#fff" } : undefined}>
              {n.name}
            </text>
            {/* larger transparent hit area so the small dots are easy to click */}
            {onStationClick && (
              <circle className="node-hit" cx={n.x} cy={n.y} r={18} fill="transparent" />
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default NetworkMap;
