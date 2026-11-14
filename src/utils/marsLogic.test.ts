import test from 'node:test';
import assert from 'node:assert/strict';
import { MARS_SITES } from '../data/marsSites';
import {
  assessSiteSafety,
  computeRouteMetrics,
  evaluateRoverAnomalies,
  findSiteAtLatLon,
  isPointInPolygon,
  latLonToVector3,
  vector3ToLatLon,
} from './marsLogic';

test('latLonToVector3 and vector3ToLatLon round-trip accurately', () => {
  const radius = 5;
  for (const site of MARS_SITES) {
    const pt = latLonToVector3(site.lat, site.lon, radius);
    const magnitude = Math.hypot(pt.x, pt.y, pt.z);
    assert.ok(Math.abs(magnitude - radius) < 1e-6);

    const back = vector3ToLatLon(pt.x, pt.y, pt.z);
    assert.ok(Math.abs(back.lat - site.lat) < 1e-4);
    assert.ok(Math.abs(back.lon - site.lon) < 1e-4);
  }
});

test('territory polygons contain their center site coordinates and match via findSiteAtLatLon', () => {
  for (const site of MARS_SITES) {
    assert.ok(
      site.boundaryPolygon.length >= 6,
      `${site.id} should define a rich territory polygon`
    );
    assert.equal(
      isPointInPolygon(site.lat, site.lon, site.boundaryPolygon),
      true,
      `${site.id} polygon must contain its center`
    );
    const hit = findSiteAtLatLon(site.lat, site.lon, MARS_SITES);
    assert.equal(hit?.id, site.id);
  }

  // Open Mars region outside all 5 territories
  assert.equal(findSiteAtLatLon(-65, 20, MARS_SITES), null);
});

test('assessSiteSafety distinguishes SAFE and CAUTION terrain indices across the 5 NASA PDF sites', () => {
  const utopia = MARS_SITES.find((s) => s.id === 'utopia')!;
  const jezero = MARS_SITES.find((s) => s.id === 'jezero')!;
  const gale = MARS_SITES.find((s) => s.id === 'gale')!;
  const meridiani = MARS_SITES.find((s) => s.id === 'meridiani')!;
  const gusev = MARS_SITES.find((s) => s.id === 'gusev')!;

  const utopiaResult = assessSiteSafety(utopia);
  assert.equal(utopiaResult.verdict, 'SAFE');
  assert.ok(utopiaResult.score >= 80);

  for (const s of [jezero, gale, meridiani, gusev]) {
    const res = assessSiteSafety(s);
    assert.ok(res.verdict === 'CAUTION' || res.verdict === 'HAZARDOUS');
  }
});

test('evaluateRoverAnomalies returns empty when nominal and triggers all 3 anomaly types on spikes', () => {
  const gale = MARS_SITES.find((s) => s.id === 'gale')!;

  const nominal = evaluateRoverAnomalies(
    { distanceCm: 140, co2Ppm: 450, pitchDeg: 4.5, rollDeg: 2.0 },
    gale,
    1000
  );
  assert.equal(nominal.length, 0);

  const rockAnomaly = evaluateRoverAnomalies(
    { distanceCm: 16.5, co2Ppm: 455, pitchDeg: 5.0, rollDeg: 1.5 },
    gale,
    1000
  );
  assert.equal(rockAnomaly.length, 1);
  assert.equal(rockAnomaly[0].type, 'OBSTACLE_DETECTED');
  assert.equal(rockAnomaly[0].severity, 'CRITICAL');

  const multiAnomaly = evaluateRoverAnomalies(
    { distanceCm: 18, co2Ppm: 2450, pitchDeg: 24.0, rollDeg: 6.0 },
    gale,
    1000
  );
  assert.equal(multiAnomaly.length, 3);
  const types = multiAnomaly.map((a) => a.type);
  assert.ok(types.includes('OBSTACLE_DETECTED'));
  assert.ok(types.includes('SLOPE_ANOMALY'));
  assert.ok(types.includes('CO2_ANOMALY'));
});

test('computeRouteMetrics calculates EVA distance, time, and hazard clearance', () => {
  for (const site of MARS_SITES) {
    const metrics = computeRouteMetrics(site.waypoints, site.hazards);
    assert.ok(metrics.totalDistanceM > 40);
    assert.ok(metrics.estimatedEvaMinutes >= 1);
    assert.ok(
      metrics.minHazardClearanceM > 0,
      `${site.id} planned EVA route must maintain positive clearance from hazards`
    );
    assert.ok(site.panoramaHotspots.length >= 3, `${site.id} should define 360 panorama hotspots`);
  }
});