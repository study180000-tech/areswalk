export type DataLayerId =
  | 'optical'
  | 'elevation'
  | 'slope'
  | 'atmosphere'
  | 'geology';

export type SafetyVerdict = 'SAFE' | 'CAUTION' | 'HAZARDOUS';

export type AppMode = 'archive' | 'rover';

export type UiLang = 'en' | 'ar';

export interface EvaWaypoint {
  id: string;
  label: string;
  labelAr: string;
  x: number; // 0..100 meters in local sector
  y: number; // 0..100 meters in local sector
  scienceGoal: string;
  scienceGoalAr: string;
  elevationOffsetM: number;
}

export interface TerrainHazard {
  id: string;
  label: string;
  x: number;
  y: number;
  radiusM: number;
  type: 'boulder' | 'scarp' | 'dust-trap' | 'crater-rim';
  slopeDeg: number;
}

export interface SiteGalleryImage {
  id: string;
  url: string;
  title: string;
  titleAr: string;
  source: string;
  instrument: string;
}

export interface PanoramaHotspot {
  id: string;
  label: string;
  category: 'geology' | 'hazard' | 'instrument' | 'atmosphere';
  azimuthDeg: number; // 0..360 horizontal bearing
  elevationDeg: number; // -35..35 vertical pitch
  reading: string;
  detail: string;
  source: string;
}

export interface MarsSite {
  id: string;
  name: string;
  nameAr: string;
  subtitle: string;
  subtitleAr: string;
  lat: number; // degrees North (+) or South (-)
  lon: number; // degrees East (0..360)
  areaKm2: number;
  diameterKm: number;
  /** Geographic [lat, lon] polygon defining full clickable territory on Mars */
  boundaryPolygon: [number, number][];
  missionRef: string;
  nasaSources: string[];
  elevationM: number; // MOLA elevation relative to Martian datum
  elevationDatum: string;
  meanSlopeDeg: number;
  maxSlopeDeg: number;
  pressureKpa: number;
  pressureNote: string;
  co2Percent: number;
  co2MeasurementSource: string;
  atmosphereMix: {
    co2: number;
    n2: number;
    ar: number;
  };
  co2BaselinePpm: number; // Local reference scale for hardware sensor comparison
  tempAvgC: number;
  tempMinC: number;
  tempMaxC: number;
  radiationMsvDay: number;
  dustOpacityTau: number;
  waterIcePotential: string;
  waterIcePotentialAr: string;
  geologySummary: string;
  geologySummaryAr: string;
  evaRecommendation: string;
  evaRecommendationAr: string;
  scientificCaveats: string;
  safetyVerdict: SafetyVerdict;
  surfaceImage: string;
  panoramaImage: string;
  panoramaCaption: string;
  panoramaHotspots: PanoramaHotspot[];
  imageCaption: string;
  imageSource: string;
  gallery: SiteGalleryImage[];
  waypoints: EvaWaypoint[];
  hazards: TerrainHazard[];
  layerNotes: Record<DataLayerId, string>;
  layerNotesAr: Record<DataLayerId, string>;
}

export interface AnomalyAlert {
  id: string;
  type: 'OBSTACLE_DETECTED' | 'SLOPE_ANOMALY' | 'CO2_ANOMALY';
  severity: 'CRITICAL' | 'WARNING';
  title: string;
  titleAr: string;
  detail: string;
  detailAr: string;
  measuredValue: string;
  nasaBaseline: string;
  timestamp: number;
}

export interface TrailPoint {
  x: number;
  y: number;
  hasAnomaly: boolean;
  timestamp: number;
}

export interface RoverTelemetryState {
  powered: boolean;
  activeSiteId: string;
  patrolActive: boolean;
  x: number; // 0..100m
  y: number; // 0..100m
  headingDeg: number;
  distanceCm: number; // HC-SR04 ultrasonic
  co2Ppm: number; // Gas sensor ppm
  pitchDeg: number; // IMU pitch
  rollDeg: number; // IMU roll
  batteryPct: number;
  lastUpdated: number;
  source: 'hardware' | 'bench-test' | 'standby';
  latestCameraFrame: string | null;
  cameraFrameTimestamp: number | null;
  cameraLabel: string;
  anomalies: AnomalyAlert[];
  trail: TrailPoint[];
}