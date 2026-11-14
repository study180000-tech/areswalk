# AresWalk Cinematic Mission Stories — Implementation Plan

An immersive, interactive 5-chapter Mars storytelling theater inside **AresWalk** that blends Three.js orbital-to-surface camera choreography, Framer Motion UI transitions, bilingual Arabic and English voice-over narration, and reactive ambience/riser sound design—strictly grounded in the five uploaded NASA site dossiers and four named NASA portals.

---

## User Review & Critical Decisions

> [!WARNING]
> **Pixabay Sound Effects Collection (`sound-effects-19692800`) API Constraint**
> Official Pixabay REST APIs only serve **Images** (`/api/`) and **Videos** (`/api/videos/`) and do **not** expose a public REST API endpoint for audio tracks or Sound Effects collections. Direct hotlinking to Pixabay collection pages is blocked by CORS and hotlink protections in browser environments.
>
> **Chosen Resolution**: The Cinematic Audio Mixer will ship with a **dual-source architecture**:
> 1. **Built-In Web Audio API Engine (Immediate Zero-Latency Default)**: Procedurally synthesizes Martian dust-wind ambience, sub-bass tension risers (crescendo sweeps triggered during EVA decisions and orbital descents), and EVA radio squelch cues with zero network dependency.
> 2. **Optional Local Pixabay Drop-In Overrides**: If you download MP3/WAV tracks from your Pixabay collection and place them into the local public audio assets slot (`ambience-orbit.mp3`, `ambience-surface.mp3`, `riser-tension.mp3`, `choice-confirm.mp3`), the mixer automatically detects and crossfades your custom tracks instead of the synthesized beds.

> [!IMPORTANT]
> **Confirmed Design Choices (Phase 1)**
> - **Animation & Spatial Engine**: Framer Motion (`motion/react`) for theatrical letterbox typography, choice cards, and timeline HUD transitions, paired with synchronized `Three.js` camera fly-bys and 360° surface pan choreography.
> - **Story Format**: **Interactive 5-Site Chapters with Astronaut Choices** — one playable chapter per NASA mission site, where decisions shape EVA safety outcomes and reveal real empirical NASA observations.
> - **Bilingual Voice-Over (AR & EN)**: Server-side `@google/genai` Text-to-Speech proxy route (`gemini-3.8-flash-lite-tts` returning cached 24kHz WAV narration clips in English and Arabic) with automatic audio ducking and synchronized subtitles, plus browser Web Speech fallback if the API is temporarily unavailable. *(Requires upgrading `@google/genai` to `>= 2.29.1` during build phase).*
> - **Exclusive Information Lock**: All dialogue, geological facts, slope limits, elevations, and caveats are sourced **exclusively** from the **5 uploaded NASA PDF dossiers** and the **4 named NASA portals** (`JPL Mars Trek`, `USGS-NASA Planetary Geologic Mapping Program`, `NASA Worldview`, `Mars Perseverance Raw Images Gallery`).

---

## 1. Overview & Core Concept

- **What It Does**: Adds a dedicated **Mission Stories** experience inside a self-contained **Stories Feature Module**. Users enter an unobstructed 3D theater where each of the five Martian provinces unfolds as a multi-scene interactive mission log featuring orbital approach, 360° surface immersion, timed astronaut EVA decisions, bilingual voice narration (`EN` / `AR`), and adaptive ambience + tension risers.
- **Target Audience**: Space Apps evaluators, STEM audiences, and mission planners who want both rigorous NASA telemetry and an emotionally engaging, cinematic narrative walkthrough in English and Arabic.
- **Key Value**: Transforms static planetary charts into lived astronaut decision-making—demonstrating *why* empirical NASA constraints (such as Jezero's ~20° rim sand slip, Gale's fractured boxwork ridges, Meridiani's hematite slopes, Utopia's subsurface radar uncertainties, and Gusev's volcanic scree) dictate real human EVA survival and science strategy.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Entry & Chapter Selection**:
   - Users launch **Mission Stories** directly from the **Landing Page** hero or from the **Top Navigation Bar** (`Stories` tab).
   - A widescreen **Chapter Selector Strip** displays the 5 NASA provinces (`01. Jezero Crater`, `02. Gale Crater`, `03. Meridiani Planum`, `04. Utopia Planitia`, `05. Gusev Crater`) with completion state, mission ref, and a `1-Click Start Chapter` action.
2. **Scene Progression (4 Beats per Chapter)**:
   - **Beat 1 — Orbital Approach (`3D Mars Globe`)**: `Three.js` smoothly flies the orbital camera toward the province polygon while Martian wind ambience fades in and the bilingual voice-over introduces the mission context.
   - **Beat 2 — Atmospheric Descent (`Transition + Riser`)**: A calibrated tension riser swells as Framer Motion transitions the stage from orbital view into the site's **360° Surface Panorama**, locking onto the opening landmark hotspot.
   - **Beat 3 — Astronaut EVA Dilemma (`Interactive Choice`)**: Time-critical field choice grounded in the site's PDF (e.g., *Attempt direct 20° sand-mantled rim traverse* vs. *Reroute along exposed carbonate bedrock bench*). Selecting an option triggers a subtle riser peak, camera sweep to the hazard/target azimuth in 360°, and real NASA scientific consequence feedback.
   - **Beat 4 — Field Verdict & Next Chapter (`Log Summary`)**: Summarizes EVA safety trade-offs, displays exact source provenance badges (as plain typographic text, zero pills), and offers direct links to **Replay in Other Language (`AR`/`EN`)**, **Inspect Site Dossier**, or **Continue to Next Crater**.

### Visual Identity & Theme

- **Aesthetic Direction**: Cinematic aerospace mission documentary—deep obsidian theater framing (`#020306`), warm telemetry amber (`#F59E0B`), orbital cyan (`#06B6D4`), and high-contrast translucent bottom scrims (`bg-gradient-to-t from-[#020306]/95 via-[#020306]/70 to-transparent`) preserving `>= 4.5:1` readability over 3D Mars and 360° vistas.
- **Typography & Bilingual Hierarchy**:
  - *Display*: `Chakra Petch` for English chapter titles and mission headers.
  - *Body & Subtitles*: `IBM Plex Sans` with crisp `dir="rtl"` right-to-left typography layout whenever Arabic voice-over & captions are active, and `dir="ltr"` for English.
  - *Measurements*: `IBM Plex Mono` (`font-variant-numeric: tabular-nums`) for elevation datums, slope angles, sol/timecodes, and audio progress.
- **Strict Visual Discipline**:
  - Unboxed inline metadata separated by `·` (zero pill capsules or header badges).
  - Top bar preserves the single-row 3-zone contract (`AresWalk` — `NASA Archive · 360° Surface · Stories · Live Rover · Mission QR` — `Power On Rover`).
  - Zero `//` code headers, zero pulsing decorative dots, and no `backdrop-blur` placed over live WebGL viewports.

### Interactive Feedback & Motion

- **Framer Motion (`motion/react`)**:
  - `AnimatePresence` transitions between story beats (`opacity` and `transform` only, `<= 350ms` cubic-out settling, respecting `prefers-reduced-motion`).
  - Staggered subtitle line reveal synced to audio playback progress, plus responsive hover/tap feedback (`<= 150ms`) on astronaut decision buttons.
- **Three.js Camera Choreography**:
  - On-demand / `afterDraw`-paced smooth `lerp` camera fly-bys during Orbital Beats and azimuth/elevation smooth gliding during 360° Surface Beats—maintaining 60fps smoothness without background CPU loops when paused.
- **Audio & Voice Controls**:
  - Unified Cinema Control Bar at the bottom of the theater: `Play / Pause`, `Language Toggle (EN / العربية)`, `Ambience & SFX Volume Mute`, `Skip Beat`, and live interactive beat timeline scrubber.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1 — Server-Side Gemini TTS (`gemini-3.8-flash-lite-tts`) + Server/Client Audio Cache**
  - *Chosen Approach*: An Express proxy route (`/api/stories/voiceover`) calls `@google/genai` with `GEMINI_API_KEY`, selects natural prebuilt voices tuned for documentary clarity, returns WAV bytes (`24kHz mono`), and caches clips in memory per `(chapterId, beatId, lang)` so replay and chapter switching are instant.
  - *Why*: Guarantees genuine, natural Arabic and English voice-over without exposing API keys in browser bundles or relying on robotic OS voices, while avoiding duplicate API calls via caching.
  - *Fallback*: If the TTS endpoint fails or times out, the story player automatically falls back to browser `speechSynthesis` (`ar-*` / `en-*`) with synchronized timed caption playback so narration never stalls.

- **Decision 2 — Hybrid Web Audio + Optional Local Pixabay SFX Architecture**
  - *Chosen Approach*: Pure Web Audio API synthesis (filtered wind noise, resonant Martian low-pass sweep, harmonic tension risers, and radio clicks) paired with automatic detection of user-placed local audio overrides.
  - *Why*: Eliminates broken external audio links caused by Pixabay lacking a public audio REST API, gives crisp dynamic audio ducking (`-10 dB` ambience duck while voice-over plays), and allows instant drop-in customization from the user's Pixabay collection.

- **Decision 3 — Exclusive Source Grounding Contract**
  - *Chosen Approach*: Story scripts and astronaut dilemmas are authored directly from structured fields backed exclusively by the 5 NASA PDFs and 4 named NASA portals (`JPL Mars Trek`, `USGS-NASA Planetary Geologic Mapping Program`, `NASA Worldview`, `Mars Perseverance Raw Images Gallery`), displaying explicit attribution lines and scientific caveats alongside every outcome.
  - *Why*: Prevents factual hallucinations (such as invented oxygen availability or unverified local CO₂ sensors) while delivering dramatic, scientifically authentic storytelling.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                          AresWalk Application                          │
│  [Landing View]  ───────►  [Stories Theater Mode]  ◄──────► [3D Console]│
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
┌─────────────────────┐   ┌──────────────────────┐   ┌───────────────────┐
│  Stories Store &    │   │  Dual-Viewport Stage │   │  Audio & TTS      │
│  5-Site Script Data │   │  (Three.js + Motion) │   │  Orchestrator     │
├─────────────────────┤   ├──────────────────────┤   ├───────────────────┤
│ • 5 Chapters (PDF   │   │ • Orbital Fly-By     │   │ • Ambience Bed    │
│   & Portal Locked)  │   │   (MarsGlobe3D)      │   │ • Tension Risers  │
│ • EN & AR Scripts   │   │ • 360° Guided Pan    │   │ • Auto Gain Duck  │
│ • Astronaut Choices │   │   (MarsPanorama360)  │   │ • Optional Local  │
│ • Source Citations  │   │ • Framer Motion HUD  │   │   Pixabay Files   │
└─────────┬───────────┘   └──────────────────────┘   └─────────┬─────────┘
          │                                                    │
          │                                     POST /api/stories/voiceover
          ▼                                                    ▼
┌─────────────────────┐                          ┌───────────────────────┐
│ Choice & Progress   │                          │ Express Proxy Server  │
│ State (Client Hook) │                          │ (@google/genai TTS +  │
└─────────────────────┘                          │  In-Memory WAV Cache) │
                                                 └───────────────────────┘
```

### Data Model & State

- **Story Chapter Entity**: Holds `siteId` (linking to existing verified site metrics/polygons/360° assets), chapter order (`01`–`05`), exclusive `sources[]`, and an ordered array of `StoryBeat` objects.
- **Story Beat Entity**: Defines `id`, `stageMode` (`'orbit' | 'panorama'`), target `cameraCue` (lat/lon/distance for orbit or azimuth/elevation/FOV for 360°), `audioCue` (`'wind-orbit' | 'descent-riser' | 'eva-tension' | 'discovery-swell'`), bilingual `narration` (`en` and `ar` script + subtitle segments), optional `choicePrompt` with 2–3 astronaut options, and factual `choiceOutcome` including scientific caveat notes.
- **Story Playback State**: Tracks `activeChapterId`, `currentBeatIndex`, `language` (`'en' | 'ar'`), `isPlaying`, `isAudioMuted`, `voiceLoadingState`, `selectedChoices` map across chapters, and `completedChapters`.

### Interactive Component & State Mapping

- **Chapter Selector Rail**: Clicking any of the 5 mission chapters resets beat index to `0`, syncs `selectedSiteId`, triggers the orbital camera cue, and starts the opening ambience bed.
- **Cinema Transport (`Play/Pause`, `EN/AR`, `Prev/Next Beat`, `Mute`)**: Toggling language mid-beat smoothly stops current narration, requests/plays the alternate language WAV clip from `/api/stories/voiceover` (or cache), switches subtitle text direction (`ltr`/`rtl`), and keeps ambience continuity intact.
- **Astronaut Choice Cards**: Clicking a decision triggers a brief harmonic riser sting, smoothly glides the 360° camera toward the decision's physical geological target (e.g., sand slip slope or carbonate delta bench), plays the outcome narration, and records the scientific finding in the chapter summary.
- **Error & Loading Recovery**: Displays a non-blocking caption loading state while synthesizing uncached TTS audio; if TTS errors or lacks a key, automatically engages browser speech fallback and displays subtle non-intrusive subtitles so the story continues seamlessly.

### Key Integrations

- **Server Proxy (`@google/genai`)**: Uses `gemini-3.8-flash-lite-tts` (`responseModalities: ["AUDIO"]`, `prebuiltVoiceConfig`) initialized server-side with `process.env.GEMINI_API_KEY` and `'User-Agent': 'aistudio-build'`.
- **Web Audio API + Optional Local Audio Assets**: Uses a master `AudioContext` unlocked cleanly on the user's first play/start click, routing synthesized pink-noise wind filters, swept oscillator risers, and optional fetched local MP3 buffers through a compressor + ducking gain node.
