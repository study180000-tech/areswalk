import {
  AlertOctagon,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Camera,
  Flame,
  Mountain,
  Play,
  Power,
  RotateCcw,
  ShieldCheck,
  Square,
  TriangleAlert,
} from 'lucide-react';
import type { MarsSite, RoverTelemetryState } from '../types/mars';
import { EvaRouteMap } from './EvaRouteMap';
import { LocalRover3D } from './LocalRover3D';

interface LiveRoverPanelProps {
  site: MarsSite;
  roverState: RoverTelemetryState;
  onControl: (payload: Record<string, unknown>) => void;
  onOpenHardwareModal: () => void;
}

export function LiveRoverPanel({
  site,
  roverState,
  onControl,
  onOpenHardwareModal,
}: LiveRoverPanelProps) {
  const hasAnomaly = roverState.anomalies.length > 0;
  const maxTilt = Math.max(Math.abs(roverState.pitchDeg), Math.abs(roverState.rollDeg));

  return (
    <div className="flex flex-col h-full bg-[#090C12]">
      {/* Header & Power Control */}
      <div className="p-4 border-b border-white/10 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-50">
              Live Rover Telemetry
            </h2>
            <p className="text-xs text-slate-400">
              {site.name} · {roverState.powered ? 'Active Green Beacon' : 'Standby'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onControl({ action: 'power', powered: !roverState.powered })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              roverState.powered
                ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                : 'bg-white/10 text-slate-200 hover:bg-white/15 border border-white/15'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{roverState.powered ? 'Rover ON' : 'Power ON'}</span>
          </button>
        </div>

        {/* Patrol + Reset + Hardware API */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              onControl({ action: 'patrol', patrolActive: !roverState.patrolActive })
            }
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded text-xs font-medium border transition-colors whitespace-nowrap ${
              roverState.patrolActive
                ? 'border-emerald-500/60 bg-emerald-950/50 text-emerald-300'
                : 'border-white/15 bg-[#04060A] text-slate-300 hover:border-white/30'
            }`}
          >
            {roverState.patrolActive ? (
              <>
                <Square className="w-3 h-3" />
                <span>Pause Drive</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3" />
                <span>Auto-Patrol Drive</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => onControl({ action: 'reset' })}
            className="flex items-center gap-1 py-1.5 px-2.5 rounded text-xs text-slate-300 border border-white/15 bg-[#04060A] hover:border-white/30 whitespace-nowrap"
            aria-label="Reset rover position"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={onOpenHardwareModal}
            className="py-1.5 px-2.5 rounded text-xs text-cyan-300 border border-cyan-500/40 bg-cyan-950/30 hover:bg-cyan-950/50 whitespace-nowrap"
          >
            ESP32 Setup
          </button>
        </div>

        {/* 3 Live Hardware Sensor Cards */}
        <div className="grid grid-cols-3 gap-2">
          <div
            className={`border rounded p-2 ${
              roverState.distanceCm <= 38
                ? 'border-rose-500 bg-rose-950/30'
                : 'border-white/10 bg-[#04060A]'
            }`}
          >
            <div className="text-[10px] uppercase tracking-wider text-slate-400">
              Ultrasonic
            </div>
            <div
              data-testid="sensor-ultrasonic"
              className="font-mono-tabular text-sm font-bold text-slate-100 mt-0.5"
            >
              {roverState.distanceCm.toFixed(1)}{' '}
              <span className="text-[10px] font-normal text-slate-400">cm</span>
            </div>
            <div className="text-[10px] text-slate-400">Limit &gt; 38cm</div>
          </div>

          <div
            className={`border rounded p-2 ${
              maxTilt >= 14
                ? 'border-rose-500 bg-rose-950/30'
                : 'border-white/10 bg-[#04060A]'
            }`}
          >
            <div className="text-[10px] uppercase tracking-wider text-slate-400">
              IMU Slope
            </div>
            <div
              data-testid="sensor-slope"
              className="font-mono-tabular text-sm font-bold text-slate-100 mt-0.5"
            >
              {maxTilt.toFixed(1)}°
            </div>
            <div className="text-[10px] text-slate-400">
              NASA {site.meanSlopeDeg.toFixed(1)}°
            </div>
          </div>

          <div
            className={`border rounded p-2 ${
              roverState.co2Ppm >= 900
                ? 'border-rose-500 bg-rose-950/30'
                : 'border-white/10 bg-[#04060A]'
            }`}
          >
            <div className="text-[10px] uppercase tracking-wider text-slate-400">
              CO₂ Sensor
            </div>
            <div
              data-testid="sensor-co2"
              className="font-mono-tabular text-sm font-bold text-slate-100 mt-0.5"
            >
              {Math.round(roverState.co2Ppm)}{' '}
              <span className="text-[10px] font-normal text-slate-400">ppm</span>
            </div>
            <div className="text-[10px] text-slate-400">
              Ref {site.co2BaselinePpm}ppm
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Telemetry & Sensor Anomaly Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Real-Time Anomaly Alert Banner */}
        {hasAnomaly ? (
          <div
            role="alert"
            data-testid="rover-anomaly-banner"
            className="border border-rose-500 bg-rose-950/60 rounded p-3 space-y-2"
          >
            <div className="flex items-center gap-2 text-rose-200 font-semibold text-xs">
              <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
              <span>REAL-TIME NASA BASELINE DEVIATION DETECTED</span>
            </div>
            {roverState.anomalies.map((al) => (
              <div
                key={al.id}
                className="border-t border-rose-500/30 pt-2 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between gap-2 font-semibold text-rose-100">
                  <span>{al.title}</span>
                  <span className="font-mono-tabular text-rose-300 shrink-0">
                    {al.measuredValue}
                  </span>
                </div>
                <p className="text-rose-200/90">{al.detail}</p>
                <div className="font-mono-tabular text-[11px] text-rose-300/80">
                  NASA Baseline: {al.nasaBaseline}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-emerald-500/30 bg-emerald-950/20 rounded p-2.5 flex items-center gap-2 text-xs text-emerald-300">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>
              {roverState.powered
                ? 'All live rover sensors match the NASA orbital baseline.'
                : 'Power ON rover to start live green tracking & anomaly monitoring.'}
            </span>
          </div>
        )}

        {/* 3D Local Surface Tilt & Obstacle Cone */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-semibold">3D Rover Attitude &amp; Ultrasonic Cone</span>
            <span className="font-mono-tabular text-[11px] text-slate-400">
              X:{roverState.x.toFixed(0)}m Y:{roverState.y.toFixed(0)}m
            </span>
          </div>
          <LocalRover3D site={site} roverState={roverState} />
        </div>

        {/* ESP32-CAM Live Snapshot Frame */}
        <div className="border border-white/10 bg-[#04060A] rounded overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-white/10 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-slate-200 whitespace-nowrap shrink-0">
              <Camera className="w-3.5 h-3.5 text-cyan-400" />
              <span>ESP32-CAM</span>
            </div>
            <span className="font-mono-tabular text-[11px] text-slate-400 truncate">
              {roverState.cameraLabel}
            </span>
          </div>
          {roverState.latestCameraFrame ? (
            <div className="relative">
              <img
                src={roverState.latestCameraFrame}
                alt={roverState.cameraLabel}
                referrerPolicy="no-referrer"
                className="w-full h-40 object-cover"
              />
              {roverState.distanceCm <= 38 && (
                <div className="absolute bottom-2 left-2 right-2 bg-[#04060A]/90 border border-rose-500/80 px-2.5 py-1.5 rounded flex items-center justify-between text-xs">
                  <span className="text-rose-300 font-semibold">
                    Obstacle Lock · Forward Sensor
                  </span>
                  <span className="font-mono-tabular font-bold text-rose-200">
                    {roverState.distanceCm.toFixed(1)} cm
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="h-32 flex flex-col items-center justify-center text-xs text-slate-500 px-4 text-center">
              <Camera className="w-5 h-5 mb-1.5 text-slate-600" />
              <span>Camera idle. Power on rover or POST frame to /api/camera-frame</span>
            </div>
          )}
        </div>

        {/* Hardware Field Test Bench & Manual D-Pad */}
        <div className="border border-white/10 bg-[#04060A] rounded p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200">
              Hardware Anomaly Test Bench
            </span>
            <span className="font-mono-tabular text-[11px] text-slate-400">
              Sensor Simulation
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onControl({ action: 'bench', scenario: 'rock' })}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded border border-amber-500/40 bg-amber-950/30 hover:bg-amber-950/50 text-xs font-medium text-amber-200"
            >
              <TriangleAlert className="w-3.5 h-3.5 shrink-0" />
              <span>Place Rock (16cm)</span>
            </button>
            <button
              type="button"
              onClick={() => onControl({ action: 'bench', scenario: 'tilt' })}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded border border-rose-500/40 bg-rose-950/30 hover:bg-rose-950/50 text-xs font-medium text-rose-200"
            >
              <Mountain className="w-3.5 h-3.5 shrink-0" />
              <span>Tilt Table (24.5°)</span>
            </button>
            <button
              type="button"
              onClick={() => onControl({ action: 'bench', scenario: 'co2' })}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded border border-orange-500/40 bg-orange-950/30 hover:bg-orange-950/50 text-xs font-medium text-orange-200"
            >
              <Flame className="w-3.5 h-3.5 shrink-0" />
              <span>CO₂ Spike (2480ppm)</span>
            </button>
            <button
              type="button"
              onClick={() => onControl({ action: 'bench', scenario: 'nominal' })}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded border border-emerald-500/40 bg-emerald-950/30 hover:bg-emerald-950/50 text-xs font-medium text-emerald-200"
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Clear Nominal</span>
            </button>
          </div>

          {/* Manual D-Pad Steering */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <span className="text-[11px] text-slate-400">Manual Drive (Move Green Beacon)</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Drive West"
                onClick={() => onControl({ action: 'move', dx: -6, dy: 0 })}
                className="p-1.5 rounded border border-white/15 bg-white/5 hover:bg-white/10 text-slate-200"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                aria-label="Drive North"
                onClick={() => onControl({ action: 'move', dx: 0, dy: -6 })}
                className="p-1.5 rounded border border-white/15 bg-white/5 hover:bg-white/10 text-slate-200"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                aria-label="Drive South"
                onClick={() => onControl({ action: 'move', dx: 0, dy: 6 })}
                className="p-1.5 rounded border border-white/15 bg-white/5 hover:bg-white/10 text-slate-200"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                aria-label="Drive East"
                onClick={() => onControl({ action: 'move', dx: 6, dy: 0 })}
                className="p-1.5 rounded border border-white/15 bg-white/5 hover:bg-white/10 text-slate-200"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 2D Sector Position Map with Green Dot */}
        <EvaRouteMap site={site} roverState={roverState} showRover />
      </div>
    </div>
  );
}