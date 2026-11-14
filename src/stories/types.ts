/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type StoryLanguage = 'en' | 'ar';

export type StoryBeatStage = 'orbit' | 'panorama';

export interface StoryCameraCue {
  lat?: number;
  lon?: number;
  distance?: number;
  azimuthDeg?: number;
  elevationDeg?: number;
  fovDeg?: number;
}

export type StoryAudioCue =
  | 'ambient-wind'
  | 'descent-riser'
  | 'eva-tension'
  | 'discovery-swell'
  | 'radio-comm';

export interface StoryChoiceOption {
  id: string;
  labelEn: string;
  labelAr: string;
  riskLevel: 'SAFE' | 'CAUTION' | 'HAZARD';
  consequenceEn: string;
  consequenceAr: string;
  nasaDataCitation: string;
  targetHeadingDeg?: number;
  targetPitchDeg?: number;
}

export interface StoryChoicePrompt {
  questionEn: string;
  questionAr: string;
  contextEn: string;
  contextAr: string;
  options: StoryChoiceOption[];
}

export interface StoryBeat {
  id: string;
  beatIndex: number;
  titleEn: string;
  titleAr: string;
  stage: StoryBeatStage;
  cameraCue: StoryCameraCue;
  audioCue: StoryAudioCue;
  narrationEn: string;
  narrationAr: string;
  subtitleEn: string;
  subtitleAr: string;
  durationSec: number;
  choicePrompt?: StoryChoicePrompt;
  scientificNoteEn?: string;
  scientificNoteAr?: string;
  sourceCitation: string;
}

export interface StoryChapter {
  id: string;
  chapterNumber: string;
  siteId: string;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  missionRef: string;
  heroImage: string;
  elevationDatum: string;
  sources: string[];
  beats: StoryBeat[];
}

export interface StoryPlaybackState {
  activeChapterId: string;
  currentBeatIndex: number;
  language: StoryLanguage;
  isPlaying: boolean;
  isMuted: boolean;
  activeChoiceId: string | null;
  selectedChoices: Record<string, string>; // beatId -> choiceId
  voiceLoading: boolean;
  voiceError: string | null;
  completedChapters: string[];
}