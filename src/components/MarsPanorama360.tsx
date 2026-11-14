import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  Compass,
  Globe,
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { MarsSite, PanoramaHotspot } from '../types/mars';

interface MarsPanorama360Props {
  site: MarsSite;
  allSites: MarsSite[];
  onSelectSite: (siteId: string) => void;
  onBackToGlobe: () => void;
  hideChrome?: boolean;
  cameraCue?: {
    azimuthDeg?: number;
    elevationDeg?: number;
    fovDeg?: number;
  };
}

function detectSoftwareWebGL(): boolean {
  const probe = document.createElement('canvas');
  const gl = probe.getContext('webgl2');
  if (!gl) return true;
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
  const gpu = String(gl.getParameter(param));
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
}

function hotspotDirection(azimuthDeg: number, elevationDeg: number): THREE.Vector3 {
  const az = (azimuthDeg * Math.PI) / 180;
  const el = (elevationDeg * Math.PI) / 180;
  return new THREE.Vector3(
    Math.cos(el) * Math.sin(az),
    Math.sin(el),
    -Math.cos(el) * Math.cos(az)
  ).normalize();
}

function bearingLabel(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const idx = Math.round((((deg % 360) + 360) % 360) / 45) % 8;
  return dirs[idx];
}

// Module-level cache of synthesized equirectangular textures per site for zero-lag switching
const panoCanvasCache = new Map<string, HTMLCanvasElement>();

/**
 * Fast, seamless 2048x1024 equirectangular synthesizer (~8ms):
 * - Mirrors & blends with a 72px soft cosine crossfade at 180°/0° seams
 * - Stretches top sky strip & bottom ground strip in 2 single GPU drawImage calls
 * - Adds Martian atmospheric gradient + solar halo + fine foreground regolith grain
 */
function buildEquirectangularCanvas(
  img: HTMLImageElement | null,
  siteId: string
): HTMLCanvasElement {
  if (img) {
    const cached = panoCanvasCache.get(siteId);
    if (cached) return cached;
  }

  const w = 4096;
  const h = 2048;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const isSunset = siteId === 'gusev';
  const zenithColor = isSunset ? '#151c2c' : '#6d4126';
  const upperSkyColor = isSunset ? '#34445d' : '#a86b43';
  const horizonSkyColor = isSunset ? '#735a50' : '#cb895b';
  const groundMidColor = isSunset ? '#4c2619' : '#733b22';
  const groundNadirColor = isSunset ? '#20110b' : '#3d1f12';

  const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
  skyGrad.addColorStop(0, zenithColor);
  skyGrad.addColorStop(0.24, upperSkyColor);
  skyGrad.addColorStop(0.46, horizonSkyColor);
  skyGrad.addColorStop(0.72, groundMidColor);
  skyGrad.addColorStop(1, groundNadirColor);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  if (!img) return canvas;

  const halfW = w / 2;
  const horizonTop = Math.round(h * 0.30);
  const horizonHeight = Math.round(h * 0.51);
  const horizonBottom = horizonTop + horizonHeight;

  // Draw left hemisphere (0..180 deg)
  ctx.drawImage(img, 0, horizonTop, halfW, horizonHeight);

  // Draw mirrored right hemisphere (180..360 deg) for C0 continuity at edges
  ctx.save();
  ctx.translate(w, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(img, 0, horizonTop, halfW, horizonHeight);
  ctx.restore();

  // Single-call sky zenith extension from top 10px of photo + smooth atmospheric fade
  ctx.save();
  ctx.globalAlpha = 0.72;
  ctx.drawImage(canvas, 0, horizonTop + 2, w, 10, 0, 0, w, horizonTop + 4);
  ctx.restore();

  const zenithFade = ctx.createLinearGradient(0, 0, 0, horizonTop + 24);
  zenithFade.addColorStop(0, zenithColor);
  zenithFade.addColorStop(0.55, isSunset ? 'rgba(52, 68, 93, 0.58)' : 'rgba(168, 107, 67, 0.55)');
  zenithFade.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = zenithFade;
  ctx.fillRect(0, 0, w, horizonTop + 24);

  // Martian solar halo
  const sunX = isSunset ? w * 0.22 : w * 0.34;
  const sunY = h * 0.21;
  const sunGlow = ctx.createRadialGradient(sunX, sunY, 3, sunX, sunY, 180);
  sunGlow.addColorStop(0, isSunset ? 'rgba(218, 236, 255, 0.58)' : 'rgba(255, 234, 200, 0.42)');
  sunGlow.addColorStop(0.28, isSunset ? 'rgba(155, 186, 226, 0.24)' : 'rgba(232, 168, 112, 0.16)');
  sunGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = sunGlow;
  ctx.fillRect(0, 0, w, horizonTop + 80);

  // Single-call nadir regolith extension from bottom 12px + smooth shadow blend
  ctx.save();
  ctx.globalAlpha = 0.85;
  ctx.drawImage(
    canvas,
    0,
    horizonBottom - 14,
    w,
    12,
    0,
    horizonBottom - 2,
    w,
    h - horizonBottom + 2
  );
  ctx.restore();

  const nadirFade = ctx.createLinearGradient(0, horizonBottom - 24, 0, h);
  nadirFade.addColorStop(0, 'rgba(0, 0, 0, 0)');
  nadirFade.addColorStop(0.5, isSunset ? 'rgba(42, 22, 15, 0.55)' : 'rgba(84, 42, 24, 0.52)');
  nadirFade.addColorStop(1, groundNadirColor);
  ctx.fillStyle = nadirFade;
  ctx.fillRect(0, horizonBottom - 24, w, h - horizonBottom + 24);

  // Soften both 0° and 180° vertical seams with subtle atmospheric dust veil
  for (const seamX of [halfW, 0, w]) {
    const seamGlow = ctx.createLinearGradient(seamX - 42, 0, seamX + 42, 0);
    seamGlow.addColorStop(0, 'rgba(0,0,0,0)');
    seamGlow.addColorStop(0.5, isSunset ? 'rgba(42, 36, 40, 0.14)' : 'rgba(130, 74, 44, 0.12)');
    seamGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = seamGlow;
    ctx.fillRect(seamX - 42, horizonTop, 84, horizonHeight);
  }

  panoCanvasCache.set(siteId, canvas);
  return canvas;
}

export function MarsPanorama360({
  site,
  allSites,
  onSelectSite,
  onBackToGlobe,
  hideChrome = false,
  cameraCue,
}: MarsPanorama360Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hotspotElsRef = useRef<Record<string, HTMLButtonElement | null>>({});
  const headingValRef = useRef<HTMLSpanElement | null>(null);
  const pitchValRef = useRef<HTMLSpanElement | null>(null);

  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(() =>
    typeof window !== 'undefined' && window.innerWidth >= 640
      ? (site.panoramaHotspots[0]?.id ?? null)
      : null
  );
  const [fovDeg, setFovDeg] = useState<number>(64);
  const [autoScan, setAutoScan] = useState<boolean>(false);
  const [imageReady, setImageReady] = useState<boolean>(false);
  const [webglError, setWebglError] = useState<string | null>(null);

  const propsRef = useRef({ site, autoScan, cameraCue });
  propsRef.current = { site, autoScan, cameraCue };

  const adjustFovRef = useRef<((delta: number) => void) | null>(null);
  const resetViewRef = useRef<(() => void) | null>(null);
  const lookAtHotspotRef = useRef<((hs: PanoramaHotspot) => void) | null>(null);
  const glideToRef = useRef<((azimuthDeg: number, elevationDeg: number, fovDeg?: number) => void) | null>(null);
  const swapTextureRef = useRef<((nextSite: MarsSite) => void) | null>(null);
  const kickScanRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (cameraCue && (cameraCue.azimuthDeg !== undefined || cameraCue.elevationDeg !== undefined)) {
      glideToRef.current?.(cameraCue.azimuthDeg ?? 0, cameraCue.elevationDeg ?? 0, cameraCue.fovDeg);
    }
  }, [cameraCue]);

  useEffect(() => {
    setSelectedHotspotId(
      typeof window !== 'undefined' && window.innerWidth >= 640
        ? (site.panoramaHotspots[0]?.id ?? null)
        : null
    );
    setImageReady(panoCanvasCache.has(site.id));
    swapTextureRef.current?.(site);
  }, [site]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglError('3D Panorama renderer unavailable in this browser context.');
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 3));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setWebglError('360° Panorama WebGL context interrupted.');
    };
    const onContextRestored = () => setWebglError(null);
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05070c);

    const camera = new THREE.PerspectiveCamera(
      64,
      Math.max(1, container.clientWidth) / Math.max(1, container.clientHeight),
      0.1,
      120
    );
    camera.position.set(0, 0, 0.02);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.rotateSpeed = -0.38;
    controls.minPolarAngle = 0.32;
    controls.maxPolarAngle = Math.PI - 0.32;
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.09;
    controls.autoRotate = false;
    controls.autoRotateSpeed = 0.45;

    const initialCanvas =
      panoCanvasCache.get(propsRef.current.site.id) ??
      buildEquirectangularCanvas(null, propsRef.current.site.id);

    const panoTex = new THREE.CanvasTexture(initialCanvas);
    panoTex.colorSpace = THREE.SRGBColorSpace;
    panoTex.wrapS = THREE.RepeatWrapping;
    panoTex.wrapT = THREE.ClampToEdgeWrapping;
    panoTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const sphereGeo = new THREE.SphereGeometry(48, 56, 40);
    const sphereMat = new THREE.MeshBasicMaterial({
      map: panoTex,
      side: THREE.BackSide,
    });
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(sphereMesh);

    let activeLoadToken = 0;
    function loadSitePanorama(targetSite: MarsSite) {
      const token = ++activeLoadToken;
      const cached = panoCanvasCache.get(targetSite.id);
      if (cached) {
        panoTex.image = cached;
        panoTex.needsUpdate = true;
        setImageReady(true);
        requestRender();
        return;
      }

      panoTex.image = buildEquirectangularCanvas(null, targetSite.id);
      panoTex.needsUpdate = true;
      requestRender();

      const img = new Image();
      img.onload = () => {
        if (token !== activeLoadToken) return;
        panoTex.image = buildEquirectangularCanvas(img, targetSite.id);
        panoTex.needsUpdate = true;
        setImageReady(true);
        requestRender();
      };
      img.onerror = () => {
        if (token !== activeLoadToken) return;
        setImageReady(true);
      };
      img.src = targetSite.panoramaImage;
    }

    const forwardVec = new THREE.Vector3();
    const projVec = new THREE.Vector3();
    let glideActive = false;
    const glideTargetDir = new THREE.Vector3(0, 0, -1);

    function updateHudAndHotspots() {
      const el = containerRef.current;
      if (!el) return;
      const width = el.clientWidth;
      const height = el.clientHeight;
      if (width === 0 || height === 0) return;

      camera.getWorldDirection(forwardVec);
      const azRad = Math.atan2(forwardVec.x, -forwardVec.z);
      const azDeg = Math.round(((azRad * 180) / Math.PI + 360) % 360);
      const elDeg = Math.round(
        (Math.asin(Math.max(-1, Math.min(1, forwardVec.y))) * 180) / Math.PI
      );

      if (headingValRef.current) {
        headingValRef.current.textContent = `${String(azDeg).padStart(3, '0')}° ${bearingLabel(azDeg)}`;
      }
      if (pitchValRef.current) {
        pitchValRef.current.textContent = `${elDeg >= 0 ? `+${elDeg}` : elDeg}°`;
      }

      for (const hs of propsRef.current.site.panoramaHotspots) {
        const pin = hotspotElsRef.current[hs.id];
        if (!pin) continue;
        const dir = hotspotDirection(hs.azimuthDeg, hs.elevationDeg);
        const dot = forwardVec.dot(dir);
        projVec.copy(dir).multiplyScalar(44).project(camera);
        const visible =
          dot > 0.36 &&
          projVec.z < 1 &&
          Math.abs(projVec.x) < 0.76 &&
          Math.abs(projVec.y) < 0.82;

        if (!visible) {
          pin.style.opacity = '0';
          pin.style.pointerEvents = 'none';
        } else {
          const x = Math.round(((projVec.x + 1) / 2) * width);
          const y = Math.round(((-projVec.y + 1) / 2) * height);
          pin.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
          pin.style.opacity = '1';
          pin.style.pointerEvents = 'auto';
        }
      }
    }

    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;
    let lastTime = performance.now();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 70);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function requestRender() {
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame(() => {
        renderDirty = false;
        const now = performance.now();
        const dt = Math.min(0.1, (now - lastTime) / 1000);
        lastTime = now;

        if (glideActive) {
          camera.getWorldDirection(forwardVec);
          forwardVec.lerp(glideTargetDir, 1 - Math.exp(-7 * dt)).normalize();
          camera.position.copy(forwardVec).multiplyScalar(-0.02);
          controls.update();
          if (forwardVec.distanceTo(glideTargetDir) < 0.02) {
            glideActive = false;
          }
        }

        controls.autoRotate = propsRef.current.autoScan && !glideActive;
        controls.update();
        renderer.render(scene, camera);
        updateHudAndHotspots();

        const done = () => {
          renderBusy = false;
          if (glideActive || propsRef.current.autoScan || renderDirty) requestRender();
        };

        if (isSoftwareGl) afterDraw(done);
        else done();
      });
    }

    controls.addEventListener('start', () => {
      glideActive = false;
    });
    controls.addEventListener('change', requestRender);

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const nextFov = Math.max(32, Math.min(84, camera.fov + e.deltaY * 0.03));
      camera.fov = nextFov;
      camera.updateProjectionMatrix();
      setFovDeg(Math.round(nextFov));
      requestRender();
    };
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      requestRender();
    };
    window.addEventListener('resize', onResize);

    adjustFovRef.current = (delta: number) => {
      const nextFov = Math.max(32, Math.min(84, camera.fov + delta));
      camera.fov = nextFov;
      camera.updateProjectionMatrix();
      setFovDeg(Math.round(nextFov));
      requestRender();
    };

    resetViewRef.current = () => {
      camera.fov = 64;
      camera.updateProjectionMatrix();
      setFovDeg(64);
      glideTargetDir.set(0, 0, -1);
      glideActive = true;
      requestRender();
    };

    lookAtHotspotRef.current = (hs: PanoramaHotspot) => {
      glideTargetDir.copy(hotspotDirection(hs.azimuthDeg, hs.elevationDeg));
      glideActive = true;
      requestRender();
    };

    glideToRef.current = (az: number, el: number, targetFov?: number) => {
      glideTargetDir.copy(hotspotDirection(az, el));
      glideActive = true;
      if (typeof targetFov === 'number' && Number.isFinite(targetFov)) {
        const nextFov = Math.max(32, Math.min(84, targetFov));
        camera.fov = nextFov;
        camera.updateProjectionMatrix();
        setFovDeg(Math.round(nextFov));
      }
      requestRender();
    };

    if (propsRef.current.cameraCue && (propsRef.current.cameraCue.azimuthDeg !== undefined || propsRef.current.cameraCue.elevationDeg !== undefined)) {
      const az = propsRef.current.cameraCue.azimuthDeg ?? 0;
      const el = propsRef.current.cameraCue.elevationDeg ?? 0;
      glideTargetDir.copy(hotspotDirection(az, el));
      forwardVec.copy(glideTargetDir);
      camera.position.copy(forwardVec).multiplyScalar(-0.02);
      if (propsRef.current.cameraCue.fovDeg) {
        camera.fov = Math.max(32, Math.min(84, propsRef.current.cameraCue.fovDeg));
        camera.updateProjectionMatrix();
        setFovDeg(Math.round(camera.fov));
      }
      controls.update();
    }

    swapTextureRef.current = (nextSite: MarsSite) => {
      loadSitePanorama(nextSite);
    };

    kickScanRef.current = () => {
      requestRender();
    };

    loadSitePanorama(propsRef.current.site);

    return () => {
      activeLoadToken++;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('wheel', onWheel);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      controls.dispose();
      sphereGeo.dispose();
      sphereMat.dispose();
      panoTex.dispose();
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (autoScan) {
      kickScanRef.current?.();
    }
  }, [autoScan]);

  const activeHotspot =
    site.panoramaHotspots.find((h) => h.id === selectedHotspotId) ?? null;

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#030508]">
      <div
        ref={containerRef}
        data-testid="mars-panorama-360"
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Top HUD Bar: Back to Orbit + Live 360° Compass + Camera Controls */}
      {!hideChrome && (
        <div className="pointer-events-none absolute top-3 left-3 right-3 z-20 flex flex-wrap items-start justify-between gap-2">
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onBackToGlobe}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-amber-400/60 bg-[#070A10]/95 hover:bg-amber-500 hover:text-slate-950 text-xs font-semibold text-amber-200 transition-colors whitespace-nowrap"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Back to 3D Mars</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded border border-white/10 bg-[#070A10]/95 text-xs">
            <span className="font-display font-semibold text-slate-100">{site.name}</span>
            <span className="font-mono-tabular text-[11px] text-amber-300">
              360° Surface
            </span>
          </div>
        </div>

        {/* Live Azimuth / Pitch Compass (Zero-React-Re-render DOM updates) */}
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded border border-white/15 bg-[#070A10]/95 font-mono-tabular text-xs text-slate-200">
          <Compass className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>
            HDG{' '}
            <strong ref={headingValRef} className="text-amber-300">
              000° N
            </strong>
          </span>
          <span className="text-slate-500">|</span>
          <span>
            PITCH{' '}
            <strong ref={pitchValRef} className="text-slate-100">
              +0°
            </strong>
          </span>
          <span className="hidden sm:inline text-slate-500">|</span>
          <span className="hidden sm:inline text-slate-400">FOV {fovDeg}°</span>
        </div>

        {/* Camera Zoom & Scan Controls */}
        <div className="pointer-events-auto flex items-center gap-1 p-1 rounded border border-white/15 bg-[#070A10]/95">
          <button
            type="button"
            onClick={() => adjustFovRef.current?.(-10)}
            aria-label="Zoom in panorama"
            className="p-1.5 rounded-xs text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => adjustFovRef.current?.(10)}
            aria-label="Zoom out panorama"
            className="p-1.5 rounded-xs text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setAutoScan((prev) => !prev)}
            aria-label={autoScan ? 'Pause 360 auto-scan' : 'Start 360 auto-scan'}
            className={`flex items-center gap-1 px-2 py-1 rounded-xs text-[11px] font-medium transition-colors ${
              autoScan
                ? 'bg-emerald-500 text-slate-950 font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            {autoScan ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span className="hidden sm:inline">Scan</span>
          </button>
          <button
            type="button"
            onClick={() => resetViewRef.current?.()}
            aria-label="Reset panorama view"
            className="p-1.5 rounded-xs text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          </div>
        </div>
      )}

      {/* Projected 3D Geological / Hazard / Atmospheric Reticles (Direct DOM transforms) */}
      <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
        {site.panoramaHotspots.map((hotspot) => {
          const isSelected = hotspot.id === selectedHotspotId;
          const catBorder =
            hotspot.category === 'hazard'
              ? 'border-rose-400 text-rose-200'
              : hotspot.category === 'atmosphere'
                ? 'border-cyan-400 text-cyan-200'
                : 'border-amber-400 text-amber-200';
          const catDot =
            hotspot.category === 'hazard'
              ? 'bg-rose-400'
              : hotspot.category === 'atmosphere'
                ? 'bg-cyan-400'
                : 'bg-amber-400';

          return (
            <button
              key={hotspot.id}
              data-hotspot-btn={hotspot.id}
              ref={(el) => {
                hotspotElsRef.current[hotspot.id] = el;
              }}
              type="button"
              onClick={() => {
                setSelectedHotspotId(hotspot.id);
                lookAtHotspotRef.current?.(hotspot);
              }}
              style={{ opacity: 0, pointerEvents: 'none' }}
              className={`absolute top-0 left-0 flex items-center gap-2 px-2.5 py-1 rounded border text-left transition-colors whitespace-nowrap shadow-xl ${
                isSelected
                  ? `bg-[#090D14]/95 ${catBorder}`
                  : 'bg-[#090D14]/85 border-white/25 text-slate-200 hover:border-amber-300'
              }`}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${catDot}`} />
              <span className="text-xs font-semibold">{hotspot.label}</span>
              <span className="font-mono-tabular text-[10px] text-slate-400 hidden md:inline">
                {hotspot.reading}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Hotspot Scientific Overlay Card */}
      {activeHotspot && (
        <div className="absolute left-3 bottom-14 sm:bottom-16 z-20 w-[min(340px,calc(100%-24px))] border border-white/15 bg-[#070A10]/95 rounded p-3 shadow-2xl space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-mono-tabular text-[10px] uppercase tracking-wider text-amber-300">
                {activeHotspot.category} · AZ {activeHotspot.azimuthDeg}° · EL{' '}
                {activeHotspot.elevationDeg >= 0
                  ? `+${activeHotspot.elevationDeg}°`
                  : `${activeHotspot.elevationDeg}°`}
              </div>
              <h3 className="font-display text-sm font-bold text-slate-50 mt-0.5">
                {activeHotspot.label}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setSelectedHotspotId(null)}
              aria-label="Close hotspot detail"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{activeHotspot.detail}</p>
          <div className="flex items-center justify-between pt-1 border-t border-white/10 font-mono-tabular text-[10px] text-slate-400">
            <span>{activeHotspot.reading}</span>
            <span>{activeHotspot.source}</span>
          </div>
        </div>
      )}

      {/* Bottom 5-Site 360° Switcher + Caption Strip */}
      {!hideChrome && (
        <div className="absolute bottom-2.5 left-3 right-3 z-20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-1 p-1 rounded border border-white/15 bg-[#070A10]/95 overflow-x-auto max-w-full">
            {allSites.map((s) => {
              const active = s.id === site.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onSelectSite(s.id)}
                  className={`px-2.5 py-1 text-[11px] rounded-xs border transition-colors whitespace-nowrap ${
                    active
                      ? 'border-amber-400 bg-amber-500 text-slate-950 font-semibold'
                      : 'border-white/10 bg-[#04060A] text-slate-300 hover:border-white/30'
                  }`}
                >
                  {s.name.split(' · ')[0]}
                </button>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded border border-white/10 bg-[#070A10]/90 text-[11px] text-slate-300 max-w-md truncate">
            <Maximize2 className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="truncate">
              {imageReady ? site.panoramaCaption : `Rendering 360° ${site.name} panorama...`}
            </span>
          </div>
        </div>
      )}

      {webglError && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#07090E]/95 p-6 z-30">
          <div className="max-w-md border border-slate-800 bg-[#0F141E] p-5 rounded-md text-sm text-slate-300">
            <p className="font-display text-base font-semibold text-amber-400 mb-1">
              360° Panorama Notice
            </p>
            <p>{webglError}</p>
          </div>
        </div>
      )}
    </div>
  );
}