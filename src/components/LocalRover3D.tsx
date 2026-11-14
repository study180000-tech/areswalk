import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { MarsSite, RoverTelemetryState } from '../types/mars';

interface LocalRover3DProps {
  site: MarsSite;
  roverState: RoverTelemetryState;
}

function detectSoftwareGl(): boolean {
  const probe = document.createElement('canvas');
  const gl = probe.getContext('webgl2');
  if (!gl) return true;
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
  const gpu = String(gl.getParameter(param));
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
}

/**
 * Local 3D Surface Patch + Composite 10-part Rover Visualization.
 * Tilts dynamically with live IMU pitch/roll and renders unmapped basalt obstacle + ultrasonic cone.
 */
export function LocalRover3D({ site, roverState }: LocalRover3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({ site, roverState });
  stateRef.current = { site, roverState };
  const syncRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareGl();
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0f17);
    scene.fog = new THREE.FogExp2(0x0b0f17, 0.045);

    const camera = new THREE.PerspectiveCamera(
      40,
      Math.max(1, container.clientWidth) / Math.max(1, container.clientHeight),
      0.1,
      50
    );
    camera.position.set(0, 5.2, 7.8);
    camera.lookAt(0, 0.4, 0);

    const sun = new THREE.DirectionalLight(0xffeed8, 2.2);
    sun.position.set(6, 9, 5);
    scene.add(sun);
    scene.add(new THREE.HemisphereLight(0x93c5fd, 0x5c2d1c, 0.85));

    // Tiltable terrain stage group (responds to IMU pitch/roll!)
    const stageGroup = new THREE.Group();
    scene.add(stageGroup);

    const terrainGeo = new THREE.PlaneGeometry(10, 10, 24, 24);
    terrainGeo.rotateX(-Math.PI / 2);
    const posAttr = terrainGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      const h = Math.sin(x * 0.7) * Math.cos(z * 0.7) * 0.12;
      posAttr.setY(i, h);
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x9c4b2e,
      roughness: 0.92,
      metalness: 0.04,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    stageGroup.add(terrainMesh);

    const grid = new THREE.GridHelper(10, 10, 0x334155, 0x1e293b);
    grid.position.y = 0.03;
    stageGroup.add(grid);

    // Composite 10-part Mars Rover (THREE.Group)
    const roverGroup = new THREE.Group();
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.35,
      metalness: 0.55,
    });
    const goldFoilMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.25,
      metalness: 0.85,
    });
    const wheelMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.85,
      metalness: 0.2,
    });
    const sensorMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.45,
      roughness: 0.2,
      metalness: 0.7,
    });

    // 1. Primary Chassis Hull + 2. Gold Thermal Belly
    const hull = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.26, 1.3), chassisMat);
    hull.position.y = 0.42;
    roverGroup.add(hull);

    const belly = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.14, 1.1), goldFoilMat);
    belly.position.y = 0.24;
    roverGroup.add(belly);

    // 3. Solar / RTG Rear Deck
    const deck = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.06, 0.55),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.6 })
    );
    deck.position.set(0, 0.57, 0.32);
    roverGroup.add(deck);

    // 4-9. Six Lugged Rover Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.14, 16);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelOffsets: [number, number][] = [
      [-0.58, -0.48],
      [0.58, -0.48],
      [-0.58, 0],
      [0.58, 0],
      [-0.58, 0.48],
      [0.58, 0.48],
    ];
    for (const [wx, wz] of wheelOffsets) {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(wx, 0.18, wz);
      roverGroup.add(wheel);
    }

    // 10. Camera Mast + ESP32-CAM Head + Ultrasonic Front Transducers
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.62, 10), chassisMat);
    mast.position.set(0, 0.84, -0.35);
    roverGroup.add(mast);

    const camHead = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.15, 0.18), chassisMat);
    camHead.position.set(0, 1.16, -0.35);
    roverGroup.add(camHead);

    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.08, 12), sensorMat);
    lens.rotation.x = Math.PI / 2;
    lens.position.set(0, 1.16, -0.46);
    roverGroup.add(lens);

    // Live Green Rover Beacon Dome on Mast
    const beaconMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 1.0,
      roughness: 0.2,
    });
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), beaconMat);
    beacon.position.set(0, 1.32, -0.35);
    roverGroup.add(beacon);

    // Ultrasonic Scan Cone forward (-Z)
    const coneGeo = new THREE.ConeGeometry(0.42, 1.35, 16, 1, true);
    coneGeo.rotateX(Math.PI / 2);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const scanCone = new THREE.Mesh(coneGeo, coneMat);
    scanCone.position.set(0, 0.36, -1.32);
    roverGroup.add(scanCone);

    // Unmapped Obstacle Rock ahead of rover (shown when ultrasonic < 45cm)
    const rockGeo = new THREE.DodecahedronGeometry(0.36, 1);
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.9,
      metalness: 0.08,
    });
    const rockMesh = new THREE.Mesh(rockGeo, rockMat);
    rockMesh.position.set(0, 0.24, -1.55);
    rockMesh.visible = false;
    roverGroup.add(rockMesh);

    stageGroup.add(roverGroup);

    let frameId = 0;
    let busy = false;
    let dirty = false;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const st = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (st === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 70);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function renderOnce() {
      if (busy) {
        dirty = true;
        return;
      }
      busy = true;
      frameId = requestAnimationFrame(() => {
        dirty = false;
        const { roverState: rs } = stateRef.current;

        // Map 0..100m sector to -4..+4 stage coords
        const rx = ((rs.x - 50) / 50) * 4.0;
        const rz = ((rs.y - 50) / 50) * 4.0;
        roverGroup.position.set(rx, 0.04, rz);
        roverGroup.rotation.y = (-rs.headingDeg * Math.PI) / 180;

        // Apply live IMU pitch & roll tilt to terrain & rover
        stageGroup.rotation.x = THREE.MathUtils.degToRad(
          Math.max(-32, Math.min(32, rs.pitchDeg * 0.65))
        );
        stageGroup.rotation.z = THREE.MathUtils.degToRad(
          Math.max(-32, Math.min(32, -rs.rollDeg * 0.65))
        );

        const hasObstacle = rs.distanceCm <= 40;
        const hasAnomaly = rs.anomalies.length > 0;
        rockMesh.visible = hasObstacle;
        if (hasObstacle) {
          const distScale = Math.max(0.75, Math.min(1.6, rs.distanceCm / 20));
          rockMesh.position.z = -distScale;
        }

        beaconMat.color.setHex(hasAnomaly ? 0xef4444 : rs.powered ? 0x10b981 : 0x64748b);
        beaconMat.emissive.setHex(hasAnomaly ? 0xef4444 : rs.powered ? 0x10b981 : 0x334155);
        coneMat.color.setHex(hasObstacle ? 0xef4444 : 0x10b981);
        scanCone.visible = rs.powered;

        renderer.render(scene, camera);

        const done = () => {
          busy = false;
          if (dirty) renderOnce();
        };
        if (isSoftwareGl) afterDraw(done);
        else done();
      });
    }

    syncRef.current = renderOnce;
    renderOnce();

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderOnce();
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', onResize);
      terrainGeo.dispose();
      terrainMat.dispose();
      wheelGeo.dispose();
      coneGeo.dispose();
      coneMat.dispose();
      rockGeo.dispose();
      rockMat.dispose();
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    syncRef.current?.();
  }, [site, roverState]);

  return (
    <div
      ref={mountRef}
      data-testid="local-rover-3d"
      className="w-full h-44 rounded border border-slate-800 bg-[#0B0F17] overflow-hidden"
    />
  );
}