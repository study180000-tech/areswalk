/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Compass,
  Globe2,
  Languages,
  Layers,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { MarsGlobe3D } from '../../components/MarsGlobe3D';
import { MarsPanorama360 } from '../../components/MarsPanorama360';
import { cinematicAudio } from '../audio/cinematicAudioEngine';
import { STORY_CHAPTERS } from '../data/storyChapters';
import { StoryChapterSelector } from './StoryChapterSelector';
import { StoryChoiceOverlay } from './StoryChoiceOverlay';
import type { MarsSite, RoverTelemetryState } from '../../types/mars';
import type {
  StoryChapter,
  StoryChoiceOption,
  StoryLanguage,
} from '../types';

interface MissionStoriesTheaterProps {
  allSites: MarsSite[];
  roverState: RoverTelemetryState;
  initialChapterId?: string;
  initialLanguage?: StoryLanguage;
  onExit: () => void;
  onSelectSiteInConsole?: (siteId: string) => void;
}

export function MissionStoriesTheater({
  allSites,
  roverState,
  initialChapterId = 'jezero',
  initialLanguage = 'en',
  onExit,
  onSelectSiteInConsole,
}: MissionStoriesTheaterProps) {
  const [activeChapterId, setActiveChapterId] = useState<string>(initialChapterId);
  const [currentBeatIndex, setCurrentBeatIndex] = useState<number>(0);
  const [language, setLanguage] = useState<StoryLanguage>(initialLanguage);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [selectorOpen, setSelectorOpen] = useState<boolean>(false);

  // Astronaut choices tracking
  const [selectedChoices, setSelectedChoices] = useState<Record<string, string>>({});
  const [completedChapters, setCompletedChapters] = useState<string[]>([]);
  const [voiceLoading, setVoiceLoading] = useState<boolean>(false);

  const activeChapter: StoryChapter = useMemo(
    () => STORY_CHAPTERS.find((c) => c.id === activeChapterId) ?? STORY_CHAPTERS[0],
    [activeChapterId]
  );

  const activeSite: MarsSite = useMemo(
    () => allSites.find((s) => s.id === activeChapter.siteId) ?? allSites[0],
    [allSites, activeChapter.siteId]
  );

  const currentBeat = activeChapter.beats[currentBeatIndex] ?? activeChapter.beats[0];
  const isArabic = language === 'ar';

  const beatTimerRef = useRef<number | null>(null);
  const playTokenRef = useRef<number>(0);

  // Voiceover narration pipeline:
  // 1. Check local audio override drop-in
  // 2. Request Gemini server-side TTS endpoint (/api/stories/voiceover)
  // 3. Fallback seamlessly to Web Speech API (SpeechSynthesis)
  const speakBeatNarration = useCallback(
    async (narrationText: string, lang: StoryLanguage, onFinished?: () => void) => {
      const token = ++playTokenRef.current;

      // 1. Drop-in support for local audio overrides
      const localOverride = cinematicAudio.resolveOverride(
        activeChapter.id,
        currentBeat.id,
        lang
      );
      if (localOverride) {
        setVoiceLoading(false);
        cinematicAudio.playVoiceover(localOverride, onFinished);
        return;
      }

      setVoiceLoading(true);

      // 2. Gemini TTS server endpoint with in-memory caching
      try {
        const res = await fetch('/api/stories/voiceover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: narrationText, language: lang }),
        });

        if (token !== playTokenRef.current) return;

        if (res.ok) {
          const data = await res.json();
          if (data?.ok && typeof data.audio === 'string') {
            setVoiceLoading(false);
            cinematicAudio.playVoiceover(data.audio, onFinished);
            return;
          }
        }
      } catch {
        // Network or server error - continue seamlessly to client-side fallback
      }

      if (token !== playTokenRef.current) return;
      setVoiceLoading(false);

      // 3. Client-side SpeechSynthesis fallback with procedural audio ducking
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(narrationText);
        utterance.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
        utterance.rate = 0.95;

        // Attempt matching localized voice if available
        const voices = window.speechSynthesis.getVoices();
        const matchedVoice = voices.find((v) =>
          lang === 'ar' ? v.lang.startsWith('ar') : v.lang.startsWith('en')
        );
        if (matchedVoice) {
          utterance.voice = matchedVoice;
        }

        // Procedural audio ducking during speech synthesis
        cinematicAudio.duckAmbience(0.18, 0.25);

        const restoreAndFinish = () => {
          cinematicAudio.restoreAmbience(0.7, 0.35);
          onFinished?.();
        };

        utterance.onend = restoreAndFinish;
        utterance.onerror = restoreAndFinish;

        window.speechSynthesis.speak(utterance);
      } else {
        onFinished?.();
      }
    },
    [activeChapter.id, currentBeat.id]
  );

  // Handle current beat audio, sound cues, and narration flow
  useEffect(() => {
    cinematicAudio.unlock();
    cinematicAudio.startAmbience();

    // Trigger procedural audio cues based on current beat
    cinematicAudio.playCue(currentBeat.audioCue);

    const narration = isArabic ? currentBeat.narrationAr : currentBeat.narrationEn;
    const hasUnansweredChoice =
      currentBeat.choicePrompt && !selectedChoices[currentBeat.id];

    if (isPlaying) {
      void speakBeatNarration(narration, language, () => {
        // When narration finishes and beat has no pending choice, advance to next beat
        if (!hasUnansweredChoice && currentBeatIndex < activeChapter.beats.length - 1) {
          beatTimerRef.current = window.setTimeout(() => {
            setCurrentBeatIndex((prev) => prev + 1);
          }, 2400);
        } else if (currentBeatIndex === activeChapter.beats.length - 1) {
          // Chapter completed
          setCompletedChapters((prev) =>
            prev.includes(activeChapter.id) ? prev : [...prev, activeChapter.id]
          );
        }
      });
    } else {
      cinematicAudio.stopVoiceover();
    }

    return () => {
      if (beatTimerRef.current) {
        clearTimeout(beatTimerRef.current);
        beatTimerRef.current = null;
      }
      cinematicAudio.stopVoiceover();
    };
  }, [
    currentBeat,
    language,
    isPlaying,
    activeChapter,
    currentBeatIndex,
    isArabic,
    selectedChoices,
    speakBeatNarration,
  ]);

  // Handle astronaut choice selection
  const handleSelectOption = useCallback(
    (option: StoryChoiceOption) => {
      cinematicAudio.playDecisionSting(option.riskLevel === 'HAZARD');
      setSelectedChoices((prev) => ({ ...prev, [currentBeat.id]: option.id }));

      const consequence = isArabic ? option.consequenceAr : option.consequenceEn;
      void speakBeatNarration(consequence, language);
    },
    [currentBeat.id, isArabic, language, speakBeatNarration]
  );

  const handleContinueAfterChoice = useCallback(() => {
    if (currentBeatIndex < activeChapter.beats.length - 1) {
      setCurrentBeatIndex((prev) => prev + 1);
    }
  }, [currentBeatIndex, activeChapter.beats.length]);

  const handleTogglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handleToggleLanguage = useCallback(() => {
    setLanguage((prev) => (prev === 'en' ? 'ar' : 'en'));
  }, []);

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      cinematicAudio.setMuted(next);
      return next;
    });
  }, []);

  const handleSelectChapter = useCallback(
    (chapterId: string, initialLang?: StoryLanguage) => {
      setActiveChapterId(chapterId);
      setCurrentBeatIndex(0);
      if (initialLang) setLanguage(initialLang);
      setSelectorOpen(false);
      setIsPlaying(true);
    },
    []
  );

  const handlePrevBeat = useCallback(() => {
    setCurrentBeatIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNextBeat = useCallback(() => {
    setCurrentBeatIndex((prev) => Math.min(activeChapter.beats.length - 1, prev + 1));
  }, [activeChapter.beats.length]);

  return (
    <div
      dir={isArabic ? 'rtl' : 'ltr'}
      className="relative h-screen w-screen overflow-hidden bg-[#020306] text-slate-100 flex flex-col select-none"
    >
      {/* 3D Backdrop Viewport (Seamless Three.js Globe or 360° Panorama with Framer Motion Crossfade) */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {currentBeat.stage === 'orbit' ? (
            <motion.div
              key="stage-orbit"
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0"
            >
              <MarsGlobe3D
                sites={allSites}
                selectedSiteId={activeSite.id}
                activeLayer="optical"
                roverState={roverState}
                onSelectSite={(id) => onSelectSiteInConsole?.(id)}
                showTerritories={true}
                viewportShiftX={0}
              />
            </motion.div>
          ) : (
            <motion.div
              key="stage-panorama"
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0"
            >
              <MarsPanorama360
                site={activeSite}
                allSites={allSites}
                onSelectSite={(id) => onSelectSiteInConsole?.(id)}
                onBackToGlobe={() => {}}
                hideChrome={true}
                cameraCue={currentBeat.cameraCue}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cinematic Vignette Scrim */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#020306]/95 via-transparent to-[#020306]/85"
        />
      </div>

      {/* Top Aerospace Command Bar (Zone 1: Brand/Exit, Zone 2: Chapter Title, Zone 3: Controls) */}
      <header className="relative z-20 h-16 shrink-0 px-4 sm:px-8 border-b border-white/10 bg-[#020306]/85 backdrop-blur-md flex items-center justify-between gap-4">
        {/* Left: Exit & Brand */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onExit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200 transition-colors whitespace-nowrap cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-400"
          >
            <ArrowLeft className={`w-4 h-4 text-amber-400 ${isArabic ? 'rotate-180' : ''}`} />
            <span className="hidden sm:inline">
              {isArabic ? 'العودة للوحة التحكم' : 'Exit Theater'}
            </span>
          </button>
          <span className="font-display text-base sm:text-lg font-bold text-slate-50 whitespace-nowrap">
            AresWalk
          </span>
          <span className="hidden md:inline font-mono-tabular text-[10px] text-amber-400/90 border-l border-white/15 pl-3">
            MISSION STORIES
          </span>
        </div>

        {/* Center: Chapter Name & Beat Dots */}
        <div className="flex items-center gap-3 max-w-md truncate">
          <button
            type="button"
            onClick={() => setSelectorOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1 rounded border border-white/10 bg-[#070A10]/80 hover:border-amber-400/60 text-xs font-display text-slate-200 transition-colors truncate cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-400"
          >
            <span className="text-amber-400 font-mono-tabular">
              CH {activeChapter.chapterNumber}
            </span>
            <span className="truncate">{isArabic ? activeChapter.titleAr : activeChapter.titleEn}</span>
            <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {/* Beat Step Dots */}
          <div className="flex items-center gap-1.5 shrink-0">
            {activeChapter.beats.map((b, i) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setCurrentBeatIndex(i)}
                aria-label={`Go to Beat ${i + 1}`}
                className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                  i === currentBeatIndex
                    ? 'bg-amber-400 scale-125'
                    : i < currentBeatIndex
                      ? 'bg-emerald-400'
                      : 'bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Right: Language, Mute & Chapter Drawer Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleToggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200 transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan-400"
          >
            <Languages className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isArabic ? 'English' : 'العربية'}</span>
          </button>

          <button
            type="button"
            onClick={handleToggleMute}
            aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="p-2 rounded border border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-400"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            type="button"
            onClick={() => setSelectorOpen(true)}
            aria-label={isArabic ? 'فتح قائمة الفصول' : 'Open Chapters Drawer'}
            className="sm:hidden p-2 rounded border border-white/15 bg-white/5 hover:bg-white/10 text-amber-400 transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-400"
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Theater Stage with Interactive Choice Card or Aerospace HUD Telemetry */}
      <main className="relative z-10 flex-1 min-h-0 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        <AnimatePresence mode="wait">
          {currentBeat.choicePrompt ? (
            <StoryChoiceOverlay
              key={currentBeat.id}
              prompt={currentBeat.choicePrompt}
              language={language}
              selectedChoiceId={selectedChoices[currentBeat.id] ?? null}
              onSelectOption={handleSelectOption}
              onContinue={handleContinueAfterChoice}
            />
          ) : (
            <motion.div
              key={`${currentBeat.id}-telemetry-hud`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.35 }}
              className="pointer-events-none max-w-xl w-full flex flex-col items-center text-center space-y-3 px-4"
            >
              {/* Telemetry Stage Chip */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/15 bg-[#070A10]/85 backdrop-blur-md text-xs font-mono-tabular text-slate-300 shadow-lg">
                {currentBeat.stage === 'orbit' ? (
                  <>
                    <Globe2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="text-cyan-300 font-semibold uppercase tracking-wider">
                      {isArabic ? 'استطلاع مداري' : 'Orbital Reconnaissance'}
                    </span>
                    <span className="text-white/20">|</span>
                    <span>
                      {currentBeat.cameraCue.lat != null && currentBeat.cameraCue.lon != null
                        ? `${Math.abs(currentBeat.cameraCue.lat).toFixed(1)}°${currentBeat.cameraCue.lat >= 0 ? 'N' : 'S'}, ${Math.abs(currentBeat.cameraCue.lon).toFixed(1)}°E`
                        : activeChapter.elevationDatum}
                    </span>
                  </>
                ) : (
                  <>
                    <Compass className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-amber-300 font-semibold uppercase tracking-wider">
                      {isArabic ? 'سير ميداني ٣٦٠°' : 'Surface EVA 360°'}
                    </span>
                    <span className="text-white/20">|</span>
                    <span>
                      AZ {String(currentBeat.cameraCue.azimuthDeg ?? 0).padStart(3, '0')}° · EL{' '}
                      {(currentBeat.cameraCue.elevationDeg ?? 0) >= 0 ? '+' : ''}
                      {currentBeat.cameraCue.elevationDeg ?? 0}°
                    </span>
                  </>
                )}
              </div>

              {/* Beat Title Banner */}
              <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-100 tracking-wide drop-shadow-md">
                {isArabic ? currentBeat.titleAr : currentBeat.titleEn}
              </h2>

              {/* Scientific Empirical Note Callout if present */}
              {(isArabic ? currentBeat.scientificNoteAr : currentBeat.scientificNoteEn) && (
                <div className="max-w-md px-4 py-2 rounded-lg border border-amber-500/25 bg-amber-950/20 backdrop-blur-md text-xs text-amber-200/90 leading-relaxed font-sans shadow-md">
                  <span className="font-mono-tabular font-bold text-amber-400 mr-1.5">
                    {isArabic ? 'مرجع رصدي: ' : 'EMPIRICAL DATUM: '}
                  </span>
                  {isArabic ? currentBeat.scientificNoteAr : currentBeat.scientificNoteEn}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Subtitle Ribbon & Cinema Transport */}
      <footer className="relative z-20 border-t border-white/10 bg-[#020306]/95 backdrop-blur-md px-4 sm:px-8 py-3.5 space-y-3">
        {/* Subtitle Teleprompter Bar */}
        <div
          dir={isArabic ? 'rtl' : 'ltr'}
          className="max-w-3xl mx-auto min-h-[44px] flex items-center justify-center text-center px-4"
        >
          <motion.p
            key={`${currentBeat.id}-${language}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="font-display text-sm sm:text-base font-medium text-slate-100 leading-relaxed drop-shadow"
          >
            {isArabic ? currentBeat.subtitleAr : currentBeat.subtitleEn}
          </motion.p>
        </div>

        {/* Transport Bar Controls + Source Citation */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-t border-white/10">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevBeat}
              disabled={currentBeatIndex === 0}
              aria-label={isArabic ? 'المشهد السابق' : 'Previous beat'}
              className="p-1.5 rounded border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-slate-200 transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-400"
            >
              <ChevronLeft className={`w-4 h-4 ${isArabic ? 'rotate-180' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleTogglePlay}
              aria-label={isPlaying ? 'Pause Story' : 'Play Story'}
              className="px-4 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-display text-xs font-bold tracking-wide flex items-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-300"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isPlaying ? (isArabic ? 'إيقاف' : 'Pause') : (isArabic ? 'تشغيل' : 'Play')}</span>
            </button>

            <button
              type="button"
              onClick={handleNextBeat}
              disabled={currentBeatIndex === activeChapter.beats.length - 1}
              aria-label={isArabic ? 'المشهد التالي' : 'Next beat'}
              className="p-1.5 rounded border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-slate-200 transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-400"
            >
              <ChevronRight className={`w-4 h-4 ${isArabic ? 'rotate-180' : ''}`} />
            </button>

            {voiceLoading && (
              <span className="text-[11px] font-mono-tabular text-amber-300/80 animate-pulse hidden sm:inline ml-2">
                {isArabic ? 'جاري بث التعليق الصوتي...' : 'Streaming voiceover...'}
              </span>
            )}
          </div>

          {/* NASA Source Footnote (Zero-Pill Typographic Format) */}
          <div className="text-[11px] font-mono-tabular text-slate-400 text-center sm:text-right truncate max-w-md">
            <span>NASA Data Source: </span>
            <span className="text-slate-300">{currentBeat.sourceCitation}</span>
          </div>
        </div>
      </footer>

      {/* Chapter Selection Modal Drawer */}
      <AnimatePresence>
        {selectorOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          >
            <div className="relative w-full max-w-5xl bg-[#06090F] border border-white/15 rounded-xl p-4 sm:p-6 shadow-2xl">
              <button
                type="button"
                onClick={() => setSelectorOpen(false)}
                className="absolute top-4 right-4 text-xs font-mono-tabular px-3 py-1.5 rounded border border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-400"
              >
                {isArabic ? 'إغلاق' : 'Close'}
              </button>
              <StoryChapterSelector
                chapters={STORY_CHAPTERS}
                completedChapterIds={completedChapters}
                activeChapterId={activeChapter.id}
                language={language}
                onSelectChapter={handleSelectChapter}
                onClose={() => setSelectorOpen(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}