import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI } from '@google/genai';
import { MARS_SITES } from './src/data/marsSites.ts';
import { evaluateRoverAnomalies } from './src/utils/marsLogic.ts';
import type { RoverTelemetryState } from './src/types/mars.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;
const ROCK_CAM_FALLBACK = '/assets/mars/esp32_rock_obstacle_1794654803410.jpg';

let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (aiClient) return aiClient;
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  aiClient = new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
  return aiClient;
}

const voiceCache = new Map<string, string>();

function getSite(siteId: string) {
  return MARS_SITES.find((s) => s.id === siteId) ?? MARS_SITES[0];
}

function createInitialState(siteId = 'jezero'): RoverTelemetryState {
  const site = getSite(siteId);
  const startWp = site.waypoints[0] ?? { x: 20, y: 78 };
  return {
    powered: false,
    activeSiteId: site.id,
    patrolActive: false,
    x: startWp.x,
    y: startWp.y,
    headingDeg: 45,
    distanceCm: 145,
    co2Ppm: site.co2BaselinePpm,
    pitchDeg: site.meanSlopeDeg,
    rollDeg: 1.2,
    batteryPct: 96,
    lastUpdated: Date.now(),
    source: 'standby',
    latestCameraFrame: null,
    cameraFrameTimestamp: null,
    cameraLabel: 'ESP32-CAM Standby',
    anomalies: [],
    trail: [{ x: startWp.x, y: startWp.y, hasAnomaly: false, timestamp: Date.now() }],
  };
}

let roverState: RoverTelemetryState = createInitialState('jezero');
let patrolPhase = 0;

function recomputeAndRecord(nextSource: RoverTelemetryState['source']) {
  const site = getSite(roverState.activeSiteId);
  const now = Date.now();
  roverState.source = nextSource;
  roverState.lastUpdated = now;
  roverState.anomalies = evaluateRoverAnomalies(
    {
      distanceCm: roverState.distanceCm,
      co2Ppm: roverState.co2Ppm,
      pitchDeg: roverState.pitchDeg,
      rollDeg: roverState.rollDeg,
    },
    site,
    now
  );

  if (roverState.powered) {
    const lastPt = roverState.trail[roverState.trail.length - 1];
    const moved =
      !lastPt || Math.hypot(roverState.x - lastPt.x, roverState.y - lastPt.y) >= 0.8;
    const hasAnomaly = roverState.anomalies.length > 0;
    if (moved || (lastPt && lastPt.hasAnomaly !== hasAnomaly)) {
      roverState.trail = [
        ...roverState.trail.slice(-119),
        { x: roverState.x, y: roverState.y, hasAnomaly, timestamp: now },
      ];
    }
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));
  app.use('/api/camera-frame', express.raw({ type: 'image/jpeg', limit: '5mb' }));

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  function broadcastState() {
    const payload = JSON.stringify({ type: 'state:update', payload: roverState });
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  wss.on('connection', (ws) => {
    ws.send(JSON.stringify({ type: 'state:init', payload: roverState }));
  });

  // Autonomous obstacle-avoidance patrol loop when powered & patrolActive
  setInterval(() => {
    if (!roverState.powered || !roverState.patrolActive) return;
    const site = getSite(roverState.activeSiteId);
    const wps = site.waypoints;
    if (wps.length < 2) return;

    // Pause forward motion if critical obstacle detected
    if (roverState.distanceCm <= 25) return;

    patrolPhase = (patrolPhase + 0.035) % wps.length;
    const idxA = Math.floor(patrolPhase) % wps.length;
    const idxB = (idxA + 1) % wps.length;
    const t = patrolPhase - Math.floor(patrolPhase);

    const nextX = wps[idxA].x + (wps[idxB].x - wps[idxA].x) * t;
    const nextY = wps[idxA].y + (wps[idxB].y - wps[idxA].y) * t;
    const dx = nextX - roverState.x;
    const dy = nextY - roverState.y;
    if (Math.hypot(dx, dy) > 0.05) {
      roverState.headingDeg = (Math.atan2(dx, -dy) * 180) / Math.PI;
    }

    roverState.x = Math.round(nextX * 10) / 10;
    roverState.y = Math.round(nextY * 10) / 10;
    roverState.batteryPct = Math.max(12, Math.round((roverState.batteryPct - 0.02) * 10) / 10);

    recomputeAndRecord(roverState.source === 'hardware' ? 'hardware' : 'bench-test');
    broadcastState();
  }, 550);

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, clients: wss.clients.size, powered: roverState.powered });
  });

  app.get('/api/sites', (_req, res) => {
    res.json({ sites: MARS_SITES });
  });

  app.get('/api/rover/state', (_req, res) => {
    res.json(roverState);
  });

  // Physical ESP32 / Arduino Wi-Fi telemetry ingestion endpoint
  app.post('/api/telemetry', (req, res) => {
    const body = req.body ?? {};
    roverState.powered = true;
    if (typeof body.siteId === 'string') {
      roverState.activeSiteId = getSite(body.siteId).id;
    }
    if (typeof body.distanceCm === 'number' && Number.isFinite(body.distanceCm)) {
      roverState.distanceCm = Math.max(1, Math.min(400, body.distanceCm));
    }
    if (typeof body.co2Ppm === 'number' && Number.isFinite(body.co2Ppm)) {
      roverState.co2Ppm = Math.max(0, Math.min(10000, body.co2Ppm));
    }
    if (typeof body.pitchDeg === 'number' && Number.isFinite(body.pitchDeg)) {
      roverState.pitchDeg = Math.max(-90, Math.min(90, body.pitchDeg));
    }
    if (typeof body.rollDeg === 'number' && Number.isFinite(body.rollDeg)) {
      roverState.rollDeg = Math.max(-90, Math.min(90, body.rollDeg));
    }
    if (typeof body.x === 'number' && Number.isFinite(body.x)) {
      roverState.x = Math.max(2, Math.min(98, body.x));
    }
    if (typeof body.y === 'number' && Number.isFinite(body.y)) {
      roverState.y = Math.max(2, Math.min(98, body.y));
    }
    if (typeof body.headingDeg === 'number' && Number.isFinite(body.headingDeg)) {
      roverState.headingDeg = body.headingDeg;
    }
    if (typeof body.batteryPct === 'number' && Number.isFinite(body.batteryPct)) {
      roverState.batteryPct = Math.max(0, Math.min(100, body.batteryPct));
    }

    recomputeAndRecord('hardware');
    broadcastState();
    res.json({ ok: true, anomalies: roverState.anomalies, state: roverState });
  });

  // Physical ESP32-CAM snapshot endpoint (JSON base64 or raw image/jpeg)
  app.post('/api/camera-frame', (req, res) => {
    const now = Date.now();
    if (Buffer.isBuffer(req.body)) {
      const b64 = req.body.toString('base64');
      roverState.latestCameraFrame = `data:image/jpeg;base64,${b64}`;
      roverState.cameraFrameTimestamp = now;
      roverState.cameraLabel = 'ESP32-CAM Live Frame';
    } else if (req.body && typeof req.body.imageBase64 === 'string') {
      const raw = req.body.imageBase64;
      roverState.latestCameraFrame = raw.startsWith('data:')
        ? raw
        : `data:image/jpeg;base64,${raw}`;
      roverState.cameraFrameTimestamp = now;
      roverState.cameraLabel =
        typeof req.body.label === 'string' ? req.body.label : 'ESP32-CAM Live Frame';
    } else {
      res.status(400).json({ ok: false, error: 'Provide imageBase64 string or image/jpeg binary' });
      return;
    }

    roverState.powered = true;
    roverState.lastUpdated = now;
    broadcastState();
    res.json({ ok: true, timestamp: now });
  });

  // Bilingual Gemini TTS narration endpoint with in-memory cache
  app.post('/api/stories/voiceover', async (req, res) => {
    try {
      const { text, language = 'en' } = req.body ?? {};
      if (!text || typeof text !== 'string') {
        res.status(400).json({ ok: false, error: 'Text is required' });
        return;
      }

      const cacheKey = `${language}:${text.trim()}`;
      if (voiceCache.has(cacheKey)) {
        res.json({ ok: true, audio: voiceCache.get(cacheKey), cached: true });
        return;
      }

      const ai = getGenAI();
      if (!ai) {
        res.json({
          ok: false,
          fallback: 'speech-synthesis',
          error: 'No GEMINI_API_KEY configured',
        });
        return;
      }

      const isArabic = language === 'ar';
      const voiceName = isArabic ? 'Kore' : 'Puck';
      const style = isArabic
        ? 'Clear, authoritative Arabic planetary documentary narrator'
        : 'Clear, authoritative planetary mission documentary commander';

      const modelName = process.env.GEMINI_TTS_MODEL || 'gemini-2.5-flash';

      let base64Audio: string | undefined;
      let mimeType = 'audio/wav';

      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: text.trim(),
                  speechMetadata: {
                    style,
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName },
              },
            },
          },
        });

        const part = response.candidates?.[0]?.content?.parts?.[0];
        base64Audio = part?.inlineData?.data;
        if (part?.inlineData?.mimeType) {
          mimeType = part.inlineData.mimeType;
        }
      } catch (primaryErr) {
        // Fallback to gemini-2.0-flash if primary model fails
        if (modelName !== 'gemini-2.0-flash') {
          try {
            const fallbackRes = await ai.models.generateContent({
              model: 'gemini-2.0-flash',
              contents: [{ role: 'user', parts: [{ text: text.trim() }] }],
              config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName },
                  },
                },
              },
            });
            const part = fallbackRes.candidates?.[0]?.content?.parts?.[0];
            base64Audio = part?.inlineData?.data;
            if (part?.inlineData?.mimeType) {
              mimeType = part.inlineData.mimeType;
            }
          } catch {
            throw primaryErr;
          }
        } else {
          throw primaryErr;
        }
      }

      if (base64Audio) {
        const dataUri = `data:${mimeType};base64,${base64Audio}`;
        voiceCache.set(cacheKey, dataUri);
        res.json({ ok: true, audio: dataUri });
      } else {
        res.json({
          ok: false,
          fallback: 'speech-synthesis',
          error: 'No audio part returned',
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      res.json({ ok: false, fallback: 'speech-synthesis', error: message });
    }
  });

  // UI Control & Hardware Bench Test actions
  app.post('/api/rover/control', (req, res) => {
    const body = req.body ?? {};
    const action = body.action;
    const site = getSite(
      typeof body.siteId === 'string' ? body.siteId : roverState.activeSiteId
    );

    if (action === 'power') {
      const nextPowered = Boolean(body.powered);
      roverState.powered = nextPowered;
      if (nextPowered) {
        roverState.patrolActive = true;
        roverState.source = 'bench-test';
        roverState.latestCameraFrame = site.surfaceImage;
        roverState.cameraLabel = `Rover NavCam · ${site.name}`;
        roverState.cameraFrameTimestamp = Date.now();
      } else {
        roverState.patrolActive = false;
        roverState.source = 'standby';
      }
    } else if (action === 'site') {
      const wasPowered = roverState.powered;
      const wasPatrol = roverState.patrolActive;
      roverState = createInitialState(site.id);
      patrolPhase = 0;
      roverState.powered = wasPowered;
      roverState.patrolActive = wasPowered && wasPatrol;
      if (wasPowered) {
        roverState.source = 'bench-test';
        roverState.latestCameraFrame = site.surfaceImage;
        roverState.cameraLabel = `Rover NavCam · ${site.name}`;
        roverState.cameraFrameTimestamp = Date.now();
      }
    } else if (action === 'patrol') {
      if (!roverState.powered) roverState.powered = true;
      roverState.patrolActive = Boolean(body.patrolActive);
    } else if (action === 'move') {
      if (!roverState.powered) roverState.powered = true;
      roverState.patrolActive = false;
      const dx = Number(body.dx) || 0;
      const dy = Number(body.dy) || 0;
      roverState.x = Math.max(4, Math.min(96, Math.round((roverState.x + dx) * 10) / 10));
      roverState.y = Math.max(4, Math.min(96, Math.round((roverState.y + dy) * 10) / 10));
      if (dx !== 0 || dy !== 0) {
        roverState.headingDeg = (Math.atan2(dx, -dy) * 180) / Math.PI;
      }
    } else if (action === 'reset') {
      const keepPowered = roverState.powered;
      roverState = createInitialState(site.id);
      patrolPhase = 0;
      roverState.powered = keepPowered;
      roverState.patrolActive = keepPowered;
      if (keepPowered) {
        roverState.latestCameraFrame = site.surfaceImage;
        roverState.cameraLabel = `Rover NavCam · ${site.name}`;
        roverState.cameraFrameTimestamp = Date.now();
      }
    } else if (action === 'bench') {
      roverState.powered = true;
      const scenario = body.scenario;
      if (scenario === 'rock') {
        roverState.distanceCm = 16.4;
        roverState.latestCameraFrame = ROCK_CAM_FALLBACK;
        roverState.cameraFrameTimestamp = Date.now();
        roverState.cameraLabel = 'ESP32-CAM · Unmapped Rock Obstacle (16.4 cm)';
      } else if (scenario === 'tilt') {
        roverState.pitchDeg = 24.5;
        roverState.rollDeg = 16.2;
      } else if (scenario === 'co2') {
        roverState.co2Ppm = 2480;
      } else if (scenario === 'nominal') {
        roverState.distanceCm = 148;
        roverState.co2Ppm = site.co2BaselinePpm;
        roverState.pitchDeg = site.meanSlopeDeg;
        roverState.rollDeg = 1.2;
        roverState.latestCameraFrame = site.surfaceImage;
        roverState.cameraFrameTimestamp = Date.now();
        roverState.cameraLabel = `Rover NavCam · ${site.name} (Clear)`;
      }
    } else {
      res.status(400).json({ ok: false, error: 'Unknown control action' });
      return;
    }

    recomputeAndRecord(roverState.powered ? 'bench-test' : 'standby');
    broadcastState();
    res.json({ ok: true, state: roverState });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`AresWalk Mission Server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});