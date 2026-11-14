/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Play, CheckCircle2, Layers, X, Sparkles } from 'lucide-react';
import type { StoryChapter, StoryLanguage } from '../types';

interface StoryChapterSelectorProps {
  chapters: StoryChapter[];
  completedChapterIds: string[];
  activeChapterId: string;
  language: StoryLanguage;
  onSelectChapter: (chapterId: string, initialLang?: StoryLanguage) => void;
  onClose?: () => void;
}

export function StoryChapterSelector({
  chapters,
  completedChapterIds,
  activeChapterId,
  language,
  onSelectChapter,
  onClose,
}: StoryChapterSelectorProps) {
  const isArabic = language === 'ar';

  return (
    <div
      dir={isArabic ? 'rtl' : 'ltr'}
      className="w-full max-w-5xl mx-auto space-y-6 px-2 sm:px-4 py-4 sm:py-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="text-xs font-mono-tabular uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{isArabic ? 'سلسلة مهام آريس الاستكشافية' : 'AresWalk Cinematic Mission Logs'}</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-50 mt-1">
            {isArabic ? 'اختر فصلاً للبدء' : 'Select a Mission Chapter'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
            {isArabic
              ? 'خمس مقاطعات مريخية موثقة ببيانات ناسا الميدانية، تعليق صوتي ثنائي اللغة، وقرارات حاسمة لرواد الفضاء.'
              : 'Five Martian provinces with verified NASA telemetry, bilingual narration, and critical astronaut EVA decisions.'}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono-tabular text-slate-400">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-white/15 bg-white/5">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>
              {completedChapterIds.length}/{chapters.length}{' '}
              {isArabic ? 'فصول مكتملة' : 'Completed'}
            </span>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label={isArabic ? 'إغلاق' : 'Close drawer'}
              className="p-1.5 rounded border border-white/15 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 5 Chapters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {chapters.map((ch, idx) => {
          const isCompleted = completedChapterIds.includes(ch.id);
          const isActive = ch.id === activeChapterId;

          return (
            <motion.div
              key={ch.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.3 }}
              className={`group relative rounded-lg border overflow-hidden transition-all flex flex-col ${
                isActive
                  ? 'border-amber-400/90 bg-[#0C121E] shadow-xl shadow-amber-500/10'
                  : 'border-white/15 bg-[#070A10]/90 hover:border-amber-400/50 hover:bg-[#0A0F1A]'
              }`}
            >
              {/* Thumbnail Container */}
              <div className="relative h-40 w-full overflow-hidden bg-slate-950">
                <img
                  src={ch.heroImage}
                  alt={isArabic ? ch.titleAr : ch.titleEn}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-[#070A10] via-black/30 to-transparent"
                />
                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between text-xs font-mono-tabular">
                  <span className="px-2 py-0.5 rounded bg-black/75 border border-white/20 text-amber-300 font-bold">
                    CH {ch.chapterNumber}
                  </span>
                  {isCompleted && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/60 text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isArabic ? 'مكتمل' : 'Completed'}</span>
                    </span>
                  )}
                </div>
                <div className="absolute bottom-2 left-2.5 right-2.5 text-[11px] font-mono-tabular text-slate-300 truncate">
                  {ch.elevationDatum}
                </div>
              </div>

              {/* Body Content */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="text-[11px] font-mono-tabular text-cyan-400 truncate">
                    {ch.missionRef}
                  </div>
                  <h3 className="font-display text-base font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                    {isArabic ? ch.titleAr : ch.titleEn}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {isArabic ? ch.subtitleAr : ch.subtitleEn}
                  </p>
                </div>

                {/* Primary Launch Action */}
                <button
                  type="button"
                  onClick={() => onSelectChapter(ch.id)}
                  className={`w-full py-2.5 px-3 rounded text-xs font-display font-bold tracking-wide transition-colors flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                      : 'bg-white/10 text-slate-100 hover:bg-amber-500 hover:text-slate-950'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>
                    {isArabic
                      ? isActive
                        ? 'متابعة هذا الفصل'
                        : 'بدء الفصل'
                      : isActive
                        ? 'Resume Chapter'
                        : 'Start Chapter'}
                  </span>
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}