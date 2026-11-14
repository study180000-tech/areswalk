import * as THREE from 'three';
import type { DataLayerId, MarsSite } from '../types/mars';

function hash2(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return n - Math.floor(n);
}

function valueNoise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy);
  const b = hash2(ix + 1, iy);
  const c = hash2(ix, iy + 1);
  const d = hash2(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function fbm(x: number, y: number, octaves = 4): number {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    sum += amp * valueNoise(x * freq, y * freq);
    freq *= 2.12;
    amp *= 0.5;
  }
  return sum;
}

function angularDist(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = lat1 - lat2;
  let dLon = Math.abs(lon1 - lon2);
  if (dLon > 180) dLon = 360 - dLon;
  return Math.hypot(dLat, dLon * Math.cos((lat1 * Math.PI) / 180));
}

interface CraterDef {
  lat: number;
  lon: number;
  rad: number;
  depth: number;
  centralPeak: boolean;
}

// 340 multi-scale Martian impact craters, biased toward rugged Southern Highlands
const CRATERS: CraterDef[] = Array.from({ length: 340 }, (_, i) => {
  const isLarge = i < 26;
  const isMedium = i >= 26 && i < 115;
  const southBias = hash2(i * 4.3, 8.1) < 0.68 ? -1 : 1;
  const rawLat = southBias * Math.pow(hash2(i * 3.1, 1.7), 0.78) * 74;
  const rad = isLarge
    ? 3.8 + hash2(i * 2.3, 9.1) * 5.2
    : isMedium
      ? 1.5 + hash2(i * 2.3, 9.1) * 2.3
      : 0.45 + hash2(i * 2.3, 9.1) * 1.1;

  return {
    lat: rawLat,
    lon: hash2(i * 7.3, 4.9) * 360,
    rad,
    depth: isLarge
      ? 0.25 + hash2(i * 5.7, 2.2) * 0.26
      : isMedium
        ? 0.16 + hash2(i * 5.7, 2.2) * 0.18
        : 0.1 + hash2(i * 5.7, 2.2) * 0.14,
    centralPeak: isLarge && hash2(i * 9.7, 3.3) > 0.35,
  };
});

const TEX_W = 2048;
const TEX_H = 1024;

interface CachedBaseField {
  heights: Float32Array;
  slopes: Float32Array;
  bumpMap: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
}

let cachedBaseField: CachedBaseField | null = null;
let cachedSkyTex: THREE.CanvasTexture | null = null;
const cachedLayerColorMaps = new Map<DataLayerId, THREE.CanvasTexture>();

function buildMacroHeight(latDeg: number, lonNorm: number): number {
  let h = Math.tanh((14 - latDeg) / 9.5) * 0.26 - 0.08;

  const nx = (lonNorm / 360) * 12;
  const ny = ((latDeg + 90) / 180) * 6;
  h += (fbm(nx, ny, 4) - 0.5) * 0.56;
  h += (fbm(nx * 4.2 + 13, ny * 4.2 + 7, 3) - 0.5) * 0.24;

  // Olympus Mons (18.65N, 226.2E) with nested caldera
  const dOlympus = angularDist(latDeg, lonNorm, 18.65, 226.2);
  if (dOlympus < 16) {
    h += Math.exp(-(dOlympus * dOlympus) / 36) * 1.28;
    if (dOlympus < 2.1) h -= 0.28;
    if (dOlympus > 7.5 && dOlympus < 9.5) h -= 0.06;
  }

  // Tharsis Montes trio
  const tharsisPeaks: [number, number][] = [
    [11.9, 255.9],
    [1.5, 247.0],
    [-8.3, 239.9],
  ];
  for (const [pLat, pLon] of tharsisPeaks) {
    const d = angularDist(latDeg, lonNorm, pLat, pLon);
    if (d < 9) {
      h += Math.exp(-(d * d) / 15) * 0.78;
      if (d < 1.2) h -= 0.18;
    }
  }

  // Tharsis Bulge
  const dTharsis = Math.hypot((latDeg - 1) * 1.1, (lonNorm - 250) * 0.65);
  if (dTharsis < 36) {
    h += Math.exp(-(dTharsis * dTharsis) / 420) * 0.56;
  }

  // Elysium Mons
  const dElysium = angularDist(latDeg, lonNorm, 25.0, 147.2);
  if (dElysium < 11) {
    h += Math.exp(-(dElysium * dElysium) / 24) * 0.68;
    if (dElysium < 1.1) h -= 0.14;
  }

  // Valles Marineris rift canyon + Candor/Melas spur + Noctis Labyrinthus
  if (lonNorm > 266 && lonNorm < 328 && Math.abs(latDeg + 13.5) < 12) {
    const wiggle = Math.sin((lonNorm - 270) * 0.24) * 1.15;
    const centerLat = -13.5 + wiggle;
    const mainMask =
      Math.exp(-Math.pow((latDeg - centerLat) / 1.9, 2)) *
      Math.sin(Math.max(0, Math.min(1, (lonNorm - 272) / 52)) * Math.PI);
    const spurMask =
      lonNorm > 282 && lonNorm < 306
        ? Math.exp(-Math.pow((latDeg - (centerLat + 2.8)) / 1.1, 2)) *
          Math.sin(((lonNorm - 282) / 24) * Math.PI) *
          0.62
        : 0;
    const noctisMask =
      lonNorm > 266 && lonNorm < 280
        ? Math.exp(-Math.pow((latDeg + 8.5) / 3.2, 2)) *
          Math.abs(Math.sin(latDeg * 2.2 + lonNorm * 1.7)) *
          0.35
        : 0;
    h -= Math.max(mainMask, spurMask) * 0.98 + noctisMask;
  }

  // Kasei Valles outflow channel
  if (lonNorm > 285 && lonNorm < 306 && latDeg > 8 && latDeg < 28) {
    const channelCenter = 294 + (latDeg - 10) * 0.45;
    const dChannel = Math.abs(lonNorm - channelCenter);
    if (dChannel < 3.5) {
      h -= Math.exp(-(dChannel * dChannel) / 2.6) * 0.34;
    }
  }

  // Major basins (Hellas, Argyre, Isidis, Utopia)
  const dHellas = angularDist(latDeg, lonNorm, -42, 70);
  if (dHellas < 24) h -= Math.exp(-(dHellas * dHellas) / 160) * 0.84;

  const dArgyre = angularDist(latDeg, lonNorm, -50, 317);
  if (dArgyre < 14) h -= Math.exp(-(dArgyre * dArgyre) / 65) * 0.62;

  const dIsidis = angularDist(latDeg, lonNorm, 12.9, 87);
  if (dIsidis < 13) h -= Math.exp(-(dIsidis * dIsidis) / 55) * 0.42;

  const dUtopia = angularDist(latDeg, lonNorm, 47, 122);
  if (dUtopia < 24) h -= Math.exp(-(dUtopia * dUtopia) / 210) * 0.3;

  // 5 Landing site craters
  const dJezero = angularDist(latDeg, lonNorm, 18.44, 77.45);
  if (dJezero < 4.8) {
    h -= Math.exp(-(dJezero * dJezero) / 5.5) * 0.34;
    if (dJezero > 2.2 && dJezero < 3.6) h += 0.12;
  }

  const dGale = angularDist(latDeg, lonNorm, -5.4, 137.8);
  if (dGale < 5.2) {
    h -= Math.exp(-(dGale * dGale) / 6.5) * 0.42;
    if (dGale < 1.8) h += Math.exp(-(dGale * dGale) / 1.1) * 0.34;
  }

  const dEndeavour = angularDist(latDeg, lonNorm, -2.28, 354.78);
  if (dEndeavour < 3.5) {
    h -= Math.exp(-(dEndeavour * dEndeavour) / 3.4) * 0.22;
  }

  const dGusev = angularDist(latDeg, lonNorm, -14.59, 175.5);
  if (dGusev < 5.0) {
    h -= Math.exp(-(dGusev * dGusev) / 6.2) * 0.34;
    if (dGusev < 1.3) h += 0.14;
  }

  return h;
}

/**
 * Spatial-splatted heightfield generation: computes base fBm once per pixel and splats
 * 340 craters ONLY inside their local bounding rectangles (~5,000x faster than O(pixels * craters)).
 */
function getOrBuildBaseField(maxAnisotropy: number): CachedBaseField {
  if (cachedBaseField) return cachedBaseField;

  const heights = new Float32Array(TEX_W * TEX_H);
  for (let py = 0; py < TEX_H; py++) {
    const lat = 90 - (py / (TEX_H - 1)) * 180;
    for (let px = 0; px < TEX_W; px++) {
      const lonRaw = (px / (TEX_W - 1)) * 360 - 180;
      const lonNorm = lonRaw < 0 ? lonRaw + 360 : lonRaw;
      heights[py * TEX_W + px] = buildMacroHeight(lat, lonNorm);
    }
  }

  // Splat 340 multi-scale impact craters solely over their local bounding boxes
  for (let i = 0; i < CRATERS.length; i++) {
    const c = CRATERS[i];
    const cosLat = Math.max(0.22, Math.cos((c.lat * Math.PI) / 180));
    const latSpan = c.rad * 1.32;
    const lonSpan = (c.rad * 1.32) / cosLat;

    const pyMin = Math.max(0, Math.floor(((90 - (c.lat + latSpan)) / 180) * (TEX_H - 1)));
    const pyMax = Math.min(TEX_H - 1, Math.ceil(((90 - (c.lat - latSpan)) / 180) * (TEX_H - 1)));
    const pxSpan = Math.ceil((lonSpan / 360) * TEX_W);
    const centerLonWrapped = c.lon > 180 ? c.lon - 360 : c.lon;
    const pxCenter = Math.round(((centerLonWrapped + 180) / 360) * (TEX_W - 1));

    for (let py = pyMin; py <= pyMax; py++) {
      const lat = 90 - (py / (TEX_H - 1)) * 180;
      const dLat = lat - c.lat;
      for (let dx = -pxSpan; dx <= pxSpan; dx++) {
        const px = (pxCenter + dx + TEX_W) % TEX_W;
        const lonRaw = (px / (TEX_W - 1)) * 360 - 180;
        const lonNorm = lonRaw < 0 ? lonRaw + 360 : lonRaw;
        let dLon = Math.abs(lonNorm - c.lon);
        if (dLon > 180) dLon = 360 - dLon;
        const dist = Math.hypot(dLat, dLon * cosLat);
        if (dist < c.rad * 1.28) {
          const rNorm = dist / c.rad;
          let delta = 0;
          if (rNorm < 0.78) {
            const bowl = rNorm / 0.78;
            delta = -(1 - bowl * bowl * bowl) * c.depth * 0.72;
            if (c.centralPeak && rNorm < 0.22) {
              delta += Math.cos((rNorm / 0.22) * (Math.PI / 2)) * c.depth * 0.42;
            }
          } else {
            // Smooth weathered crater rim + gradual outer ejecta taper
            const ejectaT = (rNorm - 0.78) / 0.5;
            const rimBell = Math.sin(Math.min(1, ejectaT * 1.5) * Math.PI) * Math.pow(1 - ejectaT, 1.4);
            delta = rimBell * c.depth * 0.36;
          }
          heights[py * TEX_W + px] += delta;
        }
      }
    }
  }

  for (let i = 0; i < heights.length; i++) {
    if (heights[i] < -1.05) heights[i] = -1.05;
    else if (heights[i] > 1.28) heights[i] = 1.28;
  }

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = TEX_W;
  bumpCanvas.height = TEX_H;
  const bCtx = bumpCanvas.getContext('2d')!;
  const bImg = bCtx.createImageData(TEX_W, TEX_H);

  const normalCanvas = document.createElement('canvas');
  normalCanvas.width = TEX_W;
  normalCanvas.height = TEX_H;
  const nCtx = normalCanvas.getContext('2d')!;
  const nImg = nCtx.createImageData(TEX_W, TEX_H);

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = TEX_W;
  roughCanvas.height = TEX_H;
  const rCtx = roughCanvas.getContext('2d')!;
  const rImg = rCtx.createImageData(TEX_W, TEX_H);

  const slopes = new Float32Array(TEX_W * TEX_H);
  const normalStrength = 4.6;

  for (let py = 0; py < TEX_H; py++) {
    const lat = 90 - (py / (TEX_H - 1)) * 180;
    const cosLat = Math.max(0.25, Math.cos((lat * Math.PI) / 180));
    const pyUp = Math.max(0, py - 1);
    const pyDown = Math.min(TEX_H - 1, py + 1);

    for (let px = 0; px < TEX_W; px++) {
      const idx = py * TEX_W + px;
      const pxLeft = (px - 1 + TEX_W) % TEX_W;
      const pxRight = (px + 1) % TEX_W;

      const h = heights[idx];
      const hLeft = heights[py * TEX_W + pxLeft];
      const hRight = heights[py * TEX_W + pxRight];
      const hUp = heights[pyUp * TEX_W + px];
      const hDown = heights[pyDown * TEX_W + px];

      const dhDx = ((hRight - hLeft) * 0.5) / cosLat;
      const dhDy = (hDown - hUp) * 0.5;
      const slope = Math.min(1, Math.hypot(dhDx, dhDy) * 18);
      slopes[idx] = slope;

      let nx = -dhDx * normalStrength;
      let ny = dhDy * normalStrength;
      let nz = 1.0;
      const invLen = 1 / Math.hypot(nx, ny, nz);
      nx *= invLen;
      ny *= invLen;
      nz *= invLen;

      const micro = valueNoise(px * 0.42 + 20, py * 0.42 + 5);
      const o = idx * 4;

      const bumpVal = Math.max(0, Math.min(255, Math.round((h + 1) * 112 + micro * 30)));
      bImg.data[o] = bumpVal;
      bImg.data[o + 1] = bumpVal;
      bImg.data[o + 2] = bumpVal;
      bImg.data[o + 3] = 255;

      nImg.data[o] = Math.max(0, Math.min(255, Math.round((nx * 0.5 + 0.5) * 255)));
      nImg.data[o + 1] = Math.max(0, Math.min(255, Math.round((ny * 0.5 + 0.5) * 255)));
      nImg.data[o + 2] = Math.max(0, Math.min(255, Math.round((nz * 0.5 + 0.5) * 255)));
      nImg.data[o + 3] = 255;

      const roughVal = Math.abs(lat) > 78 ? 170 : Math.max(115, Math.min(248, Math.round(196 + slope * 48)));
      rImg.data[o] = roughVal;
      rImg.data[o + 1] = roughVal;
      rImg.data[o + 2] = roughVal;
      rImg.data[o + 3] = 255;
    }
  }

  bCtx.putImageData(bImg, 0, 0);
  nCtx.putImageData(nImg, 0, 0);
  rCtx.putImageData(rImg, 0, 0);

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.ClampToEdgeWrapping;
  bumpMap.anisotropy = maxAnisotropy;

  const normalMap = new THREE.CanvasTexture(normalCanvas);
  normalMap.wrapS = THREE.RepeatWrapping;
  normalMap.wrapT = THREE.ClampToEdgeWrapping;
  normalMap.anisotropy = maxAnisotropy;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.ClampToEdgeWrapping;
  roughnessMap.anisotropy = maxAnisotropy;

  cachedBaseField = { heights, slopes, bumpMap, normalMap, roughnessMap };
  return cachedBaseField;
}

export interface MarsSurfaceTextures {
  colorMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
}

export function createMarsSurfaceTextures(
  layer: DataLayerId,
  maxAnisotropy: number
): MarsSurfaceTextures {
  const base = getOrBuildBaseField(maxAnisotropy);
  const existingColor = cachedLayerColorMaps.get(layer);
  if (existingColor) {
    return {
      colorMap: existingColor,
      bumpMap: base.bumpMap,
      normalMap: base.normalMap,
      roughnessMap: base.roughnessMap,
    };
  }

  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = TEX_W;
  colorCanvas.height = TEX_H;
  const cCtx = colorCanvas.getContext('2d')!;
  const cImg = cCtx.createImageData(TEX_W, TEX_H);

  for (let py = 0; py < TEX_H; py++) {
    const lat = 90 - (py / (TEX_H - 1)) * 180;
    for (let px = 0; px < TEX_W; px++) {
      const idx = py * TEX_W + px;
      const pxLeft = (px - 1 + TEX_W) % TEX_W;
      const pxRight = (px + 1) % TEX_W;
      const lonRaw = (px / (TEX_W - 1)) * 360 - 180;
      const lonNorm = lonRaw < 0 ? lonRaw + 360 : lonRaw;

      const h = base.heights[idx];
      const hLeft = base.heights[py * TEX_W + pxLeft];
      const hRight = base.heights[py * TEX_W + pxRight];
      const slope = base.slopes[idx];

      const grain = fbm(px * 0.08, py * 0.08, 3);
      const micro = valueNoise(px * 0.45 + 20, py * 0.45 + 5);

      let r = 175;
      let g = 66;
      let b = 28;

      if (layer === 'optical') {
        const warpX = valueNoise(px * 0.014, py * 0.014) * 26;
        const warpY = valueNoise(px * 0.014 + 31, py * 0.014 + 17) * 26;
        const mareNoise = fbm((px + warpX) * 0.02, (py + warpY) * 0.02, 3);

        const dSyrtis = angularDist(lat, lonNorm, 10, 68);
        const dAcidalia = angularDist(lat, lonNorm, 44, 338);
        const dCimmeria = angularDist(lat, lonNorm, -22, 150);
        const dErythraeum = angularDist(lat, lonNorm, -24, 326);
        const dMeridiani = angularDist(lat, lonNorm, -2, 355);
        const dUtopia = angularDist(lat, lonNorm, 46, 122);

        const mariaField =
          Math.exp(-(dSyrtis * dSyrtis) / 220) * 0.92 +
          Math.exp(-(dAcidalia * dAcidalia) / 340) * 0.84 +
          Math.exp(-(dCimmeria * dCimmeria) / 310) * 0.68 +
          Math.exp(-(dErythraeum * dErythraeum) / 290) * 0.72 +
          Math.exp(-(dMeridiani * dMeridiani) / 180) * 0.65 +
          Math.exp(-(dUtopia * dUtopia) / 260) * 0.42;

        const darkBasalt = Math.min(
          1.0,
          Math.max(0, (0.52 - mareNoise) * 2.35) * 0.68 + mariaField * 0.76
        );

        let ejectaGlow = 0;
        const rayCenters: [number, number][] = [
          [-24, 96],
          [8, 108],
          [-30, 260],
          [-18, 18],
        ];
        for (const [rLat, rLon] of rayCenters) {
          const d = angularDist(lat, lonNorm, rLat, rLon);
          if (d < 17) {
            const angle = Math.atan2(lat - rLat, ((lonNorm - rLon + 540) % 360) - 180);
            const rayStreak = 0.5 + 0.5 * Math.sin(angle * 11 + grain * 4);
            ejectaGlow += Math.exp(-(d * d) / 56) * (0.4 + 0.6 * rayStreak);
          }
        }
        ejectaGlow = Math.min(1, ejectaGlow);

        const ridgeLight = (hRight - hLeft) * 42;
        const baseR = 206 - darkBasalt * 140 + ejectaGlow * 40;
        const baseG = 78 - darkBasalt * 56 + ejectaGlow * 52;
        const baseB = 24 - darkBasalt * 18 + ejectaGlow * 28;

        r = baseR + h * 26 + ridgeLight + (grain - 0.5) * 26 + (micro - 0.5) * 20;
        g = baseG + h * 16 + ridgeLight * 0.68 + (grain - 0.5) * 14 + (micro - 0.5) * 11;
        b = baseB + h * 8 + ridgeLight * 0.35 + (micro - 0.5) * 8;

        if (Math.abs(lat) > 78) {
          const capBlend = Math.min(0.68, (Math.abs(lat) - 78) * 0.065 * (0.7 + grain * 0.6));
          r = r * (1 - capBlend) + 235 * capBlend;
          g = g * (1 - capBlend) + 224 * capBlend;
          b = b * (1 - capBlend) + 216 * capBlend;
        }
      } else if (layer === 'elevation') {
        const t = Math.max(0, Math.min(1, (h + 0.85) / 1.85));
        if (t < 0.25) {
          const k = t / 0.25;
          r = 22 + k * 14;
          g = 48 + k * 120;
          b = 140 + k * 65;
        } else if (t < 0.5) {
          const k = (t - 0.25) / 0.25;
          r = 36 + k * 120;
          g = 168 + k * 25;
          b = 205 - k * 135;
        } else if (t < 0.78) {
          const k = (t - 0.5) / 0.28;
          r = 156 + k * 84;
          g = 193 - k * 115;
          b = 70 - k * 35;
        } else {
          const k = (t - 0.78) / 0.22;
          r = 240 + k * 15;
          g = 78 + k * 165;
          b = 35 + k * 210;
        }
        const shade = 0.85 + (hRight - hLeft) * 3.5;
        r *= shade;
        g *= shade;
        b *= shade;
        if (Math.abs(((t * 18) % 1) - 0.5) < 0.04) {
          r *= 0.8;
          g *= 0.8;
          b *= 0.8;
        }
      } else if (layer === 'slope') {
        if (slope < 0.28) {
          r = 26 + slope * 175;
          g = 150 + slope * 85;
          b = 96;
        } else if (slope < 0.55) {
          const k = (slope - 0.28) / 0.27;
          r = 124 + k * 125;
          g = 175 - k * 42;
          b = 42;
        } else {
          const k = (slope - 0.55) / 0.45;
          r = 238;
          g = 90 - k * 60;
          b = 42;
        }
      } else if (layer === 'atmosphere') {
        const pressureNorm = Math.max(0, Math.min(1, 0.58 - h * 0.52));
        r = 28 + (1 - pressureNorm) * 145;
        g = 86 + pressureNorm * 135;
        b = 155 + pressureNorm * 95;
      } else {
        if (Math.abs(lat) > 77) {
          r = 205;
          g = 232;
          b = 242;
        } else if (h > 0.24) {
          r = 172;
          g = 68;
          b = 98;
        } else if (h < -0.24) {
          r = 52;
          g = 148;
          b = 166;
        } else {
          r = 202 - grain * 48;
          g = 140 - grain * 32;
          b = 72;
        }
      }

      const o = idx * 4;
      cImg.data[o] = Math.max(0, Math.min(255, Math.round(r)));
      cImg.data[o + 1] = Math.max(0, Math.min(255, Math.round(g)));
      cImg.data[o + 2] = Math.max(0, Math.min(255, Math.round(b)));
      cImg.data[o + 3] = 255;
    }
  }

  cCtx.putImageData(cImg, 0, 0);

  if (layer !== 'optical') {
    cCtx.strokeStyle = 'rgba(255,255,255,0.12)';
    cCtx.lineWidth = 1;
    for (let i = 1; i < 6; i++) {
      const y = (i / 6) * TEX_H;
      cCtx.beginPath();
      cCtx.moveTo(0, y);
      cCtx.lineTo(TEX_W, y);
      cCtx.stroke();
    }
    for (let j = 1; j < 12; j++) {
      const x = (j / 12) * TEX_W;
      cCtx.beginPath();
      cCtx.moveTo(x, 0);
      cCtx.lineTo(x, TEX_H);
      cCtx.stroke();
    }
  }

  const colorMap = new THREE.CanvasTexture(colorCanvas);
  colorMap.colorSpace = THREE.SRGBColorSpace;
  colorMap.wrapS = THREE.RepeatWrapping;
  colorMap.wrapT = THREE.ClampToEdgeWrapping;
  colorMap.anisotropy = maxAnisotropy;
  cachedLayerColorMaps.set(layer, colorMap);

  return {
    colorMap,
    bumpMap: base.bumpMap,
    normalMap: base.normalMap,
    roughnessMap: base.roughnessMap,
  };
}

/**
 * Generates and caches an astronomical deep-space Milky Way & star-dust sky dome texture.
 */
export function createDeepSpaceSkyTexture(): THREE.CanvasTexture {
  if (cachedSkyTex) return cachedSkyTex;

  const width = 768;
  const height = 384;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#010205';
  ctx.fillRect(0, 0, width, height);

  const img = ctx.getImageData(0, 0, width, height);
  for (let py = 0; py < height; py++) {
    const v = py / height;
    for (let px = 0; px < width; px++) {
      const u = px / width;
      const galPlane = Math.sin(u * Math.PI * 2 + 0.6) * 0.16 + 0.48;
      const distPlane = Math.abs(v - galPlane);
      const band = Math.exp(-(distPlane * distPlane) / 0.011);

      const dust = fbm(u * 14, v * 7, 3);
      const rift = valueNoise(u * 26 + 9, v * 13 + 4);
      const lane = Math.max(0, band * (0.45 + dust * 0.9 - Math.max(0, rift - 0.55) * 1.4));

      const o = (py * width + px) * 4;
      img.data[o] = Math.min(255, Math.round(2 + lane * 28));
      img.data[o + 1] = Math.min(255, Math.round(4 + lane * 34));
      img.data[o + 2] = Math.min(255, Math.round(10 + lane * 56));
      img.data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  cachedSkyTex = new THREE.CanvasTexture(canvas);
  cachedSkyTex.colorSpace = THREE.SRGBColorSpace;
  cachedSkyTex.wrapS = THREE.RepeatWrapping;
  cachedSkyTex.wrapT = THREE.ClampToEdgeWrapping;
  return cachedSkyTex;
}

/**
 * Renders full territorial country-style region fills and borders directly onto a transparent
 * equirectangular CanvasTexture aligned 1:1 with the 3D Mars sphere.
 */
export function createTerritoryOverlayTexture(
  sites: MarsSite[],
  selectedSiteId: string,
  hoveredSiteId: string | null,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const width = 1024;
  const height = 512;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, width, height);

  const lonToUnwrappedX = (lon: number, refLon: number) => {
    const d = ((lon - refLon + 540) % 360) - 180;
    const unwrapped = refLon + d;
    const u = (unwrapped + 180) / 360;
    return u * width;
  };

  for (const site of sites) {
    const poly = site.boundaryPolygon;
    if (poly.length < 3) continue;

    const isSelected = site.id === selectedSiteId;
    const isHovered = site.id === hoveredSiteId;

    const rgb =
      site.safetyVerdict === 'SAFE'
        ? '16, 185, 129'
        : site.safetyVerdict === 'CAUTION'
          ? '245, 158, 11'
          : '239, 68, 68';

    const fillAlpha = isSelected ? 0.34 : isHovered ? 0.26 : 0.16;
    const strokeAlpha = isSelected ? 0.98 : isHovered ? 0.85 : 0.68;

    const refLon = poly[0][1];
    const pts = poly.map(([lat, lon]) => ({
      x: lonToUnwrappedX(lon, refLon),
      y: ((90 - lat) / 180) * height,
    }));

    for (const shift of [-width, 0, width]) {
      const minX = Math.min(...pts.map((p) => p.x + shift));
      const maxX = Math.max(...pts.map((p) => p.x + shift));
      if (maxX < 0 || minX > width) continue;

      ctx.beginPath();
      pts.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.x + shift, p.y);
        else ctx.lineTo(p.x + shift, p.y);
      });
      ctx.closePath();

      ctx.fillStyle = `rgba(${rgb}, ${fillAlpha})`;
      ctx.fill();

      ctx.lineWidth = isSelected ? 3.2 : 1.8;
      ctx.strokeStyle = `rgba(${rgb}, ${strokeAlpha})`;
      ctx.stroke();

      if (isSelected) {
        ctx.save();
        ctx.setLineDash([7, 5]);
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = maxAnisotropy;
  return tex;
}