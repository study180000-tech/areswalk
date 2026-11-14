import type { MarsSite } from '../types/mars';

let activeUtterance: SpeechSynthesisUtterance | null = null;
let narrateCallback: (() => void) | null = null;

export function narrateSite(site: MarsSite): void {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  activeUtterance = null;

  const text = buildNarration(site);
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'en-US';
  utter.rate = 0.82;
  utter.pitch = 0.88;
  utter.volume = 1.0;

  // Pick a deep/authoritative voice if available
  const voices = window.speechSynthesis.getVoices();
  const preferred =
    voices.find((v) => /Google UK English Male/i.test(v.name)) ??
    voices.find((v) => v.lang === 'en-US' && v.name.includes('Male')) ??
    voices.find((v) => v.lang === 'en-US') ??
    voices[0];
  if (preferred) utter.voice = preferred;

  utter.onend = () => {
    activeUtterance = null;
    narrateCallback?.();
    narrateCallback = null;
  };
  utter.onerror = () => {
    activeUtterance = null;
  };

  activeUtterance = utter;
  window.speechSynthesis.speak(utter);
}

export function stopNarration(): void {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  activeUtterance = null;
}

export function isNarrating(): boolean {
  return 'speechSynthesis' in window && window.speechSynthesis.speaking;
}

export function onNarrationEnd(cb: () => void): void {
  narrateCallback = cb;
}

function buildNarration(site: MarsSite): string {
  const verdict =
    site.safetyVerdict === 'SAFE'
      ? 'This region is considered safe for human EVA operations, with manageable terrain and atmospheric conditions.'
      : site.safetyVerdict === 'CAUTION'
        ? 'Caution is advised. Terrain hazards and environmental factors require careful mission planning before human surface operations.'
        : 'This region is classified as hazardous. Robotic scouting is strongly recommended before any crewed EVA attempt.';

  const tempDesc =
    site.tempAvgC > -50
      ? 'relatively moderate'
      : site.tempAvgC > -70
        ? 'cold'
        : 'extremely cold';

  const o2Trace = Math.max(
    0.1,
    +(100 - site.atmosphereMix.co2 - site.atmosphereMix.n2 - site.atmosphereMix.ar).toFixed(2)
  );

  return [
    `Welcome to ${site.name}.`,
    `${site.geologySummary.slice(0, 240)}.`,
    `Atmospheric composition at this site:`,
    `Carbon dioxide: ${site.co2Percent} percent by volume.`,
    `Nitrogen: ${site.atmosphereMix.n2} percent.`,
    `Argon: ${site.atmosphereMix.ar} percent.`,
    `Trace gases including oxygen account for approximately ${o2Trace} percent.`,
    `Surface pressure is ${site.pressureKpa} kilopascals — roughly ${(site.pressureKpa / 101.325 * 100).toFixed(2)} percent of Earth sea-level pressure.`,
    `Thermal environment is ${tempDesc}, with an average surface temperature of ${site.tempAvgC} degrees Celsius.`,
    `Temperatures swing from a minimum of ${site.tempMinC} degrees to a maximum of ${site.tempMaxC} degrees Celsius.`,
    `Terrain elevation sits at ${site.elevationM.toLocaleString()} meters relative to the Martian datum.`,
    `Mean terrain slope is ${site.meanSlopeDeg} degrees, peaking at ${site.maxSlopeDeg} degrees in the most hazardous zones.`,
    `Daily radiation exposure is estimated at ${site.radiationMsvDay} millisieverts per day.`,
    `Dust opacity tau is ${site.dustOpacityTau}.`,
    `Subsurface water and ice potential: ${site.waterIcePotential}.`,
    `EVA assessment: ${verdict}`,
    site.evaRecommendation,
  ]
    .filter(Boolean)
    .join(' ');
}