import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { DataLayerId, MarsSite, RoverTelemetryState } from '../types/mars';
import {
  findSiteAtLatLon,
  latLonToVector3,
  vector3ToLatLon,
} from '../utils/marsLogic';
import {
  createDeepSpaceSkyTexture,
  createMarsSurfaceTextures,
  createTerritoryOverlayTexture,
} from '../utils/marsTextures';

interface MarsGlobe3DProps {
  sites: MarsSite[];
  selectedSiteId: string;
  activeLayer: DataLayerId;
  roverState: RoverTelemetryState;
  onSelectSite: (siteId: string) => void;
  onOpenPanorama?: (siteId: string) => void;
  showTerritories?: boolean;
  viewportShiftX?: number;
}

let cachedStarSprite: THREE.CanvasTexture | null = null;
function getStarSpriteTexture(): THREE.CanvasTexture {
  if (cachedStarSprite) return cachedStarSprite;
  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 32;
  const ctx = c.getContext('2d')!;
  const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.28, 'rgba(255, 255, 255, 0.78)');
  grad.addColorStop(0.65, 'rgba(255, 255, 255, 0.14)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 32, 32);
  cachedStarSprite = new THREE.CanvasTexture(c);
  cachedStarSprite.colorSpace = THREE.SRGBColorSpace;
  return cachedStarSprite;
}

const MARS_RADIUS = 2.3;
const _vec3 = new THREE.Vector3();
const _camDir = new THREE.Vector3();
const _siteNormal = new THREE.Vector3();
const _tangentU = new THREE.Vector3();
const _tangentV = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);

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

export function MarsGlobe3D({
  sites,
  selectedSiteId,
  activeLayer,
  roverState,
  onSelectSite,
  onOpenPanorama,
  showTerritories = true,
  viewportShiftX = 0,
}: MarsGlobe3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [hoveredSiteId, setHoveredSiteId] = useState<string | null>(null);
  const [webglError, setWebglError] = useState<string | null>(null);

  const propsRef = useRef({
    sites,
    selectedSiteId,
    activeLayer,
    roverState,
    hoveredSiteId,
    showTerritories,
    viewportShiftX,
    onSelectSite,
    onOpenPanorama,
  });
  propsRef.current = {
    sites,
    selectedSiteId,
    activeLayer,
    roverState,
    hoveredSiteId,
    showTerritories,
    viewportShiftX,
    onSelectSite,
    onOpenPanorama,
  };

  const triggerLayerUpdateRef = useRef<((layer: DataLayerId) => void) | null>(null);
  const triggerTerritoryUpdateRef = useRef<(() => void) | null>(null);
  const triggerFocusSiteRef = useRef<((siteId: string) => void) | null>(null);
  const triggerRoverSyncRef = useRef<(() => void) | null>(null);

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
      setWebglError('WebGL unavailable in this browser context.');
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 3));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setWebglError('3D viewport context interrupted. Reload to restore.');
    };
    const onContextRestored = () => setWebglError(null);
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020306);

    const camera = new THREE.PerspectiveCamera(
      40,
      Math.max(1, container.clientWidth) / Math.max(1, container.clientHeight),
      0.1,
      100
    );

    const applyCameraViewOffset = (w: number, h: number) => {
      const shift = w >= 1024 ? propsRef.current.viewportShiftX : 0;
      if (shift !== 0 && w > 0 && h > 0) {
        camera.setViewOffset(w, h, w * shift, 0, w, h);
      } else {
        camera.clearViewOffset();
      }
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    applyCameraViewOffset(Math.max(1, container.clientWidth), Math.max(1, container.clientHeight));

    const initialSite =
      propsRef.current.sites.find((s) => s.id === propsRef.current.selectedSiteId) ??
      propsRef.current.sites[0];
    const startRadius = propsRef.current.showTerritories ? 7.6 : 8.15;
    const initPos = latLonToVector3(initialSite.lat, initialSite.lon, startRadius);
    camera.position.set(initPos.x, initPos.y + 0.25, initPos.z);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.minDistance = 4.5;
    controls.maxDistance = 13.5;
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.07;
    controls.autoRotate = false;

    // Sculpt lower-right directional solar key relative to initial camera view
    const camDirNorm = new THREE.Vector3(
      camera.position.x,
      camera.position.y,
      camera.position.z
    ).normalize();
    const camRight = new THREE.Vector3()
      .crossVectors(new THREE.Vector3(0, 1, 0), camDirNorm)
      .normalize();
    const sunDir = new THREE.Vector3()
      .addScaledVector(camRight, 1.05)
      .addScaledVector(new THREE.Vector3(0, -1, 0), 0.44)
      .addScaledVector(camDirNorm, 0.46)
      .normalize();

    const sunKey = new THREE.DirectionalLight(0xffdca0, 4.1);
    sunKey.position.copy(sunDir).multiplyScalar(14);
    scene.add(sunKey);

    const spaceFill = new THREE.HemisphereLight(
      0x7c1c0b,
      0x1a0301,
      propsRef.current.showTerritories ? 0.85 : 0.42
    );
    scene.add(spaceFill);

    const rimLight = new THREE.DirectionalLight(
      0x9a260c,
      propsRef.current.showTerritories ? 0.55 : 0.22
    );
    rimLight.position.copy(sunDir).multiplyScalar(-10);
    scene.add(rimLight);

    // Deep Space Milky Way Sky Dome surrounding Mars
    const skyTex = createDeepSpaceSkyTexture();
    const skyGeo = new THREE.SphereGeometry(72, 40, 28);
    const skyMat = new THREE.MeshBasicMaterial({
      map: skyTex,
      side: THREE.BackSide,
      depthWrite: false,
    });
    const skyDome = new THREE.Mesh(skyGeo, skyMat);
    scene.add(skyDome);

    // 2,400+ Multi-Spectral Deep-Field Parallax Stars
    const starCount = 2400;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 24 + (i % 14) * 2.8;
      const theta = ((i * 137.508) % 360) * (Math.PI / 180);
      const phi = Math.acos(1 - (2 * (i + 0.5)) / starCount);
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.cos(phi);
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const spectral = (Math.sin(i * 12.9898) * 43758.5453) % 1;
      const sAbs = Math.abs(spectral);
      if (sAbs < 0.22) {
        // Blue-white O/B star
        starColors[i * 3] = 0.72;
        starColors[i * 3 + 1] = 0.85;
        starColors[i * 3 + 2] = 1.0;
      } else if (sAbs < 0.78) {
        // Crisp white-silver A/F star
        starColors[i * 3] = 0.94;
        starColors[i * 3 + 1] = 0.96;
        starColors[i * 3 + 2] = 1.0;
      } else {
        // Warm amber-gold K/M star
        starColors[i * 3] = 1.0;
        starColors[i * 3 + 1] = 0.84;
        starColors[i * 3 + 2] = 0.68;
      }
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const starMat = new THREE.PointsMaterial({
      size: 0.22,
      map: getStarSpriteTexture(),
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
      depthWrite: false,
    });
    scene.add(new THREE.Points(starGeo, starMat));

    // Sculpted Cratered Phobos Moonlet + Inclined Orbital Track
    const phobosOrbitRadius = 3.95;
    const phobosOrbitPts: THREE.Vector3[] = [];
    for (let i = 0; i < 96; i++) {
      const a = (i / 96) * Math.PI * 2;
      phobosOrbitPts.push(
        new THREE.Vector3(
          Math.cos(a) * phobosOrbitRadius,
          Math.sin(a) * 0.42,
          Math.sin(a) * phobosOrbitRadius
        )
      );
    }
    const orbitLineGeo = new THREE.BufferGeometry().setFromPoints(phobosOrbitPts);
    const orbitLineMat = new THREE.LineBasicMaterial({
      color: 0x475569,
      transparent: true,
      opacity: 0.28,
    });
    const phobosOrbitLine = new THREE.LineLoop(orbitLineGeo, orbitLineMat);
    scene.add(phobosOrbitLine);

    const phobosGeo = new THREE.IcosahedronGeometry(0.105, 2);
    const pPos = phobosGeo.attributes.position;
    for (let i = 0; i < pPos.count; i++) {
      const vx = pPos.getX(i);
      const vy = pPos.getY(i);
      const vz = pPos.getZ(i);
      // Triaxial potato deformation + Stickney crater indentation
      const lump = 1 + 0.14 * Math.sin(vx * 18 + vy * 12) + 0.08 * Math.cos(vz * 22);
      const dStickney = Math.hypot(vx - 0.07, vy - 0.02, vz - 0.04);
      const stickneyDent = dStickney < 0.055 ? 0.82 : 1.0;
      pPos.setXYZ(i, vx * 1.24 * lump * stickneyDent, vy * 0.84 * lump, vz * 0.96 * lump);
    }
    phobosGeo.computeVertexNormals();
    const phobosMat = new THREE.MeshStandardMaterial({
      color: 0x7c726b,
      roughness: 0.95,
      metalness: 0.04,
    });
    const phobosMesh = new THREE.Mesh(phobosGeo, phobosMat);
    const phobosAngle = 0.65;
    phobosMesh.position.set(
      Math.cos(phobosAngle) * phobosOrbitRadius,
      Math.sin(phobosAngle) * 0.42,
      Math.sin(phobosAngle) * phobosOrbitRadius
    );
    scene.add(phobosMesh);

    // Mars Globe Mesh with high-resolution Normal + Bump + Roughness relief
    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    let currentTextures = createMarsSurfaceTextures(
      propsRef.current.activeLayer,
      maxAnisotropy
    );

    const marsGeo = new THREE.SphereGeometry(MARS_RADIUS, 96, 64);
    const marsMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: currentTextures.colorMap,
      bumpMap: currentTextures.bumpMap,
      bumpScale: 0.11,
      normalMap: currentTextures.normalMap,
      normalScale: new THREE.Vector2(1.38, 1.38),
      roughnessMap: currentTextures.roughnessMap,
      roughness: 1.0,
      metalness: 0.03,
    });
    const marsMesh = new THREE.Mesh(marsGeo, marsMat);
    marsMesh.layers.enable(1);
    scene.add(marsMesh);

    // Country-style Full-Area Territory Overlay Shell
    let territoryTex = createTerritoryOverlayTexture(
      propsRef.current.sites,
      propsRef.current.selectedSiteId,
      propsRef.current.hoveredSiteId,
      maxAnisotropy
    );
    const territoryGeo = new THREE.SphereGeometry(MARS_RADIUS * 1.003, 72, 54);
    const territoryMat = new THREE.MeshBasicMaterial({
      map: territoryTex,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const territoryMesh = new THREE.Mesh(territoryGeo, territoryMat);
    scene.add(territoryMesh);

    // Raised 3D Vector Borders hugging each Territory Polygon on Mars
    const borderLines = new Map<string, THREE.LineLoop>();
    const borderGeos: THREE.BufferGeometry[] = [];
    const borderMats: THREE.LineBasicMaterial[] = [];

    for (const site of propsRef.current.sites) {
      const pts: THREE.Vector3[] = [];
      const poly = site.boundaryPolygon;
      for (let i = 0; i < poly.length; i++) {
        const [latA, lonA] = poly[i];
        const [latB, lonB] = poly[(i + 1) % poly.length];
        // Subdivide edges so lines hug spherical curvature cleanly
        const steps = 6;
        for (let s = 0; s < steps; s++) {
          const t = s / steps;
          const lat = latA + (latB - latA) * t;
          const dLon = ((lonB - lonA + 540) % 360) - 180;
          const lon = lonA + dLon * t;
          const v = latLonToVector3(lat, lon, MARS_RADIUS * 1.007);
          pts.push(new THREE.Vector3(v.x, v.y, v.z));
        }
      }

      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const colorHex =
        site.safetyVerdict === 'SAFE'
          ? 0x34d399
          : site.safetyVerdict === 'CAUTION'
            ? 0xfbbf24
            : 0xf87171;
      const lineMat = new THREE.LineBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: site.id === propsRef.current.selectedSiteId ? 1.0 : 0.72,
      });
      const loop = new THREE.LineLoop(lineGeo, lineMat);
      scene.add(loop);
      borderLines.set(site.id, loop);
      borderGeos.push(lineGeo);
      borderMats.push(lineMat);
    }

    // Authentic Fresnel Atmospheric Limb Halo Shader (fades smoothly to 0 at outer edge)
    const atmosGeo = new THREE.SphereGeometry(MARS_RADIUS * 1.038, 56, 40);
    const atmosMat = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(0xd9561c) },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPos;
        void main() {
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vViewPos = -mvPos.xyz;
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying vec3 vNormal;
        varying vec3 vViewPos;
        void main() {
          float cosTheta = clamp(-dot(normalize(vNormal), normalize(vViewPos)), 0.0, 1.0);
          float limbGlow = pow(smoothstep(0.0, 0.34, cosTheta), 2.1) * 0.24;
          gl_FragColor = vec4(uColor, limbGlow);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
    });
    scene.add(new THREE.Mesh(atmosGeo, atmosMat));

    // Thin Front-Side Atmospheric Dust Scattering Rim
    const rimScatterGeo = new THREE.SphereGeometry(MARS_RADIUS * 1.002, 56, 40);
    const rimScatterMat = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(0xf2934e) },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPos;
        void main() {
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vViewPos = -mvPos.xyz;
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying vec3 vNormal;
        varying vec3 vViewPos;
        void main() {
          float rim = pow(1.0 - max(0.0, dot(normalize(vNormal), normalize(vViewPos))), 4.5);
          gl_FragColor = vec4(uColor, rim * 0.12);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    scene.add(new THREE.Mesh(rimScatterGeo, rimScatterMat));

    // Subtle Equatorial Reference Ring
    const eqRingGeo = new THREE.RingGeometry(MARS_RADIUS * 1.11, MARS_RADIUS * 1.114, 96);
    const eqRingMat = new THREE.MeshBasicMaterial({
      color: 0x334155,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    const eqRing = new THREE.Mesh(eqRingGeo, eqRingMat);
    eqRing.rotation.x = Math.PI / 2;
    scene.add(eqRing);

    // ═══════════════════════════════════════════════
    // SPACETIME GRID — Rippling quantum fabric plane
    // ═══════════════════════════════════════════════
    const GRID_SEGS = isSoftwareGl ? 20 : 72;
    const gridGeo = new THREE.PlaneGeometry(36, 36, GRID_SEGS, GRID_SEGS);
    const gridMat = new THREE.MeshBasicMaterial({
      color: 0x0d6eaf,
      wireframe: true,
      transparent: true,
      opacity: 0.17,
      depthWrite: false,
    });
    const gridMesh = new THREE.Mesh(gridGeo, gridMat);
    gridMesh.rotation.x = -Math.PI / 2;
    gridMesh.position.y = -4.4;
    scene.add(gridMesh);
    const gridPositions = gridGeo.attributes.position as THREE.BufferAttribute;

    // Secondary outer grid ring for depth
    const outerGridGeo = new THREE.PlaneGeometry(80, 80, 24, 24);
    const outerGridMat = new THREE.MeshBasicMaterial({
      color: 0x0a3f6e,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
      depthWrite: false,
    });
    const outerGridMesh = new THREE.Mesh(outerGridGeo, outerGridMat);
    outerGridMesh.rotation.x = -Math.PI / 2;
    outerGridMesh.position.y = -4.6;
    scene.add(outerGridMesh);

    // Territory Center Anchors (for projected label coordinates)
    const siteAnchors = new Map<string, THREE.Vector3>();
    for (const site of propsRef.current.sites) {
      const pos = latLonToVector3(site.lat, site.lon, MARS_RADIUS);
      siteAnchors.set(site.id, new THREE.Vector3(pos.x, pos.y, pos.z));
    }

    // Live Green Rover Beacon ("النقطة الخضرا") on Mars Globe
    const roverGroup = new THREE.Group();
    const roverCoreMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 1.25,
      roughness: 0.2,
      metalness: 0.3,
    });
    const roverCore = new THREE.Mesh(new THREE.SphereGeometry(0.068, 16, 16), roverCoreMat);
    roverCore.position.y = 0.08;
    roverGroup.add(roverCore);

    const roverRingMat = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.92,
    });
    const roverRing = new THREE.Mesh(new THREE.RingGeometry(0.11, 0.16, 28), roverRingMat);
    roverRing.rotation.x = -Math.PI / 2;
    roverRing.position.y = 0.03;
    roverGroup.add(roverRing);

    const roverOuterRing = new THREE.Mesh(
      new THREE.RingGeometry(0.21, 0.24, 28),
      new THREE.MeshBasicMaterial({
        color: 0x10b981,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.45,
      })
    );
    roverOuterRing.rotation.x = -Math.PI / 2;
    roverOuterRing.position.y = 0.025;
    roverGroup.add(roverOuterRing);

    roverGroup.visible = false;
    scene.add(roverGroup);

    let flyActive = false;
    const flyTargetPos = new THREE.Vector3().copy(camera.position);
    let flyCompleteCallback: (() => void) | null = null;

    function startFlyToSite(siteId: string, onComplete?: () => void) {
      const site = propsRef.current.sites.find((s) => s.id === siteId);
      if (!site) return;
      const dist = Math.max(6.3, Math.min(8.0, camera.position.length()));
      const dest = latLonToVector3(site.lat, site.lon, dist);
      flyTargetPos.set(dest.x, dest.y + 0.25, dest.z);
      flyCompleteCallback = onComplete ?? null;
      flyActive = true;
      requestRender();
    }

    function syncRoverMarker() {
      const { roverState: rState, sites: allSites } = propsRef.current;
      const site = allSites.find((s) => s.id === rState.activeSiteId) ?? allSites[0];
      if (!rState.powered) {
        roverGroup.visible = false;
        return;
      }

      roverGroup.visible = true;
      const base = latLonToVector3(site.lat, site.lon, MARS_RADIUS + 0.015);
      _siteNormal.set(base.x, base.y, base.z).normalize();

      _tangentU.crossVectors(_up, _siteNormal).normalize();
      if (_tangentU.lengthSq() < 0.001) _tangentU.set(1, 0, 0);
      _tangentV.crossVectors(_siteNormal, _tangentU).normalize();

      const offsetU = ((rState.x - 50) / 50) * 0.22;
      const offsetV = ((50 - rState.y) / 50) * 0.22;

      _vec3
        .set(base.x, base.y, base.z)
        .addScaledVector(_tangentU, offsetU)
        .addScaledVector(_tangentV, offsetV)
        .normalize()
        .multiplyScalar(MARS_RADIUS + 0.02);

      roverGroup.position.copy(_vec3);
      roverGroup.quaternion.setFromUnitVectors(_up, _siteNormal);

      const hasAnomaly = rState.anomalies.length > 0;
      const colorHex = hasAnomaly ? 0xef4444 : 0x10b981;
      roverCoreMat.color.setHex(colorHex);
      roverCoreMat.emissive.setHex(colorHex);
      roverRingMat.color.setHex(hasAnomaly ? 0xfca5a5 : 0x34d399);
    }

    function updateProjectedLabels() {
      const el = containerRef.current;
      if (!el) return;
      const showT = propsRef.current.showTerritories;
      const width = el.clientWidth;
      const height = el.clientHeight;
      if (width === 0 || height === 0) return;

      _camDir.copy(camera.position).normalize();

      for (const site of propsRef.current.sites) {
        const btn = labelRefs.current[site.id];
        if (!btn) continue;
        if (!showT) {
          btn.style.opacity = '0';
          btn.style.pointerEvents = 'none';
          continue;
        }
        const anchor = siteAnchors.get(site.id);
        if (!anchor) continue;
        _siteNormal.copy(anchor).normalize();
        const dot = _camDir.dot(_siteNormal);

        _vec3.copy(anchor).addScaledVector(_siteNormal, 0.08);
        _vec3.project(camera);

        const visible = dot > 0.26 && _vec3.z < 1;
        if (!visible) {
          btn.style.opacity = '0';
          btn.style.pointerEvents = 'none';
        } else {
          const x = Math.round(((_vec3.x + 1) / 2) * width);
          const y = Math.round(((-_vec3.y + 1) / 2) * height);
          btn.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
          btn.style.opacity = '1';
          btn.style.pointerEvents = 'auto';
        }
      }
    }

    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;
    let lastTime = performance.now();
    let elapsed = 0;

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
        elapsed += dt;

        if (flyActive) {
          const factor = 1 - Math.exp(-5.5 * dt);
          camera.position.lerp(flyTargetPos, factor);
          if (camera.position.distanceTo(flyTargetPos) < 0.03) {
            camera.position.copy(flyTargetPos);
            flyActive = false;
            const cb = flyCompleteCallback;
            flyCompleteCallback = null;
            if (cb) setTimeout(cb, 120);
          }
        }

        // Animate spacetime grid vertices (wave ripple from centre)
        if (!isSoftwareGl) {
          for (let i = 0; i < gridPositions.count; i++) {
            const gx = gridPositions.getX(i);
            const gy = gridPositions.getY(i);
            const dist = Math.sqrt(gx * gx + gy * gy);
            const ripple =
              Math.sin(dist * 0.32 - elapsed * 0.85) *
              0.42 *
              Math.exp(-dist * 0.048);
            gridPositions.setZ(i, ripple);
          }
          gridPositions.needsUpdate = true;
        }

        controls.update();
        syncRoverMarker();
        renderer.render(scene, camera);
        updateProjectedLabels();

        const done = () => {
          renderBusy = false;
          // Always keep animating on hardware GPU (spacetime grid needs it)
          if (!isSoftwareGl) {
            requestRender();
          } else if (flyActive || renderDirty) {
            requestRender();
          }
        };

        if (isSoftwareGl) afterDraw(done);
        else done();
      });
    }

    controls.addEventListener('start', () => {
      flyActive = false;
    });
    controls.addEventListener('change', requestRender);

    // Direct 3D Surface Territory Raycasting (Click/Hover anywhere inside region polygon!)
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    const mouse = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };
    let lastHoverCheck = 0;

    function pickTerritoryAtEvent(e: PointerEvent): MarsSite | null {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObject(marsMesh, false);
      if (hits.length === 0) return null;
      const pt = hits[0].point;
      const { lat, lon } = vector3ToLatLon(pt.x, pt.y, pt.z);
      return findSiteAtLatLon(lat, lon, propsRef.current.sites);
    }

    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };
    const onPointerUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y) > 6) {
        return;
      }
      const hitSite = pickTerritoryAtEvent(e);
      if (hitSite) {
        propsRef.current.onSelectSite(hitSite.id);
        // Fly-to animation → then open panorama after landing
        startFlyToSite(hitSite.id, () => {
          propsRef.current.onOpenPanorama?.(hitSite.id);
        });
      }
    };
    const onPointerMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastHoverCheck < 50) return;
      lastHoverCheck = now;
      const hitSite = pickTerritoryAtEvent(e);
      const nextHoverId = hitSite?.id ?? null;
      renderer.domElement.style.cursor = nextHoverId ? 'pointer' : 'grab';
      if (nextHoverId !== propsRef.current.hoveredSiteId) {
        setHoveredSiteId(nextHoverId);
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointermove', onPointerMove);

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      applyCameraViewOffset(w, h);
      renderer.setSize(w, h);
      requestRender();
    };
    window.addEventListener('resize', onResize);

    triggerLayerUpdateRef.current = (layer: DataLayerId) => {
      const next = createMarsSurfaceTextures(layer, maxAnisotropy);
      marsMat.map = next.colorMap;
      marsMat.bumpMap = next.bumpMap;
      marsMat.normalMap = next.normalMap;
      marsMat.roughnessMap = next.roughnessMap;
      marsMat.needsUpdate = true;
      requestRender();
    };

    triggerTerritoryUpdateRef.current = () => {
      const showT = propsRef.current.showTerritories;
      territoryMesh.visible = showT;
      eqRing.visible = showT;

      if (showT) {
        const nextTex = createTerritoryOverlayTexture(
          propsRef.current.sites,
          propsRef.current.selectedSiteId,
          propsRef.current.hoveredSiteId,
          maxAnisotropy
        );
        territoryTex.dispose();
        territoryTex = nextTex;
        territoryMat.map = nextTex;
        territoryMat.needsUpdate = true;
      }

      for (const [siteId, loop] of borderLines.entries()) {
        loop.visible = showT;
        const mat = loop.material as THREE.LineBasicMaterial;
        const isSel = siteId === propsRef.current.selectedSiteId;
        const isHov = siteId === propsRef.current.hoveredSiteId;
        mat.opacity = isSel ? 1.0 : isHov ? 0.9 : 0.65;
      }
      spaceFill.intensity = showT ? 0.85 : 0.42;
      rimLight.intensity = showT ? 0.55 : 0.22;
      requestRender();
    };

    triggerFocusSiteRef.current = (siteId: string) => {
      if (propsRef.current.showTerritories) {
        startFlyToSite(siteId, undefined);
      }
    };

    triggerRoverSyncRef.current = () => {
      requestRender();
    };

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }
    triggerTerritoryUpdateRef.current();
    syncRoverMarker();
    requestRender();

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      controls.dispose();
      skyGeo.dispose();
      skyMat.dispose();
      phobosGeo.dispose();
      phobosMat.dispose();
      orbitLineGeo.dispose();
      orbitLineMat.dispose();
      marsGeo.dispose();
      marsMat.dispose();
      territoryGeo.dispose();
      territoryMat.dispose();
      territoryTex.dispose();
      atmosGeo.dispose();
      atmosMat.dispose();
      rimScatterGeo.dispose();
      rimScatterMat.dispose();
      eqRingGeo.dispose();
      eqRingMat.dispose();
      starGeo.dispose();
      starMat.dispose();
      borderGeos.forEach((g) => g.dispose());
      borderMats.forEach((m) => m.dispose());
      gridGeo.dispose();
      gridMat.dispose();
      outerGridGeo.dispose();
      outerGridMat.dispose();
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    triggerLayerUpdateRef.current?.(activeLayer);
  }, [activeLayer]);

  useEffect(() => {
    triggerTerritoryUpdateRef.current?.();
  }, [selectedSiteId, hoveredSiteId, sites, showTerritories]);

  useEffect(() => {
    triggerFocusSiteRef.current?.(selectedSiteId);
  }, [selectedSiteId]);

  useEffect(() => {
    triggerRoverSyncRef.current?.();
  }, [roverState]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#020306]">
      <div
        ref={containerRef}
        data-testid="mars-3d-canvas"
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Territory Name Labels Centered Over Each Martian Province (Updated via Direct DOM Refs) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {showTerritories &&
          sites.map((site) => {
            const isSelected = site.id === selectedSiteId;
            const isHovered = site.id === hoveredSiteId;
            const isRoverHere = roverState.powered && roverState.activeSiteId === site.id;
            const hasAnomaly = isRoverHere && roverState.anomalies.length > 0;
            const accentText =
              site.safetyVerdict === 'SAFE'
                ? 'text-emerald-300'
                : site.safetyVerdict === 'CAUTION'
                  ? 'text-amber-300'
                  : 'text-rose-300';

            return (
              <button
                key={site.id}
                ref={(el) => {
                  labelRefs.current[site.id] = el;
                }}
                type="button"
                onClick={() => {
                  onSelectSite(site.id);
                  onOpenPanorama?.(site.id);
                }}
                style={{ opacity: 0, pointerEvents: 'none' }}
                className={`absolute top-0 left-0 flex items-center gap-2 px-2.5 py-1 text-left transition-colors rounded border whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#090D14]/95 border-amber-400 text-slate-50 shadow-xl'
                    : isHovered
                      ? 'bg-[#090D14]/90 border-slate-300 text-slate-50'
                      : 'bg-[#090D14]/75 border-slate-700/80 text-slate-200 hover:border-slate-400'
                }`}
              >
                <span
                  className={`font-display text-xs font-semibold tracking-wide ${isSelected ? accentText : ''}`}
                >
                  {site.name}
                </span>
                <span className="font-mono-tabular text-[10px] text-amber-300/90 hidden sm:inline">
                  360°
                </span>
                {isRoverHere && (
                  <span
                    className={`font-mono-tabular text-[10px] font-semibold px-1 py-0.5 rounded-xs ${
                      hasAnomaly
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                    }`}
                  >
                    {hasAnomaly ? 'ALERT' : 'ROVER'}
                  </span>
                )}
              </button>
            );
          })}
      </div>

      {webglError && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#07090E]/95 p-6">
          <div className="max-w-md border border-slate-800 bg-[#0F141E] p-5 rounded-md text-sm text-slate-300">
            <p className="font-display text-base font-semibold text-amber-400 mb-1">
              3D Renderer Notice
            </p>
            <p>{webglError}</p>
          </div>
        </div>
      )}
    </div>
  );
}