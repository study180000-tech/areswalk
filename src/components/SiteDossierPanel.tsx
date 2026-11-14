import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Compass,
  Expand,
  Globe,
  Image as ImageIcon,
  Layers,
  QrCode,
  ShieldAlert,
  X,
} from 'lucide-react';
import type { DataLayerId, MarsSite, SiteGalleryImage } from '../types/mars';
import { assessSiteSafety } from '../utils/marsLogic';
import { EvaRouteMap } from './EvaRouteMap';

interface SiteDossierPanelProps {
  site: MarsSite;
  allSites: MarsSite[];
  activeLayer: DataLayerId;
  onSelectSite: (id: string) => void;
  onOpenPanorama: () => void;
  onSwitchToRover: () => void;
  onOpenQr: () => void;
}

type DossierTab = 'telemetry' | 'route' | 'imagery';

function ThresholdBar({
  value,
  max,
  warnAt,
  dangerAt,
}: {
  value: number;
  max: number;
  warnAt: number;
  dangerAt: number;
}) {
  const pct = Math.max(4, Math.min(100, (value / max) * 100));
  const barColor =
    value >= dangerAt
      ? 'bg-rose-500'
      : value >= warnAt
        ? 'bg-amber-400'
        : 'bg-emerald-400';

  return (
    <div className="h-1.5 w-full bg-slate-800/90 rounded-xs overflow-hidden mt-2">
      <div
        className={`h-full ${barColor} transition-all duration-300`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function SiteDossierPanel({
  site,
  allSites,
  activeLayer,
  onSelectSite,
  onOpenPanorama,
  onSwitchToRover,
  onOpenQr,
}: SiteDossierPanelProps) {
  const [tab, setTab] = useState<DossierTab>('telemetry');
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState<number>(0);
  const [lightboxImg, setLightboxImg] = useState<SiteGalleryImage | null>(null);
  const [imgFailed, setImgFailed] = useState<Record<string, boolean>>({});
  const safety = assessSiteSafety(site);

  useEffect(() => {
    setSelectedPhotoIdx(0);
  }, [site.id]);

  const activePhoto = site.gallery[selectedPhotoIdx] ?? site.gallery[0];

  const verdictConfig =
    safety.verdict === 'SAFE'
      ? {
          icon: CheckCircle2,
          label: 'LOW REGIONAL SLOPE · LOCAL DEM CHECK',
          cls: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300',
        }
      : safety.verdict === 'CAUTION'
        ? {
            icon: AlertTriangle,
            label: 'TERRAIN CAUTION · SLOPE & MOBILITY FACTORS',
            cls: 'border-amber-500/40 bg-amber-950/30 text-amber-300',
          }
        : {
            icon: ShieldAlert,
            label: 'HIGH RELIEF · ROBOTIC SCOUT RECOMMENDED',
            cls: 'border-rose-500/40 bg-rose-950/30 text-rose-300',
          };

  const VerdictIcon = verdictConfig.icon;
  const o2Trace = Math.max(0.12, +(100 - site.atmosphereMix.co2 - site.atmosphereMix.n2 - site.atmosphereMix.ar).toFixed(2));

  return (
    <div className="flex flex-col h-full bg-[#090C12]">
      {/* Territory Identity Header */}
      <div className="p-4 border-b border-white/10 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-xl font-bold text-slate-50 leading-tight truncate">
              {site.name}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 truncate">{site.subtitle}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onOpenPanorama}
                aria-label="Open 360 degree surface panorama"
                className="flex items-center gap-1 px-2.5 py-1 rounded-xs border border-amber-400/60 bg-amber-500/15 text-[11px] font-semibold text-amber-200 hover:bg-amber-500 hover:text-slate-950 transition-colors whitespace-nowrap"
              >
                <Globe className="w-3 h-3" />
                <span>360° View</span>
              </button>
              <button
                type="button"
                onClick={onOpenQr}
                aria-label="Open site QR code"
                className="flex items-center gap-1 px-2 py-1 rounded-xs border border-white/15 bg-[#04060A] text-[11px] font-medium text-slate-200 hover:border-amber-400 transition-colors whitespace-nowrap"
              >
                <QrCode className="w-3 h-3 text-amber-400" />
                <span>QR</span>
              </button>
            </div>
            <div className="font-mono-tabular text-[11px] text-slate-400">
              {site.lat >= 0 ? `${site.lat}°N` : `${Math.abs(site.lat)}°S`} · {site.lon}°E
            </div>
          </div>
        </div>

        {/* Clean Unboxed Territory Metadata */}
        <div className="flex items-center justify-between text-[11px] font-mono-tabular text-slate-400">
          <span>
            Territory <strong className="text-slate-200">{site.areaKm2.toLocaleString()} km²</strong>
          </span>
          <span>
            Span <strong className="text-slate-200">Ø {site.diameterKm} km</strong>
          </span>
          <span>
            Elev <strong className="text-slate-200">{site.elevationM > 0 ? `+${site.elevationM.toLocaleString()}` : site.elevationM.toLocaleString()} m</strong>
          </span>
        </div>
        <div className="font-mono-tabular text-[10px] text-slate-500 truncate">
          Datum: {site.elevationDatum}
        </div>

        {/* Safety Verdict Strip */}
        <div className={`border rounded p-2.5 flex items-center justify-between gap-2 ${verdictConfig.cls}`}>
          <div className="flex items-center gap-2 min-w-0">
            <VerdictIcon className="w-4 h-4 shrink-0" />
            <span className="text-xs font-semibold truncate">{verdictConfig.label}</span>
          </div>
          <span className="font-mono-tabular text-xs font-bold shrink-0">
            {safety.score}/100
          </span>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-[#04060A] border border-white/10 rounded">
          <button
            type="button"
            onClick={() => setTab('telemetry')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-medium rounded-xs transition-colors whitespace-nowrap ${
              tab === 'telemetry'
                ? 'bg-white/10 text-amber-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>NASA Data</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('route')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-medium rounded-xs transition-colors whitespace-nowrap ${
              tab === 'route'
                ? 'bg-white/10 text-cyan-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>EVA Route</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('imagery')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-medium rounded-xs transition-colors whitespace-nowrap ${
              tab === 'imagery'
                ? 'bg-white/10 text-slate-100'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Gallery ({site.gallery.length})</span>
          </button>
        </div>
      </div>

      {/* Organized Scrollable Dossier Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {tab === 'telemetry' && (
          <>
            {/* Active Orbital Layer Analysis */}
            <div className="border border-cyan-500/30 bg-cyan-950/20 rounded p-3 space-y-1">
              <div className="text-[11px] font-mono-tabular uppercase tracking-wider text-cyan-300">
                Active Orbital Layer · {activeLayer}
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {site.layerNotes[activeLayer]}
              </p>
            </div>

            {/* Section 1: Suit & Surface Safety Thresholds */}
            <div className="space-y-2">
              <h3 className="text-[11px] font-mono-tabular uppercase tracking-wider text-slate-400">
                Suit &amp; Surface Safety Thresholds
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="border border-white/10 bg-[#04060A] p-3 rounded">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Mean Slope</span>
                    <span className="font-mono-tabular">Limit 15°</span>
                  </div>
                  <div className="flex items-baseline justify-between mt-0.5">
                    <span className="font-mono-tabular text-lg font-semibold text-slate-100">
                      {site.meanSlopeDeg.toFixed(1)}°
                    </span>
                    <span className="font-mono-tabular text-[11px] text-slate-500">
                      max {site.maxSlopeDeg}°
                    </span>
                  </div>
                  <ThresholdBar value={site.meanSlopeDeg} max={28} warnAt={10} dangerAt={15} />
                </div>

                <div className="border border-white/10 bg-[#04060A] p-3 rounded">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Radiation Dose</span>
                    <span className="font-mono-tabular">Limit 1.0</span>
                  </div>
                  <div className="font-mono-tabular text-lg font-semibold text-slate-100 mt-0.5">
                    {site.radiationMsvDay}{' '}
                    <span className="text-xs font-normal text-slate-400">mSv/d</span>
                  </div>
                  <ThresholdBar value={site.radiationMsvDay} max={1.4} warnAt={0.7} dangerAt={0.95} />
                </div>

                <div className="border border-white/10 bg-[#04060A] p-3 rounded">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Dust Opacity</span>
                    <span className="font-mono-tabular">{site.pressureKpa} kPa</span>
                  </div>
                  <div className="font-mono-tabular text-lg font-semibold text-slate-100 mt-0.5">
                    τ {site.dustOpacityTau}
                  </div>
                  <ThresholdBar value={site.dustOpacityTau} max={1.2} warnAt={0.6} dangerAt={0.85} />
                </div>

                <div className="border border-white/10 bg-[#04060A] p-3 rounded">
                  <div className="text-[11px] text-slate-400">Surface Temp</div>
                  <div className="font-mono-tabular text-lg font-semibold text-amber-300 mt-0.5">
                    {site.tempAvgC}°C
                  </div>
                  <div className="font-mono-tabular text-[11px] text-slate-500 mt-1">
                    Range {site.tempMinC}°C to {site.tempMaxC}°C
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Atmospheric Composition & Provenance */}
            <div className="border border-white/10 bg-[#04060A] p-3 rounded space-y-2.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-mono-tabular uppercase tracking-wider">
                  Atmosphere Composition
                </span>
                <span className="font-mono-tabular text-slate-300">
                  {site.co2BaselinePpm} ppm ref
                </span>
              </div>
              <div className="h-2 w-full rounded-xs overflow-hidden flex bg-slate-900">
                <div
                  className="bg-amber-400 h-full"
                  style={{ width: `${site.atmosphereMix.co2}%` }}
                  title={`CO₂ ${site.atmosphereMix.co2}%`}
                />
                <div
                  className="bg-sky-400 h-full"
                  style={{ width: `${site.atmosphereMix.n2}%` }}
                  title={`N₂ ${site.atmosphereMix.n2}%`}
                />
                <div
                  className="bg-violet-400 h-full"
                  style={{ width: `${site.atmosphereMix.ar}%` }}
                  title={`Ar ${site.atmosphereMix.ar}%`}
                />
              </div>
              <div className="grid grid-cols-4 gap-2 text-[11px] font-mono-tabular text-slate-300">
                <div>CO₂ {site.atmosphereMix.co2}%</div>
                <div>N₂ {site.atmosphereMix.n2}%</div>
                <div>Ar {site.atmosphereMix.ar}%</div>
                <div>O₂/Tr {o2Trace}%</div>
              </div>
              <div className="pt-1.5 border-t border-white/10 space-y-1 text-[10px] font-mono-tabular text-slate-400">
                <div>CO₂ Source: {site.co2MeasurementSource}</div>
                <div>Pressure: {site.pressureNote}</div>
              </div>
            </div>

            {/* Section 3: Water Ice & Geological Directive */}
            <div className="space-y-2.5 border-t border-white/10 pt-3">
              <div>
                <div className="text-[11px] font-mono-tabular uppercase tracking-wider text-slate-400">
                  Subsurface Water &amp; Hydration
                </div>
                <p className="text-xs text-slate-200 mt-1">{site.waterIcePotential}</p>
              </div>
              <div>
                <div className="text-[11px] font-mono-tabular uppercase tracking-wider text-slate-400">
                  USGS Geology &amp; Mobility Notes
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mt-1">
                  {site.geologySummary}
                </p>
                <div className="border border-white/10 bg-[#04060A] p-2.5 rounded mt-2">
                  <p className="text-xs text-amber-300 leading-relaxed">
                    {site.evaRecommendation}
                  </p>
                </div>
                <div className="border border-slate-800/90 bg-[#05070B] p-2.5 rounded mt-2">
                  <div className="text-[10px] font-mono-tabular uppercase tracking-wider text-slate-500 mb-1">
                    NASA Scientific Caveats &amp; Datum Scope
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {site.scientificCaveats}
                  </p>
                </div>
              </div>
            </div>

            {/* Section 4: NASA Mission Sources */}
            <div className="border-t border-white/10 pt-3 space-y-1">
              <div className="text-[11px] font-mono-tabular uppercase tracking-wider text-slate-400">
                NASA Mission Sources
              </div>
              <div className="text-xs text-slate-300 font-mono-tabular">
                {site.missionRef} · {site.nasaSources.join(' · ')}
              </div>
            </div>
          </>
        )}

        {tab === 'route' && <EvaRouteMap site={site} />}

        {tab === 'imagery' && activePhoto && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={onOpenPanorama}
              className="w-full py-2.5 px-3 rounded border border-amber-400/60 bg-amber-500/15 hover:bg-amber-500 hover:text-slate-950 text-xs font-semibold text-amber-200 transition-colors flex items-center justify-center gap-2"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Launch Interactive 3D 360° Surface Panorama</span>
            </button>

            {/* Active Region Featured Image Stage */}
            <div className="border border-white/10 bg-[#04060A] rounded overflow-hidden">
              <div className="relative group">
                {!imgFailed[activePhoto.id] ? (
                  <img
                    src={activePhoto.url}
                    alt={activePhoto.title}
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setImgFailed((prev) => ({ ...prev, [activePhoto.id]: true }))
                    }
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-slate-900 flex flex-col items-center justify-center text-xs text-slate-400 p-4 text-center">
                    <ImageIcon className="w-6 h-6 mb-2 text-slate-500" />
                    <span>{activePhoto.title}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setLightboxImg(activePhoto)}
                  aria-label={`Expand ${activePhoto.title}`}
                  className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded bg-[#04060A]/90 border border-white/20 text-[11px] text-slate-200 hover:border-amber-400"
                >
                  <Expand className="w-3 h-3" />
                  <span>Full View</span>
                </button>
              </div>
              <div className="p-3 space-y-1">
                <div className="text-xs font-semibold text-slate-100">
                  {activePhoto.title}
                </div>
                <div className="font-mono-tabular text-[11px] text-slate-400">
                  {activePhoto.source} · {activePhoto.instrument}
                </div>
              </div>
            </div>

            {/* Region Multi-Mission Photo Selector Strip */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-300">
                {site.name} NASA Imagery ({site.gallery.length})
              </div>
              <div className="grid grid-cols-3 gap-2">
                {site.gallery.map((photo, idx) => {
                  const isSel = idx === selectedPhotoIdx;
                  return (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => setSelectedPhotoIdx(idx)}
                      className={`border rounded overflow-hidden text-left transition-colors ${
                        isSel
                          ? 'border-amber-400 bg-white/5'
                          : 'border-white/10 bg-[#04060A] hover:border-white/30'
                      }`}
                    >
                      <img
                        src={photo.url}
                        alt={photo.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-16 object-cover"
                      />
                      <div className="p-1.5">
                        <div className="text-[10px] font-medium text-slate-200 truncate">
                          {photo.instrument}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Switch Across All 5 Territories */}
            <div className="space-y-2 border-t border-white/10 pt-3">
              <div className="text-xs font-semibold text-slate-300">
                All 5 NASA Exploration Territories
              </div>
              <div className="grid grid-cols-1 gap-2">
                {allSites.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onSelectSite(s.id)}
                    className={`flex items-center gap-3 p-2 rounded border text-left transition-colors ${
                      s.id === site.id
                        ? 'border-amber-400 bg-white/5'
                        : 'border-white/10 bg-[#04060A] hover:border-white/30'
                    }`}
                  >
                    <img
                      src={s.surfaceImage}
                      alt={s.name}
                      referrerPolicy="no-referrer"
                      className="w-16 h-11 object-cover rounded-xs shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-100 truncate">
                        {s.name}
                      </div>
                      <div className="font-mono-tabular text-[11px] text-slate-400">
                        {Math.round(s.areaKm2 / 1000)}k km² · {s.gallery.length} photos · {s.safetyVerdict}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Action to Deploy Live Rover at This Site */}
      <div className="p-3 border-t border-white/10 bg-[#04060A]">
        <button
          type="button"
          onClick={onSwitchToRover}
          className="w-full py-2.5 px-4 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-colors whitespace-nowrap"
        >
          Deploy Live Rover at {site.name}
        </button>
      </div>

      {/* Fullscreen NASA Imagery Lightbox */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={lightboxImg.title}
        >
          <div className="w-full max-w-4xl border border-white/20 bg-[#090C12] rounded overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div>
                <h3 className="font-display text-sm font-bold text-slate-100">
                  {site.name} — {lightboxImg.title}
                </h3>
                <p className="text-xs text-slate-400">
                  {lightboxImg.source} · {lightboxImg.instrument}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLightboxImg(null)}
                aria-label="Close image preview"
                className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={lightboxImg.url}
              alt={lightboxImg.title}
              referrerPolicy="no-referrer"
              className="w-full max-h-[72vh] object-contain bg-black"
            />
          </div>
        </div>
      )}
    </div>
  );
}