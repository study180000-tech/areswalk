import type {
  AnomalyAlert,
  EvaWaypoint,
  MarsSite,
  SafetyVerdict,
  TerrainHazard,
} from '../types/mars';

export interface CartesianPoint {
  x: number;
  y: number;
  z: number;
}

/**
 * Converts Martian latitude (-90..90) and East longitude (0..360)
 * onto a 3D sphere matching Three.js equirectangular UV mapping.
 */
export function latLonToVector3(
  latDeg: number,
  lonDeg: number,
  radius: number
): CartesianPoint {
  const phi = ((90 - latDeg) * Math.PI) / 180;
  const theta = ((lonDeg + 180) * Math.PI) / 180;

  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return { x, y, z };
}

/**
 * Inverse projection from a 3D point on the Mars sphere back to Martian
 * latitude (-90..90) and East longitude (0..360).
 */
export function vector3ToLatLon(
  x: number,
  y: number,
  z: number
): { lat: number; lon: number } {
  const r = Math.hypot(x, y, z) || 1;
  const lat = 90 - (Math.acos(Math.max(-1, Math.min(1, y / r))) * 180) / Math.PI;
  let theta = (Math.atan2(z, -x) * 180) / Math.PI;
  if (theta < 0) theta += 360;
  let lon = theta - 180;
  lon = ((lon % 360) + 360) % 360;
  return { lat, lon };
}

/**
 * Ray-casting point-in-polygon check on geographic [lat, lon] coordinates.
 */
export function isPointInPolygon(
  lat: number,
  lon: number,
  polygon: [number, number][]
): boolean {
  if (polygon.length < 3) return false;
  const normLon = ((lon % 360) + 360) % 360;

  // Unwrap longitudes relative to first vertex to prevent 0/360 seam splits
  const baseLon = polygon[0][1];
  const unwrap = (l: number) => {
    let d = ((l - baseLon + 540) % 360) - 180;
    return baseLon + d;
  };
  const testLon = unwrap(normLon);

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = unwrap(polygon[i][1]);
    const xj = polygon[j][0];
    const yj = unwrap(polygon[j][1]);

    const intersect =
      yi > testLon !== yj > testLon &&
      lat < ((xj - xi) * (testLon - yi)) / (yj - yi || 1e-9) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Finds the Martian region territory containing the clicked lat/lon coordinate.
 */
export function findSiteAtLatLon(
  lat: number,
  lon: number,
  sites: MarsSite[]
): MarsSite | null {
  for (const site of sites) {
    if (isPointInPolygon(lat, lon, site.boundaryPolygon)) {
      return site;
    }
  }
  return null;
}

export interface SiteSafetyAssessment {
  verdict: SafetyVerdict;
  score: number; // 0..100
  factors: string[];
}

export function assessSiteSafety(site: MarsSite): SiteSafetyAssessment {
  let score = 100;
  const factors: string[] = [];

  if (site.meanSlopeDeg > 20) {
    score -= 42;
    factors.push(`Extreme slope (${site.meanSlopeDeg.toFixed(1)}° mean)`);
  } else if (site.meanSlopeDeg > 10) {
    score -= 22;
    factors.push(`Steep ascent terrain (${site.meanSlopeDeg.toFixed(1)}° mean)`);
  } else if (site.meanSlopeDeg > 5) {
    score -= 10;
    factors.push(`Moderate relief (${site.meanSlopeDeg.toFixed(1)}° mean)`);
  }

  if (site.radiationMsvDay >= 1.0) {
    score -= 28;
    factors.push(`High radiation dose (${site.radiationMsvDay.toFixed(2)} mSv/day)`);
  } else if (site.radiationMsvDay >= 0.65) {
    score -= 8;
  }

  if (site.pressureKpa < 0.2) {
    score -= 22;
    factors.push(`Ultra-thin atmosphere (${site.pressureKpa.toFixed(2)} kPa)`);
  }

  if (site.dustOpacityTau >= 0.9) {
    score -= 18;
    factors.push(`High dust opacity (Tau ${site.dustOpacityTau.toFixed(2)})`);
  } else if (site.dustOpacityTau >= 0.7) {
    score -= 8;
  }

  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  let verdict: SafetyVerdict = 'SAFE';
  if (clampedScore < 50 || site.meanSlopeDeg > 18 || site.pressureKpa < 0.2) {
    verdict = 'HAZARDOUS';
  } else if (clampedScore < 80 || site.meanSlopeDeg > 5) {
    verdict = 'CAUTION';
  }

  return { verdict, score: clampedScore, factors };
}

export interface RoverSensorSnapshot {
  distanceCm: number;
  co2Ppm: number;
  pitchDeg: number;
  rollDeg: number;
}

export const ROVER_THRESHOLDS = {
  obstacleCriticalCm: 25,
  obstacleWarningCm: 38,
  slopeWarningDeg: 14,
  slopeCriticalDeg: 20,
  co2SpikeMultiplier: 2.0,
  co2AbsoluteWarningPpm: 900,
  co2AbsoluteCriticalPpm: 1500,
};

export function evaluateRoverAnomalies(
  sensor: RoverSensorSnapshot,
  site: MarsSite,
  now = Date.now()
): AnomalyAlert[] {
  const alerts: AnomalyAlert[] = [];

  if (sensor.distanceCm <= ROVER_THRESHOLDS.obstacleWarningCm) {
    const critical = sensor.distanceCm <= ROVER_THRESHOLDS.obstacleCriticalCm;
    alerts.push({
      id: 'anomaly-obstacle',
      type: 'OBSTACLE_DETECTED',
      severity: critical ? 'CRITICAL' : 'WARNING',
      title: critical
        ? 'CRITICAL OBSTACLE: Unmapped Rock Ahead'
        : 'OBSTACLE WARNING: Forward Path Blocked',
      titleAr: critical
        ? 'تحذير حرج: تم رصد صخرة / عائق غير مسجل في بيانات ناسا'
        : 'تنبيه عائق: جسم قريب أمام العربة',
      detail: `Ultrasonic sensor measured obstacle at ${sensor.distanceCm.toFixed(1)} cm — not present in NASA orbital baseline map.`,
      detailAr: `حساس الألتراسونيك رصد جسماً على مسافة ${sensor.distanceCm.toFixed(1)} سم مع انحراف لحظي عن خريطة ناسا.`,
      measuredValue: `${sensor.distanceCm.toFixed(1)} cm`,
      nasaBaseline: 'Clear corridor (>100 cm)',
      timestamp: now,
    });
  }

  const maxTilt = Math.max(Math.abs(sensor.pitchDeg), Math.abs(sensor.rollDeg));
  const slopeDelta = Math.abs(maxTilt - site.meanSlopeDeg);
  if (maxTilt >= ROVER_THRESHOLDS.slopeWarningDeg) {
    const critical = maxTilt >= ROVER_THRESHOLDS.slopeCriticalDeg;
    alerts.push({
      id: 'anomaly-slope',
      type: 'SLOPE_ANOMALY',
      severity: critical ? 'CRITICAL' : 'WARNING',
      title: critical
        ? 'CRITICAL INCLINE ANOMALY: Rollover Hazard'
        : 'SLOPE SHIFT DETECTED: Terrain Exceeds Baseline',
      titleAr: critical
        ? 'تحذير حرج: تغير لحظي حاد في الانحدار — خطر انقلاب!'
        : 'تنبيه انحدار: ميلان أعلى من متوسط بيانات ناسا',
      detail: `Live IMU incline ${maxTilt.toFixed(1)}° deviates by ${slopeDelta.toFixed(1)}° from ${site.name} MOLA baseline (${site.meanSlopeDeg.toFixed(1)}°).`,
      detailAr: `انحدار العربة الحالي ${maxTilt.toFixed(1)}° يتجاوز خط أساس ناسا (${site.meanSlopeDeg.toFixed(1)}°).`,
      measuredValue: `${maxTilt.toFixed(1)}° tilt`,
      nasaBaseline: `${site.meanSlopeDeg.toFixed(1)}° MOLA`,
      timestamp: now,
    });
  }

  const co2Ratio = sensor.co2Ppm / Math.max(1, site.co2BaselinePpm);
  if (
    sensor.co2Ppm >= ROVER_THRESHOLDS.co2AbsoluteWarningPpm ||
    co2Ratio >= ROVER_THRESHOLDS.co2SpikeMultiplier
  ) {
    const critical = sensor.co2Ppm >= ROVER_THRESHOLDS.co2AbsoluteCriticalPpm;
    alerts.push({
      id: 'anomaly-co2',
      type: 'CO2_ANOMALY',
      severity: critical ? 'CRITICAL' : 'WARNING',
      title: critical
        ? 'CRITICAL CO2 SPIKE: Atmospheric Plume Detected'
        : 'GAS ANOMALY: Elevated CO2 Above Baseline',
      titleAr: critical
        ? 'تحذير حرج: ارتفاع لحظي حاد في نسبة ثاني أكسيد الكربون!'
        : 'تنبيه غاز: تغير مفاجئ في نسبة ثاني أكسيد الكربون',
      detail: `Live CO2 sensor spiked to ${Math.round(sensor.co2Ppm)} ppm (${co2Ratio.toFixed(1)}× local reference ${site.co2BaselinePpm} ppm / ${site.co2Percent}% Mars atm).`,
      detailAr: `قراءة حساس ثاني أكسيد الكربون قفزت إلى ${Math.round(sensor.co2Ppm)} ppm مقارنة بالمرجع (${site.co2BaselinePpm} ppm).`,
      measuredValue: `${Math.round(sensor.co2Ppm)} ppm`,
      nasaBaseline: `${site.co2BaselinePpm} ppm ref (${site.co2Percent}% atm)`,
      timestamp: now,
    });
  }

  return alerts;
}

export interface RouteMetrics {
  totalDistanceM: number;
  estimatedEvaMinutes: number;
  minHazardClearanceM: number;
  elevationGainM: number;
}

export function computeRouteMetrics(
  waypoints: EvaWaypoint[],
  hazards: TerrainHazard[]
): RouteMetrics {
  if (waypoints.length === 0) {
    return {
      totalDistanceM: 0,
      estimatedEvaMinutes: 0,
      minHazardClearanceM: 0,
      elevationGainM: 0,
    };
  }

  let totalDistanceM = 0;
  let elevationGainM = 0;

  for (let i = 1; i < waypoints.length; i++) {
    const prev = waypoints[i - 1];
    const curr = waypoints[i];
    totalDistanceM += Math.hypot(curr.x - prev.x, curr.y - prev.y);
    const dElev = curr.elevationOffsetM - prev.elevationOffsetM;
    if (dElev > 0) elevationGainM += dElev;
  }

  let minHazardClearanceM = Infinity;
  if (hazards.length > 0 && waypoints.length > 1) {
    for (let i = 1; i < waypoints.length; i++) {
      const a = waypoints[i - 1];
      const b = waypoints[i];
      for (const h of hazards) {
        const distToSeg = pointToSegmentDistance(h.x, h.y, a.x, a.y, b.x, b.y);
        const clearance = distToSeg - h.radiusM;
        if (clearance < minHazardClearanceM) {
          minHazardClearanceM = clearance;
        }
      }
    }
  } else {
    minHazardClearanceM = 50;
  }

  const suitSpeedMs = 0.75;
  const estimatedEvaMinutes = Math.max(1, Math.round(totalDistanceM / suitSpeedMs / 60));

  return {
    totalDistanceM: Math.round(totalDistanceM * 10) / 10,
    estimatedEvaMinutes,
    minHazardClearanceM: Math.round(Math.max(0, minHazardClearanceM) * 10) / 10,
    elevationGainM: Math.round(elevationGainM),
  };
}

function pointToSegmentDistance(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
): number {
  const vx = bx - ax;
  const vy = by - ay;
  const lenSq = vx * vx + vy * vy;
  if (lenSq === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / lenSq));
  const projX = ax + t * vx;
  const projY = ay + t * vy;
  return Math.hypot(px - projX, py - projY);
}