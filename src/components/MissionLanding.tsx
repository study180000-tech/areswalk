import { ArrowRight, Film, QrCode } from 'lucide-react';
import type { MarsSite, RoverTelemetryState } from '../types/mars';
import { MarsGlobe3D } from './MarsGlobe3D';

interface MissionLandingProps {
  sites: MarsSite[];
  selectedSiteId: string;
  roverState: RoverTelemetryState;
  onStartMission: (siteId?: string) => void;
  onStartStories: (chapterId?: string) => void;
  onOpenQr: () => void;
}

export function MissionLanding({
  sites,
  selectedSiteId,
  roverState,
  onStartMission,
  onStartStories,
  onOpenQr,
}: MissionLandingProps) {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#020306] text-slate-100 flex flex-col">
      {/* Clean Single-Row Brand Header */}
      <header className="relative z-20 h-16 shrink-0 px-6 lg:px-12 flex items-center justify-between gap-8 border-b border-white/10 bg-[#020306]/90">
        <div className="flex items-center gap-3 shrink-0">
          <span className="font-display text-lg font-bold tracking-tight text-slate-50 whitespace-nowrap">
            AresWalk
          </span>
          <span className="hidden sm:inline font-mono-tabular text-[11px] text-amber-400/90 border-l border-white/15 pl-3">
            MARS EVA &amp; TELEMETRY
          </span>
        </div>

        <div className="hidden md:flex items-center gap-5 text-xs font-medium text-slate-400">
          <span>JPL Mars Trek</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>USGS MOLA / HiRISE</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>NASA NSSDC</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>360° Surface Views</span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenQr}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded border border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 transition-colors whitespace-nowrap shrink-0"
          >
            <QrCode className="w-3.5 h-3.5 text-amber-400" />
            <span>Mission QR</span>
          </button>
        </div>
      </header>

      {/* Full-Bleed Hero Stage: Photorealistic 3D Mars + Deep Space + Editorial Briefing */}
      <div className="relative flex-1 min-h-0 flex items-center overflow-hidden">
        {/* Seamless Full-Screen 3D Mars & Deep-Space Starfield */}
        <div className="absolute inset-0 z-0">
          <MarsGlobe3D
            sites={sites}
            selectedSiteId={selectedSiteId}
            activeLayer="optical"
            roverState={roverState}
            onSelectSite={(id) => onStartMission(id)}
            showTerritories={false}
            viewportShiftX={-0.19}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, rgba(2, 3, 6, 0.94) 0%, rgba(2, 3, 6, 0.78) 36%, rgba(2, 3, 6, 0.16) 62%, rgba(2, 3, 6, 0) 100%)',
            }}
          />
        </div>

        {/* Left Editorial Command Briefing */}
        <div className="relative z-10 max-w-2xl px-6 sm:px-10 lg:pl-14 lg:pr-8 py-6 lg:py-8 space-y-5 pointer-events-auto">
          <div className="space-y-3">
            <p className="text-xs font-mono-tabular tracking-widest uppercase text-amber-400">
              NASA Space Apps · Planetary EVA Console
            </p>
            <h1 className="font-display text-4xl sm:text-5xl xl:text-6xl font-bold tracking-tight text-slate-50 leading-[1.05] text-balance">
              Plan Every Step on Mars
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
              Explore five NASA Mars exploration provinces with verified MOLA &amp; HiRISE elevation datums, interactive 3D 360° surface panoramas, and live ESP32 rover telemetry.
            </p>
          </div>

          {/* 3-Column Mission Precision Strip */}
          <div className="grid grid-cols-3 gap-4 border-y border-white/10 py-4 max-w-lg">
            <div>
              <div className="font-mono-tabular text-2xl font-bold text-slate-50">05</div>
              <div className="text-xs text-slate-400 mt-0.5">NASA Mission Sites</div>
            </div>
            <div>
              <div className="font-mono-tabular text-2xl font-bold text-amber-400">360°</div>
              <div className="text-xs text-slate-400 mt-0.5">3D Surface Views</div>
            </div>
            <div>
              <div className="font-mono-tabular text-2xl font-bold text-emerald-400">Live</div>
              <div className="text-xs text-slate-400 mt-0.5">ESP32 + CAM Link</div>
            </div>
          </div>

          {/* Primary Start Action */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onStartMission()}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-display text-sm font-bold tracking-wide transition-colors whitespace-nowrap shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <span>Start Mission</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onStartStories()}
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded border border-cyan-400/50 bg-cyan-500/15 hover:bg-cyan-500 hover:text-slate-950 text-cyan-200 text-sm font-semibold transition-colors whitespace-nowrap shadow-lg shadow-cyan-500/10 cursor-pointer"
            >
              <Film className="w-4 h-4 text-cyan-400" />
              <span>Mission Stories (3D + VO)</span>
            </button>
            <button
              type="button"
              onClick={onOpenQr}
              className="inline-flex items-center gap-2 px-4 py-3.5 rounded border border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 text-sm font-medium transition-colors whitespace-nowrap cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-amber-400" />
              <span>Scan QR Code</span>
            </button>
          </div>

          {/* Direct Territory Launch Links */}
          <div className="space-y-2 pt-1">
            <div className="text-[11px] font-mono-tabular uppercase tracking-wider text-slate-400">
              Jump Directly to Province (Orbital &amp; 360° View)
            </div>
            <div className="flex flex-wrap gap-2">
              {sites.map((site) => (
                <button
                  key={site.id}
                  type="button"
                  onClick={() => onStartMission(site.id)}
                  className="px-3 py-1.5 rounded-xs border border-white/15 bg-[#070A10]/85 hover:border-amber-400/70 hover:bg-[#0B1018] text-xs text-slate-200 hover:text-white transition-colors whitespace-nowrap"
                >
                  {site.name.split(' · ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-4 right-6 z-10 text-right font-mono-tabular text-[11px] text-slate-400">
          Interactive 3D Mars · Phobos Orbit · Drag to Explore
        </div>
      </div>
    </div>
  );
}