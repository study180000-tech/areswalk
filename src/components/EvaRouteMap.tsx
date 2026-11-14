import { useState } from 'react';
import type { EvaWaypoint, MarsSite, RoverTelemetryState } from '../types/mars';
import { computeRouteMetrics } from '../utils/marsLogic';

interface EvaRouteMapProps {
  site: MarsSite;
  roverState?: RoverTelemetryState;
  showRover?: boolean;
}

export function EvaRouteMap({
  site,
  roverState,
  showRover = false,
}: EvaRouteMapProps) {
  const [activeWp, setActiveWp] = useState<EvaWaypoint>(site.waypoints[0]);
  const metrics = computeRouteMetrics(site.waypoints, site.hazards);

  const selectedWp =
    site.waypoints.find((w) => w.id === activeWp?.id) ?? site.waypoints[0];

  const pathPoints = site.waypoints.map((w) => `${w.x},${w.y}`).join(' ');
  const roverTrailPoints =
    showRover && roverState && roverState.trail.length > 1
      ? roverState.trail.map((p) => `${p.x},${p.y}`).join(' ')
      : '';

  const hasAnomaly = Boolean(roverState && roverState.anomalies.length > 0);

  return (
    <div className="space-y-3">
      {/* Route Summary Metrics */}
      <div className="grid grid-cols-4 gap-2 border border-white/10 bg-[#04060A] p-2.5 rounded">
        <div>
          <div className="text-[11px] text-slate-400">Traverse</div>
          <div className="font-mono-tabular text-sm font-semibold text-slate-100">
            {metrics.totalDistanceM} m
          </div>
        </div>
        <div>
          <div className="text-[11px] text-slate-400">EVA Time</div>
          <div className="font-mono-tabular text-sm font-semibold text-slate-100">
            {metrics.estimatedEvaMinutes} min
          </div>
        </div>
        <div>
          <div className="text-[11px] text-slate-400">Elev. Gain</div>
          <div className="font-mono-tabular text-sm font-semibold text-slate-100">
            +{metrics.elevationGainM} m
          </div>
        </div>
        <div>
          <div className="text-[11px] text-slate-400">Clearance</div>
          <div className="font-mono-tabular text-sm font-semibold text-emerald-400">
            {metrics.minHazardClearanceM} m
          </div>
        </div>
      </div>

      {/* 100m x 100m Hyper-Localized Surface Traverse Map */}
      <div className="relative border border-white/10 bg-[#04060A] rounded overflow-hidden">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-56 block"
          role="img"
          aria-label={`Localized EVA traverse map for ${site.name}`}
        >
          <defs>
            <pattern id="marsGrid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path
                d="M 10 0 L 0 0 0 10"
                fill="none"
                stroke="#1e293b"
                strokeWidth="0.35"
              />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#marsGrid)" />

          {/* Hazard Exclusion Zones */}
          {site.hazards.map((h) => (
            <g key={h.id}>
              <circle
                cx={h.x}
                cy={h.y}
                r={h.radiusM}
                fill="rgba(239, 68, 68, 0.14)"
                stroke="#ef4444"
                strokeWidth="0.6"
                strokeDasharray="1.8 1.2"
              />
              <text
                x={h.x}
                y={h.y + 1.2}
                textAnchor="middle"
                fill="#fca5a5"
                fontSize="3.1"
                fontFamily="IBM Plex Mono, monospace"
              >
                {h.slopeDeg}°
              </text>
            </g>
          ))}

          {/* Planned EVA Safe Corridor */}
          <polyline
            points={pathPoints}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="1.0"
            strokeDasharray="2.5 1.5"
          />

          {/* Live Rover Trail */}
          {roverTrailPoints && (
            <polyline
              points={roverTrailPoints}
              fill="none"
              stroke={hasAnomaly ? '#ef4444' : '#10b981'}
              strokeWidth="1.2"
            />
          )}

          {/* Waypoint Nodes */}
          {site.waypoints.map((wp, idx) => {
            const active = wp.id === selectedWp?.id;
            return (
              <g
                key={wp.id}
                onClick={() => setActiveWp(wp)}
                className="cursor-pointer"
              >
                <circle
                  cx={wp.x}
                  cy={wp.y}
                  r={active ? 3.4 : 2.5}
                  fill={active ? '#f59e0b' : '#0f172a'}
                  stroke="#38bdf8"
                  strokeWidth="0.9"
                />
                <text
                  x={wp.x + 4}
                  y={wp.y - 2.5}
                  fill="#e2e8f0"
                  fontSize="3.4"
                  fontFamily="IBM Plex Sans, sans-serif"
                >
                  W{idx + 1}: {wp.label}
                </text>
              </g>
            );
          })}

          {/* Live Rover Position Marker */}
          {showRover && roverState?.powered && (
            <g
              transform={`translate(${roverState.x}, ${roverState.y})`}
              data-testid="eva-map-rover-dot"
            >
              <circle
                r="5.5"
                fill={hasAnomaly ? 'rgba(239,68,68,0.22)' : 'rgba(16,185,129,0.22)'}
              />
              <circle
                r="2.7"
                fill={hasAnomaly ? '#ef4444' : '#10b981'}
                stroke="#ffffff"
                strokeWidth="0.7"
              />
              <line
                x1="0"
                y1="0"
                x2={Math.sin((roverState.headingDeg * Math.PI) / 180) * 6}
                y2={-Math.cos((roverState.headingDeg * Math.PI) / 180) * 6}
                stroke={hasAnomaly ? '#fca5a5' : '#6ee7b7'}
                strokeWidth="0.9"
              />
            </g>
          )}
        </svg>

        <div className="flex items-center justify-between px-2.5 py-1.5 border-t border-white/10 bg-[#090C12] text-[11px] text-slate-400">
          <span>100m × 100m Local Sector</span>
          <span className="font-mono-tabular">
            Cyan: EVA Corridor · Red: Mapped Hazard
          </span>
        </div>
      </div>

      {/* Selected Waypoint Science Brief */}
      {selectedWp && (
        <div className="border border-white/10 bg-[#04060A] p-3 rounded space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-amber-400">{selectedWp.label}</span>
            <span className="font-mono-tabular text-slate-400">
              +{selectedWp.elevationOffsetM}m rel
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {selectedWp.scienceGoal}
          </p>
        </div>
      )}
    </div>
  );
}