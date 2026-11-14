/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { STORY_CHAPTERS, getChapterById, getAllChapterPreviews } from './data/storyChapters.ts';
import type { StoryAudioCue } from './types.ts';

const VALID_AUDIO_CUES: StoryAudioCue[] = [
  'ambient-wind',
  'descent-riser',
  'eva-tension',
  'discovery-swell',
  'radio-comm',
];

test('STORY_CHAPTERS integrity and NASA grounding', () => {
  assert.equal(STORY_CHAPTERS.length, 5, 'Should have 5 NASA site chapters');

  const expectedIds = ['jezero', 'gale', 'meridiani', 'utopia', 'gusev'];
  for (const id of expectedIds) {
    const chapter = getChapterById(id);
    assert.ok(chapter, `Chapter ${id} must exist`);
    assert.equal(chapter.id, id);
    assert.ok(chapter.titleEn && chapter.titleAr, `Chapter ${id} must have EN and AR titles`);
    assert.ok(chapter.subtitleEn && chapter.subtitleAr, `Chapter ${id} must have EN and AR subtitles`);
    assert.ok(chapter.sources.length >= 4, `Chapter ${id} must cite at least 4 NASA sources`);
    assert.ok(chapter.elevationDatum.includes('MOLA'), `Chapter ${id} must reference authentic MOLA elevation datum`);

    // Must have at least 4 narrative beats
    assert.ok(chapter.beats.length >= 4, `Chapter ${id} must have at least 4 beats`);

    let choiceFound = false;
    for (const beat of chapter.beats) {
      assert.ok(beat.id, 'Beat must have id');
      assert.ok(beat.titleEn && beat.titleAr, 'Beat must have EN/AR titles');
      assert.ok(beat.narrationEn && beat.narrationAr, 'Beat must have EN/AR narration');
      assert.ok(beat.subtitleEn && beat.subtitleAr, 'Beat must have EN/AR subtitles');
      assert.ok(beat.cameraCue, 'Beat must define camera cues');
      assert.ok(VALID_AUDIO_CUES.includes(beat.audioCue), `Beat must define valid audio cue: ${beat.audioCue}`);
      assert.ok(beat.sourceCitation, 'Beat must cite source');

      if (beat.stage === 'orbit') {
        assert.ok(typeof beat.cameraCue.lat === 'number', 'Orbit beat must specify latitude');
        assert.ok(typeof beat.cameraCue.lon === 'number', 'Orbit beat must specify longitude');
        assert.ok(typeof beat.cameraCue.distance === 'number', 'Orbit beat must specify distance');
      } else if (beat.stage === 'panorama') {
        assert.ok(typeof beat.cameraCue.azimuthDeg === 'number', 'Panorama beat must specify azimuthDeg');
        assert.ok(typeof beat.cameraCue.elevationDeg === 'number', 'Panorama beat must specify elevationDeg');
      }

      if (beat.choicePrompt) {
        choiceFound = true;
        assert.ok(beat.choicePrompt.questionEn && beat.choicePrompt.questionAr, 'Choice must have EN/AR questions');
        assert.ok(beat.choicePrompt.contextEn && beat.choicePrompt.contextAr, 'Choice must have EN/AR context');
        assert.ok(beat.choicePrompt.options.length >= 3, `Choice for ${id} must feature 3 risk options (SAFE, CAUTION, HAZARD)`);

        const riskLevels = beat.choicePrompt.options.map((o) => o.riskLevel);
        assert.ok(riskLevels.includes('SAFE'), `${id} dilemma must include SAFE option`);
        assert.ok(riskLevels.includes('CAUTION'), `${id} dilemma must include CAUTION option`);
        assert.ok(riskLevels.includes('HAZARD'), `${id} dilemma must include HAZARD option`);

        for (const opt of beat.choicePrompt.options) {
          assert.ok(opt.labelEn && opt.labelAr, 'Option must have EN/AR label');
          assert.ok(opt.consequenceEn && opt.consequenceAr, 'Option must have EN/AR consequence');
          assert.ok(opt.nasaDataCitation, 'Option must cite empirical NASA datum');
          assert.ok(['SAFE', 'CAUTION', 'HAZARD'].includes(opt.riskLevel), 'Risk level must be valid');
          assert.ok(typeof opt.targetHeadingDeg === 'number', 'Option must define targetHeadingDeg');
          assert.ok(typeof opt.targetPitchDeg === 'number', 'Option must define targetPitchDeg');
        }
      }
    }
    assert.ok(choiceFound, `Chapter ${id} must feature an interactive astronaut decision`);
  }
});

test('Named NASA portals grounding across mission chapters', () => {
  const allSources = STORY_CHAPTERS.flatMap((c) => [
    ...c.sources,
    ...c.beats.map((b) => b.sourceCitation),
    ...c.beats.flatMap((b) => b.choicePrompt ? b.choicePrompt.options.map((o) => o.nasaDataCitation) : []),
  ]).join(' ');

  // 1. JPL Mars Trek
  assert.ok(
    allSources.includes('Mars Trek'),
    'Chapters must cite JPL Mars Trek for DEMs and elevation profiling'
  );

  // 2. USGS-NASA Planetary Geologic Mapping Program
  assert.ok(
    allSources.includes('USGS-NASA') || allSources.includes('Planetary Geologic Mapping'),
    'Chapters must cite USGS-NASA Planetary Geologic Mapping Program'
  );

  // 3. NASA Worldview
  assert.ok(
    allSources.includes('Worldview'),
    'Chapters must cite NASA Worldview for atmospheric & dust opacity tracking'
  );

  // 4. Mars Perseverance Raw Images Gallery
  assert.ok(
    allSources.includes('Perseverance Raw Images') || allSources.includes('Raw Images Gallery'),
    'Chapters must cite Mars Perseverance Raw Images Gallery'
  );
});

test('Empirical NASA mission phenomena verification', () => {
  // Jezero: 20-deg sand rim slip
  const jezero = getChapterById('jezero')!;
  const jezeroText = JSON.stringify(jezero);
  assert.ok(jezeroText.includes('20°') && jezeroText.includes('slip'), 'Jezero must ground in the 20° rim slip event');

  // Gale: boxwork ridges
  const gale = getChapterById('gale')!;
  const galeText = JSON.stringify(gale);
  assert.ok(galeText.includes('boxwork'), 'Gale must ground in the boxwork ridges survey');

  // Meridiani: hematite slope / Purgatory dune
  const meridiani = getChapterById('meridiani')!;
  const meridianiText = JSON.stringify(meridiani);
  assert.ok(meridianiText.includes('hematite') && meridianiText.includes('Purgatory'), 'Meridiani must ground in hematite spherules & Purgatory ripple entrapment');

  // Utopia: dielectric radar permittivity (ε ≈ 3.15)
  const utopia = getChapterById('utopia')!;
  const utopiaText = JSON.stringify(utopia);
  assert.ok(utopiaText.includes('dielectric') || utopiaText.includes('3.15'), 'Utopia must ground in SHARAD dielectric radar permittivity');

  // Gusev: basalt scree & hydrothermal silica
  const gusev = getChapterById('gusev')!;
  const gusevText = JSON.stringify(gusev);
  assert.ok(gusevText.includes('scree') && gusevText.includes('silica'), 'Gusev must ground in Husband Hill scree & Home Plate silica beds');
});

test('getAllChapterPreviews returns 5 valid chapter previews', () => {
  const previews = getAllChapterPreviews();
  assert.equal(previews.length, 5);
  for (const p of previews) {
    assert.ok(p.id);
    assert.ok(p.titleEn);
    assert.ok(p.titleAr);
    assert.ok(p.beatsCount >= 4);
    assert.ok(p.heroImage);
  }
});