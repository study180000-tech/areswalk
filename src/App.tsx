import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertOctagon,
  ChevronDown,
  ChevronUp,
  Eye,
  Film,
  Globe,
  PanelRightClose,
  PanelRightOpen,
  QrCode,
} from 'lucide-react';
import { HardwareApiModal } from './components/HardwareApiModal';
import { LiveRoverPanel } from './components/LiveRoverPanel';
import { MarsGlobe3D } from './components/MarsGlobe3D';
import { MarsPanorama360 } from './components/MarsPanorama360';
import { MissionLanding } from './components/MissionLanding';
import { QrShareModal } from './components/QrShareModal';
import { SiteDossierPanel } from './components/SiteDossierPanel';
import { MissionStoriesTheater } from './stories/components/MissionStoriesTheater';
import { MARS_SITES } from './data/marsSites';
import type { AppMode, DataLayerId, RoverTelemetryState } from './types/mars';

const LAYER_OPTIONS: { id: DataLayerId; label: string }[] = [
  { id: 'optical', label: 'Optical Albedo' },
  { id: 'elevation', label: 'MOLA Elevation' },
  { id: 'slope', label: 'Slope Hazard' },
  { id: 'atmosphere', label: 'CO₂ Atmosphere' },
  { id: 'geology', label: 'USGS Geology' },
];

const INITIAL_ROVER_FALLBACK: RoverTelemetryState = {
  powered: false,
  activeSiteId: 'jezero',
  patrolActive: false,
  x: 16,
  y: 80,
  headingDeg: 45,
  distanceCm: 145,
  co2Ppm: 420,
  pitchDeg: 6.8,
  rollDeg: 1.2,
  batteryPct: 96,
  lastUpdated: Date.now(),
  source: 'standby',
  latestCameraFrame: null,
  cameraFrameTimestamp: null,
  cameraLabel: 'ESP32-CAM Standby',
  anomalies: [],
  trail: [],
};

function getInitialMissionParams(): {
  view: 'landing' | 'console' | 'stories';
  mode: AppMode;
  siteId: string;
  chapterId: string;
  viewportMode: 'orbit' | 'panorama';
} {
  if (typeof window === 'undefined') {
    return {
      view: 'landing',
      mode: 'archive',
      siteId: 'jezero',
      chapterId: 'jezero',
      viewportMode: 'orbit',
    };
  }
  const params = new URLSearchParams(window.location.search);
  const siteParam = params.get('site');
  const modeParam = params.get('mode');
  const viewParam = params.get('view');
  const chapterParam = params.get('chapter');
  const validSite =
    siteParam && MARS_SITES.some((s) => s.id === siteParam) ? siteParam : 'jezero';
  const validMode: AppMode = modeParam === 'rover' ? 'rover' : 'archive';
  const validViewport: 'orbit' | 'panorama' = viewParam === 'panorama' ? 'panorama' : 'orbit';
  const validChapter = chapterParam || validSite;

  let initialView: 'landing' | 'console' | 'stories' = 'landing';
  if (viewParam === 'stories') {
    initialView = 'stories';
  } else if (siteParam || modeParam || viewParam === 'panorama' || viewParam === 'console') {
    initialView = 'console';
  }

  return {
    view: initialView,
    mode: validMode,
    siteId: validSite,
    chapterId: validChapter,
    viewportMode: validViewport,
  };
}

function playAnomalyTone() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(740, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(520, ctx.currentTime + 0.16);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.19);
    setTimeout(() => void ctx.close(), 250);
  } catch {
    // Ignore autoplay restriction before user gesture
  }
}

export default function App() {
  const initial = useMemo(() => getInitialMissionParams(), []);

  const [view, setView] = useState<'landing' | 'console' | 'stories'>(initial.view);
  const [selectedChapterId, setSelectedChapterId] = useState<string>(initial.chapterId);
  const [mode, setMode] = useState<AppMode>(initial.mode);
  const [viewportMode, setViewportMode] = useState<'orbit' | 'panorama'>(initial.viewportMode);
  const [selectedSiteId, setSelectedSiteId] = useState<string>(initial.siteId);
  const [activeLayer, setActiveLayer] = useState<DataLayerId>('optical');
  const [roverState, setRoverState] = useState<RoverTelemetryState>(INITIAL_ROVER_FALLBACK);
  const [dockOpen, setDockOpen] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  const [inspectorOpen, setInspectorOpen] = useState<boolean>(true);
  const [hardwareModalOpen, setHardwareModalOpen] = useState<boolean>(false);
  const [qrModalOpen, setQrModalOpen] = useState<boolean>(false);

  const prevAnomalyCountRef = useRef(0);

  const activeSite = useMemo(
    () => MARS_SITES.find((s) => s.id === selectedSiteId) ?? MARS_SITES[0],
    [selectedSiteId]
  );

  // Sync state attributes for clean inspection
  useEffect(() => {
    document.body.dataset.view = view;
    document.body.dataset.mode = mode;
    document.body.dataset.viewportMode = viewportMode;
    document.body.dataset.site = selectedSiteId;
    document.body.dataset.layer = activeLayer;
    document.body.dataset.roverPowered = String(roverState.powered);
  }, [view, mode, viewportMode, selectedSiteId, activeLayer, roverState.powered]);

  // Silently warm browser image cache for all 5 360° panoramas so switching is instantaneous
  useEffect(() => {
    if (view !== 'console') return;
    for (const site of MARS_SITES) {
      const preload = new Image();
      preload.src = site.panoramaImage;
    }
  }, [view]);

  // WebSocket real-time telemetry subscription + initial REST fetch
  useEffect(() => {
    let closed = false;
    let ws: WebSocket | null = null;
    let reconnectTimer = 0;

    fetch('/api/rover/state')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: RoverTelemetryState | null) => {
        if (!closed && data && typeof data.x === 'number') {
          setRoverState(data);
        }
      })
      .catch(() => {});

    function connect() {
      if (closed) return;
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(`${proto}//${window.location.host}/ws`);
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string);
          if (msg && (msg.type === 'state:init' || msg.type === 'state:update')) {
            const nextState = msg.payload as RoverTelemetryState;
            setRoverState(nextState);
            if (
              nextState.anomalies.length > prevAnomalyCountRef.current &&
              nextState.powered
            ) {
              playAnomalyTone();
            }
            prevAnomalyCountRef.current = nextState.anomalies.length;
          }
        } catch {
          // Ignore malformed frame
        }
      };
      ws.onclose = () => {
        if (!closed) {
          reconnectTimer = window.setTimeout(connect, 1800);
        }
      };
    }

    connect();
    return () => {
      closed = true;
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, []);

  const sendControl = useCallback(async (payload: Record<string, unknown>) => {
    try {
      const res = await fetch('/api/rover/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.state) {
          setRoverState(json.state as RoverTelemetryState);
        }
      }
    } catch {
      // Transient network error ignored; WS will resync
    }
  }, []);

  const handleSelectSite = useCallback(
    (siteId: string) => {
      setSelectedSiteId(siteId);
      setInspectorOpen(true);
      void sendControl({ action: 'site', siteId });
    },
    [sendControl]
  );

  const handleOpenPanorama = useCallback(
    (siteId: string) => {
      setSelectedSiteId(siteId);
      setViewportMode('panorama');
      setInspectorOpen(true);
      void sendControl({ action: 'site', siteId });
    },
    [sendControl]
  );

  const handleStartMission = useCallback(
    (siteId?: string) => {
      if (siteId) {
        setSelectedSiteId(siteId);
        void sendControl({ action: 'site', siteId });
      }
      setViewportMode('orbit');
      setView('console');
      setInspectorOpen(true);
    },
    [sendControl]
  );

  const handleTogglePower = useCallback(() => {
    const nextPowered = !roverState.powered;
    if (nextPowered) {
      setMode('rover');
      setInspectorOpen(true);
    }
    void sendControl({ action: 'power', powered: nextPowered, siteId: selectedSiteId });
  }, [roverState.powered, selectedSiteId, sendControl]);

  // WASD / Arrow keys steer rover in Live Rover Mode
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (view !== 'console' || mode !== 'rover' || !roverState.powered) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const step = 4;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        void sendControl({ action: 'move', dx: 0, dy: -step });
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        void sendControl({ action: 'move', dx: 0, dy: step });
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        void sendControl({ action: 'move', dx: -step, dy: 0 });
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        void sendControl({ action: 'move', dx: step, dy: 0 });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [view, mode, roverState.powered, sendControl]);

  return (
    <>
      {view === 'landing' ? (
        <MissionLanding
          sites={MARS_SITES}
          selectedSiteId={selectedSiteId}
          roverState={roverState}
          onStartMission={handleStartMission}
          onStartStories={(chapterId) => {
            if (chapterId) setSelectedChapterId(chapterId);
            setView('stories');
          }}
          onOpenQr={() => setQrModalOpen(true)}
        />
      ) : view === 'stories' ? (
        <MissionStoriesTheater
          allSites={MARS_SITES}
          roverState={roverState}
          initialChapterId={selectedChapterId}
          onExit={() => setView('console')}
          onSelectSiteInConsole={(siteId) => {
            setSelectedSiteId(siteId);
            setView('console');
          }}
        />
      ) : (
        <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#020306] text-slate-100">
          {/* Strict 3-Zone Top Bar Contract */}
          <header className="h-14 shrink-0 border-b border-white/10 bg-[#070A10] px-5 flex items-center justify-between gap-8">
            <a
              href="#home"
              onClick={(e) => {
                e.preventDefault();
                setView('landing');
              }}
              className="font-display text-lg font-bold tracking-tight text-slate-50 whitespace-nowrap shrink-0 hover:text-amber-300 transition-colors"
            >
              AresWalk
            </a>

            <nav
              aria-label="Mission navigation"
              className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400"
            >
              <button
                type="button"
                onClick={() => setView('stories')}
                className="hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 text-amber-400 font-medium"
              >
                <Film className="w-3.5 h-3.5" />
                <span>Stories</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('archive')}
                className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
                  mode === 'archive' ? 'text-amber-300 underline underline-offset-4' : ''
                }`}
              >
                NASA Archive
              </button>
              <button
                type="button"
                onClick={() =>
                  setViewportMode((prev) => (prev === 'panorama' ? 'orbit' : 'panorama'))
                }
                className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  viewportMode === 'panorama'
                    ? 'text-cyan-300 underline underline-offset-4'
                    : ''
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{viewportMode === 'panorama' ? '3D Orbit' : '360° Surface'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('rover');
                  setInspectorOpen(true);
                }}
                className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
                  mode === 'rover' ? 'text-emerald-300 underline underline-offset-4' : ''
                }`}
              >
                Live Rover
              </button>
              <button
                type="button"
                onClick={() => setQrModalOpen(true)}
                className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
              >
                <QrCode className="w-3.5 h-3.5 text-amber-400" />
                <span>Mission QR</span>
              </button>
              <button
                type="button"
                onClick={() => setHardwareModalOpen(true)}
                className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0"
              >
                Hardware API
              </button>
              <button
                type="button"
                onClick={() => setInspectorOpen((prev) => !prev)}
                className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
              >
                {inspectorOpen ? (
                  <PanelRightClose className="w-4 h-4" />
                ) : (
                  <PanelRightOpen className="w-4 h-4" />
                )}
                <span>{inspectorOpen ? 'Hide Dossier' : 'Show Dossier'}</span>
              </button>
            </nav>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setQrModalOpen(true)}
                aria-label="Mission QR"
                className="md:hidden p-2 rounded border border-white/15 bg-white/5 hover:bg-white/10 text-amber-400 transition-colors"
              >
                <QrCode className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleTogglePower}
                className={`px-4 py-2 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 ${
                  roverState.powered
                    ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                    : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                }`}
              >
                {roverState.powered ? 'Stop Rover' : 'Power On Rover'}
              </button>
            </div>
          </header>

          {/* Main Split Workspace: Unobstructed 3D Mars Stage + Docked Inspector */}
          <main className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
            {/* Left/Center 3D Mars Orbital or 360° Surface Panorama Viewport */}
            <section
              aria-label={
                viewportMode === 'panorama'
                  ? '360° Martian Surface Panorama'
                  : '3D Mars Orbital Viewport'
              }
              className="relative flex-1 min-h-[340px] overflow-hidden"
            >
              {viewportMode === 'panorama' ? (
                <MarsPanorama360
                  site={activeSite}
                  allSites={MARS_SITES}
                  onSelectSite={handleSelectSite}
                  onBackToGlobe={() => setViewportMode('orbit')}
                />
              ) : (
                <>
                  <MarsGlobe3D
                    sites={MARS_SITES}
                    selectedSiteId={selectedSiteId}
                    activeLayer={activeLayer}
                    roverState={roverState}
                    onSelectSite={handleSelectSite}
                    onOpenPanorama={handleOpenPanorama}
                    showTerritories={true}
                  />

              {/* Top Viewport HUD Row: Orbital Readout + Instant Anomaly Alert (Zero Overlap) */}
              <div className="pointer-events-none absolute top-3 left-3 right-3 z-10 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div className="border border-white/10 bg-[#070A10]/95 rounded px-3.5 py-2.5 space-y-1.5 max-w-xs">
                  <div className="font-display text-sm font-semibold text-slate-50">
                    {activeSite.name}
                  </div>
                  <div className="font-mono-tabular text-[11px] text-slate-400">
                    {LAYER_OPTIONS.find((l) => l.id === activeLayer)?.label} ·{' '}
                    {activeSite.elevationM} m · {activeSite.meanSlopeDeg}°
                  </div>
                  <div className="font-mono-tabular text-[10px] text-slate-500">
                    Territory ~{Math.round(activeSite.areaKm2 / 1000)}k km² · Click region for 360°
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewportMode('panorama')}
                    className="pointer-events-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xs border border-amber-400/60 bg-amber-500/15 hover:bg-amber-500 hover:text-slate-950 text-[11px] font-semibold text-amber-200 transition-colors"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Enter 360° Surface View</span>
                  </button>
                  {activeLayer !== 'optical' && (
                    <div className="flex items-center gap-2 pt-0.5 text-[10px] font-mono-tabular text-slate-400">
                      <span>
                        {activeLayer === 'elevation'
                          ? '-8 km'
                          : activeLayer === 'slope'
                            ? '0° Safe'
                            : activeLayer === 'atmosphere'
                              ? 'Low CO₂'
                              : 'Lowlands'}
                      </span>
                      <div
                        className="h-1.5 flex-1 rounded-xs"
                        style={{
                          background:
                            activeLayer === 'elevation'
                              ? 'linear-gradient(90deg, #16308c, #24a8cd, #9cc146, #f04e23, #ffffff)'
                              : activeLayer === 'slope'
                                ? 'linear-gradient(90deg, #1c9862, #f5af2a, #ee3c2a)'
                                : activeLayer === 'atmosphere'
                                  ? 'linear-gradient(90deg, #ad569b, #1c86db, #1cd9f9)'
                                  : 'linear-gradient(90deg, #3494a6, #ca8c48, #ac4462)',
                        }}
                      />
                      <span>
                        {activeLayer === 'elevation'
                          ? '+21 km'
                          : activeLayer === 'slope'
                            ? '35°+ Risk'
                            : activeLayer === 'atmosphere'
                              ? 'Dense Basin'
                              : 'Volcanic'}
                      </span>
                    </div>
                  )}
                </div>

                {roverState.powered && roverState.anomalies.length > 0 && (
                  <div
                    role="status"
                    className="pointer-events-auto sm:max-w-sm border border-rose-500/80 bg-[#1B070C]/95 text-rose-100 px-3.5 py-2.5 rounded shadow-lg flex items-start gap-2.5"
                  >
                    <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div className="text-xs space-y-0.5 min-w-0">
                      <div className="font-semibold text-rose-100">
                        {roverState.anomalies[0].title}
                      </div>
                      <div className="font-mono-tabular text-[11px] text-rose-300/90">
                        {roverState.anomalies[0].measuredValue} · {roverState.anomalies[0].nasaBaseline}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Collapsible Bottom Control Dock (Zero Center Occlusion) */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center w-[min(860px,95%)]">
                <button
                  type="button"
                  onClick={() => setDockOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-t border border-b-0 border-white/15 bg-[#070A10]/95 text-[11px] font-medium text-slate-300 hover:text-white whitespace-nowrap"
                >
                  {dockOpen ? (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      <span>Hide Controls</span>
                    </>
                  ) : (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      <span>Show Controls</span>
                    </>
                  )}
                </button>

                {dockOpen && (
                  <div className="w-full border border-white/15 bg-[#070A10]/95 rounded p-2.5 space-y-2 shadow-2xl">
                    {/* Row 1: Mode Switcher + 5 NASA Sites */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1 p-0.5 bg-[#030508] border border-white/10 rounded">
                        <button
                          type="button"
                          onClick={() => setMode('archive')}
                          className={`px-2.5 py-1 text-xs font-medium rounded-xs transition-colors whitespace-nowrap ${
                            mode === 'archive'
                              ? 'bg-amber-500 text-slate-950 font-semibold'
                              : 'text-slate-400 hover:text-slate-100'
                          }`}
                        >
                          1. NASA 5-Site Data
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMode('rover');
                            setInspectorOpen(true);
                          }}
                          className={`px-2.5 py-1 text-xs font-medium rounded-xs transition-colors whitespace-nowrap ${
                            mode === 'rover'
                              ? 'bg-emerald-500 text-slate-950 font-semibold'
                              : 'text-slate-400 hover:text-slate-100'
                          }`}
                        >
                          2. Live Rover Mode
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-1">
                        {MARS_SITES.map((s) => {
                          const active = s.id === selectedSiteId;
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => handleSelectSite(s.id)}
                              className={`px-2.5 py-1 text-xs rounded-xs border transition-colors whitespace-nowrap ${
                                active
                                  ? 'border-amber-400 bg-amber-500/15 text-amber-200 font-semibold'
                                  : 'border-white/10 bg-[#030508] text-slate-300 hover:border-white/25'
                              }`}
                            >
                              {s.name.split(' · ')[0]}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Row 2: Layered Orbital Data Overlay Controls + Quick 360 Trigger */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-white/10">
                      <span className="text-[11px] text-slate-400 whitespace-nowrap">
                        Orbital Layer:
                      </span>
                      <div className="flex flex-wrap items-center gap-1">
                        {LAYER_OPTIONS.map((layer) => {
                          const active = layer.id === activeLayer;
                          return (
                            <button
                              key={layer.id}
                              type="button"
                              onClick={() => setActiveLayer(layer.id)}
                              className={`px-2.5 py-1 text-[11px] font-medium rounded-xs border transition-colors whitespace-nowrap ${
                                active
                                  ? 'border-cyan-400 bg-cyan-500/15 text-cyan-200'
                                  : 'border-white/10 bg-[#030508] text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {layer.label}
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => setViewportMode('panorama')}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-xs border border-amber-400/60 bg-amber-500/15 text-amber-200 hover:bg-amber-500 hover:text-slate-950 transition-colors whitespace-nowrap flex items-center gap-1"
                        >
                          <Globe className="w-3 h-3" />
                          <span>360° View</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedChapterId(selectedSiteId);
                            setView('stories');
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-xs border border-violet-400/60 bg-violet-500/15 text-violet-200 hover:bg-violet-500 hover:text-slate-950 transition-colors whitespace-nowrap flex items-center gap-1"
                        >
                          <Film className="w-3 h-3" />
                          <span>Cinematic Story</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
                </>
              )}
            </section>

            {/* Right Docked Mission Dossier / Live Rover Telemetry */}
            {inspectorOpen && (
              <aside
                aria-label="Mission Inspector"
                className="w-full lg:w-[420px] xl:w-[440px] h-[44vh] lg:h-full border-t lg:border-t-0 lg:border-l border-white/10 bg-[#080B11] shrink-0 overflow-hidden"
              >
                {mode === 'archive' ? (
                  <SiteDossierPanel
                    site={activeSite}
                    allSites={MARS_SITES}
                    activeLayer={activeLayer}
                    onSelectSite={handleSelectSite}
                    onOpenPanorama={() => setViewportMode('panorama')}
                    onSwitchToRover={() => {
                      setMode('rover');
                      if (!roverState.powered) {
                        void sendControl({
                          action: 'power',
                          powered: true,
                          siteId: selectedSiteId,
                        });
                      }
                    }}
                    onOpenQr={() => setQrModalOpen(true)}
                  />
                ) : (
                  <LiveRoverPanel
                    site={activeSite}
                    roverState={roverState}
                    onControl={sendControl}
                    onOpenHardwareModal={() => setHardwareModalOpen(true)}
                  />
                )}
              </aside>
            )}
          </main>
        </div>
      )}

      {hardwareModalOpen && (
        <HardwareApiModal
          activeSiteId={selectedSiteId}
          onClose={() => setHardwareModalOpen(false)}
          onOpenQr={() => setQrModalOpen(true)}
        />
      )}

      {qrModalOpen && (
        <QrShareModal
          activeSite={activeSite}
          onClose={() => setQrModalOpen(false)}
        />
      )}
    </>
  );
}