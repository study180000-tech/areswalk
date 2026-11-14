/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { AlertTriangle, CheckCircle2, ShieldAlert, ArrowRight, Compass } from 'lucide-react';
import type { StoryChoiceOption, StoryChoicePrompt, StoryLanguage } from '../types';

interface StoryChoiceOverlayProps {
  prompt: StoryChoicePrompt;
  language: StoryLanguage;
  selectedChoiceId: string | null;
  onSelectOption: (option: StoryChoiceOption) => void;
  onContinue: () => void;
}

export function StoryChoiceOverlay({
  prompt,
  language,
  selectedChoiceId,
  onSelectOption,
  onContinue,
}: StoryChoiceOverlayProps) {
  const isArabic = language === 'ar';
  const selectedOption = prompt.options.find((opt) => opt.id === selectedChoiceId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.98 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      dir={isArabic ? 'rtl' : 'ltr'}
      className="w-full max-w-2xl mx-auto border border-amber-500/40 bg-[#070A10]/95 backdrop-blur-md rounded-lg p-5 sm:p-6 shadow-2xl text-slate-100 space-y-4"
    >
      {/* Header Badge & Dilemma Question */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-mono-tabular text-amber-400">
          <span className="uppercase tracking-wider flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5" />
            {isArabic ? 'نقطة قرار السير الفضائي' : 'Critical EVA Decision Point'}
          </span>
          <span className="text-slate-400">
            {isArabic ? 'مبني على بيانات ناسا الميدانية' : 'Grounded in NASA Field Data'}
          </span>
        </div>
        <h3 className="font-display text-lg sm:text-xl font-bold text-slate-50 leading-snug">
          {isArabic ? prompt.questionAr : prompt.questionEn}
        </h3>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          {isArabic ? prompt.contextAr : prompt.contextEn}
        </p>
      </div>

      {/* Option Buttons */}
      {!selectedOption ? (
        <div className="space-y-2.5 pt-1">
          {prompt.options.map((opt) => {
            const isHazard = opt.riskLevel === 'HAZARD';
            const isCaution = opt.riskLevel === 'CAUTION';
            const riskBorder = isHazard
              ? 'hover:border-rose-500 hover:bg-rose-950/30'
              : isCaution
                ? 'hover:border-amber-500 hover:bg-amber-950/30'
                : 'hover:border-emerald-500 hover:bg-emerald-950/30';

            const riskBadge = isHazard
              ? 'text-rose-400 bg-rose-500/15 border-rose-500/40'
              : isCaution
                ? 'text-amber-400 bg-amber-500/15 border-amber-500/40'
                : 'text-emerald-400 bg-emerald-500/15 border-emerald-500/40';

            const RiskIcon = isHazard ? ShieldAlert : isCaution ? AlertTriangle : CheckCircle2;

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onSelectOption(opt)}
                className={`w-full text-start p-3.5 rounded border border-white/15 bg-white/[0.03] transition-all flex items-start gap-3 cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-400 ${riskBorder}`}
              >
                <div
                  className={`mt-0.5 p-1 rounded border shrink-0 ${riskBadge}`}
                  aria-hidden="true"
                >
                  <RiskIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-sm font-semibold text-slate-100">
                      {isArabic ? opt.labelAr : opt.labelEn}
                    </span>
                    <span
                      className={`text-[10px] font-mono-tabular px-1.5 py-0.5 rounded border shrink-0 ${riskBadge}`}
                    >
                      {opt.riskLevel}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono-tabular text-slate-400">
                    {opt.nasaDataCitation}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        /* Selected Option Consequence & Continue */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 pt-1"
        >
          <div
            className={`p-4 rounded border space-y-2 ${
              selectedOption.riskLevel === 'HAZARD'
                ? 'border-rose-500/60 bg-rose-950/40 text-rose-100'
                : selectedOption.riskLevel === 'CAUTION'
                  ? 'border-amber-500/60 bg-amber-950/40 text-amber-100'
                  : 'border-emerald-500/60 bg-emerald-950/40 text-emerald-100'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-mono-tabular uppercase tracking-wider font-semibold">
              <span>{isArabic ? 'النتيجة الميدانية' : 'Field Consequence'}</span>
              <span>·</span>
              <span>{selectedOption.riskLevel}</span>
            </div>
            <p className="text-sm leading-relaxed">
              {isArabic ? selectedOption.consequenceAr : selectedOption.consequenceEn}
            </p>
            <div className="text-xs font-mono-tabular text-slate-300/80 pt-1 border-t border-white/10">
              {isArabic ? 'المرجع العلمي: ' : 'Source Citation: '}
              {selectedOption.nasaDataCitation}
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={onContinue}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-display text-xs font-bold tracking-wide transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-300"
            >
              <span>{isArabic ? 'متابعة السير الفضائي' : 'Continue Mission EVA'}</span>
              <ArrowRight className={`w-3.5 h-3.5 ${isArabic ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}