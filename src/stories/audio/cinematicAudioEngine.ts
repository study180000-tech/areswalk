/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class CinematicAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambienceGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  // Active sound sources
  private windNode: AudioBufferSourceNode | null = null;
  private lfoNode: OscillatorNode | null = null;
  private currentVoiceAudio: HTMLAudioElement | null = null;
  private isMuted = false;
  private userUnlocked = false;

  // Local audio overrides registry (drop-in custom voiceover/SFX mapping)
  private audioOverrides = new Map<string, string>();

  private initContext() {
    if (this.ctx && this.ctx.state !== 'closed') {
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
      return;
    }

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.85, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.ambienceGain = this.ctx.createGain();
    this.ambienceGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
    this.ambienceGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(0.9, this.ctx.currentTime);
    this.sfxGain.connect(this.masterGain);
  }

  public unlock() {
    this.userUnlocked = true;
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.85, this.ctx.currentTime, 0.05);
    }
    if (this.currentVoiceAudio) {
      this.currentVoiceAudio.muted = muted;
    }
  }

  // --- Local Audio Overrides Registry ---
  public registerAudioOverride(key: string, audioUrl: string): void {
    this.audioOverrides.set(key.toLowerCase(), audioUrl);
  }

  public registerAudioOverrides(overrides: Record<string, string>): void {
    for (const [key, url] of Object.entries(overrides)) {
      this.audioOverrides.set(key.toLowerCase(), url);
    }
  }

  public getAudioOverride(key: string): string | null {
    return this.audioOverrides.get(key.toLowerCase()) ?? null;
  }

  public hasAudioOverride(key: string): boolean {
    return this.audioOverrides.has(key.toLowerCase());
  }

  public resolveOverride(chapterId: string, beatId: string, lang: string): string | null {
    const keysToTry = [
      `${beatId}-${lang}`,
      `${beatId}_${lang}`,
      `${chapterId}-${beatId}-${lang}`,
      `${chapterId}_${beatId}_${lang}`,
      beatId,
    ];
    for (const k of keysToTry) {
      const match = this.getAudioOverride(k);
      if (match) return match;
    }
    return null;
  }

  // --- Procedural Martian Wind Ambience ---
  public startAmbience() {
    this.initContext();
    if (!this.ctx || !this.ambienceGain || this.windNode) return;

    try {
      // 5-second loop of filtered pink/brownian noise
      const bufferSize = this.ctx.sampleRate * 5;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0,
        b1 = 0,
        b2 = 0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Pink-like filter
        b0 = 0.99765 * b0 + white * 0.099046;
        b1 = 0.963 * b1 + white * 0.101;
        b2 = 0.57 * b2 + white * 0.55;
        output[i] = (b0 + b1 + b2) * 0.12;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // Lowpass resonant wind filter
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, this.ctx.currentTime);
      filter.Q.setValueAtTime(4.2, this.ctx.currentTime);

      // Slow LFO for gusting wind dynamics
      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.18, this.ctx.currentTime);
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(140, this.ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      whiteNoise.connect(filter);
      filter.connect(this.ambienceGain);

      whiteNoise.start();
      lfo.start();
      this.windNode = whiteNoise;
      this.lfoNode = lfo;
    } catch {
      // Audio autoplay limitation
    }
  }

  public stopAmbience() {
    if (this.windNode) {
      try {
        this.windNode.stop();
        this.windNode.disconnect();
      } catch {
        // Ignored
      }
      this.windNode = null;
    }
    if (this.lfoNode) {
      try {
        this.lfoNode.stop();
        this.lfoNode.disconnect();
      } catch {
        // Ignored
      }
      this.lfoNode = null;
    }
  }

  // --- Dynamic Audio Ducking ---
  public duckAmbience(targetGain = 0.18, rampSec = 0.25) {
    if (this.ambienceGain && this.ctx) {
      this.ambienceGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, rampSec);
    }
  }

  public restoreAmbience(targetGain = 0.7, rampSec = 0.35) {
    if (this.ambienceGain && this.ctx) {
      this.ambienceGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, rampSec);
    }
  }

  // --- Tension Riser for Atmospheric Descent and EVA Decisions ---
  public playRiser(durationSec = 3.2) {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const riserGain = this.ctx.createGain();
      const bpf = this.ctx.createBiquadFilter();

      osc1.type = 'sawtooth';
      osc2.type = 'triangle';

      // Pitch sweep from sub-bass to tension treble
      osc1.frequency.setValueAtTime(68, now);
      osc1.frequency.exponentialRampToValueAtTime(520, now + durationSec);

      osc2.frequency.setValueAtTime(136, now);
      osc2.frequency.exponentialRampToValueAtTime(1040, now + durationSec);

      bpf.type = 'bandpass';
      bpf.frequency.setValueAtTime(180, now);
      bpf.frequency.exponentialRampToValueAtTime(1800, now + durationSec);
      bpf.Q.setValueAtTime(3.5, now);

      // Crescendo volume ramp
      riserGain.gain.setValueAtTime(0.01, now);
      riserGain.gain.exponentialRampToValueAtTime(0.48, now + durationSec * 0.88);
      riserGain.gain.exponentialRampToValueAtTime(0.001, now + durationSec + 0.15);

      osc1.connect(bpf);
      osc2.connect(bpf);
      bpf.connect(riserGain);
      riserGain.connect(this.sfxGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + durationSec + 0.2);
      osc2.stop(now + durationSec + 0.2);
    } catch {
      // Ignored
    }
  }

  // --- Discovery Swell for Scientific Breakthroughs & Orbital Reveals ---
  public playDiscoverySwell(durationSec = 3.8) {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const freqs = [146.83, 220.0, 293.66, 440.0]; // D minor / planetary resonance
      const swellGain = this.ctx.createGain();
      swellGain.gain.setValueAtTime(0.001, now);
      swellGain.gain.exponentialRampToValueAtTime(0.38, now + durationSec * 0.4);
      swellGain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(350, now);
      filter.frequency.exponentialRampToValueAtTime(2600, now + durationSec * 0.5);
      filter.frequency.exponentialRampToValueAtTime(450, now + durationSec);
      filter.Q.setValueAtTime(2.5, now);

      for (const f of freqs) {
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now);
        osc.connect(filter);
        osc.start(now);
        osc.stop(now + durationSec + 0.1);
      }

      filter.connect(swellGain);
      swellGain.connect(this.sfxGain);
    } catch {
      // Ignored
    }
  }

  // --- Radio Comm Squelch Click ---
  public playRadioSquelch() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(660, now + 0.04);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch {
      // Ignored
    }
  }

  // --- Decision Confirmation Chime ---
  public playDecisionSting(isHazard = false) {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = isHazard ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(isHazard ? 240 : 540, now);
      osc.frequency.exponentialRampToValueAtTime(isHazard ? 180 : 880, now + 0.18);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.36);
    } catch {
      // Ignored
    }
  }

  // --- Atmospheric Entry & Rocket Thruster Rumble ---
  public playThrusterBurn(durationSec = 4.5) {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const subOsc = this.ctx.createOscillator();
      subOsc.type = 'sawtooth';
      subOsc.frequency.setValueAtTime(54, now);
      subOsc.frequency.linearRampToValueAtTime(38, now + durationSec);

      const lpf = this.ctx.createBiquadFilter();
      lpf.type = 'lowpass';
      lpf.frequency.setValueAtTime(160, now);
      lpf.frequency.linearRampToValueAtTime(110, now + durationSec);
      lpf.Q.setValueAtTime(3.8, now);

      const bufferSize = Math.floor(this.ctx.sampleRate * Math.min(durationSec, 6));
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(240, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(480, now + durationSec * 0.4);
      noiseFilter.frequency.exponentialRampToValueAtTime(180, now + durationSec);
      noiseFilter.Q.setValueAtTime(2.2, now);

      const thrusterGain = this.ctx.createGain();
      thrusterGain.gain.setValueAtTime(0.01, now);
      thrusterGain.gain.linearRampToValueAtTime(0.55, now + 0.5);
      thrusterGain.gain.linearRampToValueAtTime(0.58, now + durationSec * 0.7);
      thrusterGain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

      subOsc.connect(lpf);
      lpf.connect(thrusterGain);
      noiseSource.connect(noiseFilter);
      noiseFilter.connect(thrusterGain);
      thrusterGain.connect(this.sfxGain);

      subOsc.start(now);
      noiseSource.start(now);
      subOsc.stop(now + durationSec + 0.1);
      noiseSource.stop(now + durationSec + 0.1);
    } catch {
      // Ignored
    }
  }

  // --- Supersonic Entry Shockwave (Sonic Boom) ---
  public playSonicBoom() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      for (const delay of [0, 0.08]) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(110, now + delay);
        osc.frequency.exponentialRampToValueAtTime(24, now + delay + 0.32);

        gain.gain.setValueAtTime(0.42, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.35);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now + delay);
        osc.stop(now + delay + 0.36);
      }
    } catch {
      // Ignored
    }
  }

  // --- Touchdown Hydraulic Shock & Magnetic Clamps ---
  public playTouchdown() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(84, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.28);

      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.32);
    } catch {
      // Ignored
    }
  }

  // --- Cue Dispatcher ---
  public playCue(cue: string) {
    switch (cue) {
      case 'descent-riser':
        this.playRiser(3.2);
        break;
      case 'eva-tension':
        this.playRiser(2.6);
        break;
      case 'radio-comm':
        this.playRadioSquelch();
        break;
      case 'discovery-swell':
        this.playDiscoverySwell(3.8);
        break;
      case 'ambient-wind':
      default:
        this.startAmbience();
        break;
    }
  }

  // --- Voice-Over Narration Playback with Ducking ---
  public playVoiceover(audioSrc: string, onEnded?: () => void) {
    this.stopVoiceover();
    this.initContext();

    // Duck background ambience
    this.duckAmbience(0.18, 0.2);

    const audio = new Audio(audioSrc);
    audio.muted = this.isMuted;
    this.currentVoiceAudio = audio;

    const restore = () => {
      this.restoreAmbience(0.7, 0.4);
      onEnded?.();
    };

    audio.onended = restore;
    audio.onerror = restore;

    void audio.play().catch(() => {
      restore();
    });
  }

  public stopVoiceover() {
    if (this.currentVoiceAudio) {
      this.currentVoiceAudio.pause();
      this.currentVoiceAudio.currentTime = 0;
      this.currentVoiceAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.restoreAmbience(0.7, 0.2);
  }

  public pause() {
    if (this.currentVoiceAudio) {
      this.currentVoiceAudio.pause();
    }
  }

  public resume() {
    if (this.currentVoiceAudio && this.currentVoiceAudio.paused) {
      void this.currentVoiceAudio.play().catch(() => {});
    }
  }
}

export const cinematicAudio = new CinematicAudioEngine();