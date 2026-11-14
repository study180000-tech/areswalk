/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { StoryChapter } from '../types';

export const STORY_CHAPTERS: StoryChapter[] = [
  {
    id: 'jezero',
    chapterNumber: '01',
    siteId: 'jezero',
    titleEn: 'The River That Was',
    titleAr: 'النهر الذي كان',
    subtitleEn: 'Perseverance Delta Front & Santa Cruz Butte',
    subtitleAr: 'واجهة دلتا بيرسيفيرانس وتل سانتا كروز',
    missionRef: 'Mars 2020 Perseverance & Ingenuity',
    heroImage: '/assets/mars/',
    elevationDatum: 'MOLA / Areoid Datum (-2,700 m Regional Basin Floor · Jezero HRSC/HiRISE)',
    sources: [
      'JPL Mars Trek (HiRISE DEM & Elevation Profiles)',
      'USGS-NASA Planetary Geologic Mapping Program (Jezero Photogeologic Map SIM-3464)',
      'NASA Worldview (Global Mars Atmospheric & Dust Optical Depth Archive)',
      'Mars Perseverance Raw Images Gallery (Mastcam-Z Sol Mosaics & PIA24546)',
      'NASA MEDA Environmental Archive (Mars 2020 Atmospheric Suite)',
    ],
    beats: [
      {
        id: 'jz-b1',
        beatIndex: 0,
        titleEn: 'Orbital Approach: The Ancient Basin',
        titleAr: 'الاقتراب المداري: حوض جيزيرو القديم',
        stage: 'orbit',
        cameraCue: { lat: 18.44, lon: 77.45, distance: 7.2, fovDeg: 45 },
        audioCue: 'ambient-wind',
        narrationEn:
          'Ares Command, this is EVA-1. We have synchronized our orbit directly over Jezero Crater at latitude 18.44 north, 77.45 east. 3.7 billion years ago, violent rivers breached this rim and dumped sediment into a deep crater lake. Looking down through our orbital sensors, the Western Fan-Delta stands out like a massive petrified fan of stone.',
        narrationAr:
          'قيادة آريس، معكم رائد الاستكشاف الأول. لقد ضبطنا مدارنا فوق فوهة جيزيرو مباشرة عند خط عرض 18.44 شمالاً وخط طول 77.45 شرقاً. قبل 3.7 مليار سنة، شقت أنهار المريخ هذه الحافة وصبت حمولتها الرسوبية في بحيرة قديمة، تاركة وراءها دلتا مروحية عملاقة من الصخور المتراصة.',
        subtitleEn:
          'Orbit locked at 18.44°N, 77.45°E. Jezero Crater floor elevation: -2,700 m MOLA/Areoid datum.',
        subtitleAr:
          'تم تثبيت المدار عند 18.44° شمالاً، 77.45° شرقاً. منسوب قاع جيزيرو: -2,700 متر وفق مرجع MOLA/Areoid.',
        durationSec: 16,
        sourceCitation: 'USGS-NASA Planetary Geologic Mapping Program & JPL Mars Trek',
      },
      {
        id: 'jz-b2',
        beatIndex: 1,
        titleEn: 'Atmospheric Descent: The Delta Scarp',
        titleAr: 'الهبوط الجوي: جدار الدلتا وتل سانتا كروز',
        stage: 'panorama',
        cameraCue: { azimuthDeg: 14, elevationDeg: 5, fovDeg: 62 },
        audioCue: 'descent-riser',
        narrationEn:
          'Boots on the regolith. We are standing on the floor facing the Western Fan-Delta scarp. Ahead rises the Santa Cruz conical butte, captured in the famous 2.5 billion-pixel Mastcam-Z panorama. The air is thin—0.636 kilopascals—and dust opacity tau reads 0.62 in the MEDA atmospheric sensors.',
        narrationAr:
          'أقدامنا على الثرى المريخي. نقف الآن على قاع الفوهة بمواجهة جدار الدلتا الغربية. أمامنا يرتفع تل سانتا كروز المخروطي، المصور في بانوراما ماستكام-زد بدقة 2.5 مليار بكسل. الضغط الجوي رقيق للغاية 0.636 كيلوباسكال، وكثافة الغبار تاو 0.62 وفق سجلات محطة MEDA.',
        subtitleEn:
          'Surface atmospheric pressure: 0.636 kPa · Dust opacity: Tau 0.62 · Temp: -63°C (MEDA Archive).',
        subtitleAr:
          'الضغط الجوي السطحي: 0.636 كيلوباسكال · كثافة الغبار: تاو 0.62 · درجة الحرارة: -63° مئوية (أرشيف MEDA).',
        durationSec: 17,
        sourceCitation: 'Mars Perseverance Raw Images Gallery (PIA24546) & MEDA Archive',
      },
      {
        id: 'jz-b3',
        beatIndex: 2,
        titleEn: 'Astronaut Dilemma: Navigating the Rim Slope',
        titleAr: 'معضلة الرائد: عبور منحدر الحافة نحو مصطبة الدلتا',
        stage: 'panorama',
        cameraCue: { azimuthDeg: 308, elevationDeg: -8, fovDeg: 56 },
        audioCue: 'eva-tension',
        narrationEn:
          'Telemetry alert on route navigation. We need to ascend to the upper delta terrace to core sample Mg-carbonate minerals. Ahead lies an exposed bedrock mudstone bench, an alternate gravel corridor, and a direct 20-degree incline covered in loose granular sand where Perseverance recorded wheel slip. How do we proceed?',
        narrationAr:
          'تنبيه ملاحي لمسار السير الفضائي. نريد الصعود إلى المصطبة العليا لأخذ عينات لبية من كربونات المغنيسيوم. أمامنا مسار صخري مكشوف، أو ممر حصوي مضغوط، أو صعود مباشر عبر منحدر رملي بزاوية 20 درجة حيث سجلت العربة بيرسيفيرانس انزلاقاً لعجلاتها. ما هو قرارك؟',
        subtitleEn:
          'EVA Decision Point: NASA logged rover wheel slip on a ~20° slope near the Jezero rim.',
        subtitleAr:
          'نقطة قرار السير: صعود منحدر الحافة الرملي بزاوية 20° أم الالتفاف عبر الصخور الصلبة.',
        durationSec: 18,
        sourceCitation: 'NASA/JPL Perseverance Mobility Field Observations & HiRISE DEM',
        choicePrompt: {
          questionEn: 'Choose EVA Route up to the Delta Terrace',
          questionAr: 'اختر مسار السير الفضائي نحو مصطبة الدلتا',
          contextEn:
            'Perseverance logged significant wheel slippage on a ~20° incline coated with fine unconsolidated sand/dust near the rim. Astronaut EVA suit safety threshold is 15° nominal, 20° max.',
          contextAr:
            'سجلت العربة انزلاقاً خطيراً على منحدر 20 درجة مغطى بغبار ناعم. الحد الآمن لبدلة رواد الفضاء هو 15 درجة.',
          options: [
            {
              id: 'jz-opt-bench',
              labelEn: 'Detour along exposed mudstone bedrock bench',
              labelAr: 'الالتفاف عبر مصطبة الصخور الطينية المكشوفة',
              riskLevel: 'SAFE',
              consequenceEn:
                'Solid bedrock provides stable mechanical footing. Boot cleats grip the lithified delta mudstones securely without slip, enabling safe core extraction of hydrated lacustrine clays preserving potential biosignatures.',
              consequenceAr:
                'توفر الصخور الرسوبية الصلبة موطئ قدم ميكانيكي ثابت. تمسك مسامير الأحذية بصخور الدلتا المتماسكة بأمان، مما يتيح جمع عينات طين بحيرية تحفظ علامات حيوية محتملة دون أي خطر للانزلاق.',
              nasaDataCitation: 'HiRISE DEM Bedrock Mapping · Mean Slope 8.2°',
              targetHeadingDeg: 14,
              targetPitchDeg: 4,
            },
            {
              id: 'jz-opt-interdune',
              labelEn: 'Traverse along compacted gravel inter-dune corridor',
              labelAr: 'العبور عبر ممر الحصى المضغوط بين التموجات',
              riskLevel: 'CAUTION',
              consequenceEn:
                'Moderate progress with minor boot slip. Compacted granules maintain acceptable traction on a 13° grade, but aeolian dust lofted by suit motion coats camera sensor lenses and requires manual optical wiping.',
              consequenceAr:
                'تقدم متوسط مع انزلاق طفيف. توفر الحبيبات المضغوطة تماسكاً مقبولاً على منحدر 13°، لكن الغبار المتطاير جراء حركة البدلة غطى عدسات الكاميرا وتطلب تنظيفاً يدوياً للمستشعرات.',
              nasaDataCitation: 'Perseverance Mobility Traverse Log · Sol 410 (13° Incline)',
              targetHeadingDeg: 24,
              targetPitchDeg: -2,
            },
            {
              id: 'jz-opt-slip',
              labelEn: 'Direct assault up the 20° unconsolidated sand rim slope',
              labelAr: 'صعود مباشر عبر منحدر الرمال المفككة بزاوية 20°',
              riskLevel: 'HAZARD',
              consequenceEn:
                'Critical mobility hazard! Regolith cohesion failed underfoot, inducing 45% backward slip and spiking suit metabolic oxygen consumption by 180%. Validates NASA Perseverance rover wheel slip observations on ~20° sand-coated rim scarps.',
              consequenceAr:
                'خطر حركي حرج! انهارت الرمال الناعمة تحت الأقدام مسببة انزلاقاً تراجعياً بنسبة 45% وارتفاعاً حاداً في استهلاك أكسجين البدلة بنسبة 180%، مؤكداً رصد ناسا الميداني لانزلاق عجلات بيرسيفيرانس على منحدرات الحافة 20°.',
              nasaDataCitation: 'Mars Perseverance Raw Images Gallery & Mobility Slip Event on ~20° Rim Incline',
              targetHeadingDeg: 308,
              targetPitchDeg: -12,
            },
          ],
        },
      },
      {
        id: 'jz-b4',
        beatIndex: 3,
        titleEn: 'Field Verdict: Lake Sediments Secured',
        titleAr: 'التقرير الميداني: تأمين عينات بحيرة جيزيرو',
        stage: 'panorama',
        cameraCue: { azimuthDeg: 62, elevationDeg: 8, fovDeg: 64 },
        audioCue: 'discovery-swell',
        narrationEn:
          'Mission milestone achieved. Lacustrine mudstones sealed into sample cache tubes. The combination of orbital HRSC topographic models from JPL Mars Trek and localized HiRISE slope data proved critical for astronaut survival and scientific success.',
        narrationAr:
          'اكتمل الهدف الميداني بنجاح. تم حفظ عينات الصخور الطينية الرسوبية وكربونات المغنيسيوم في كبسولات محكمة. أثبت التكامل بين نماذج الارتفاع المدارية في JPL Mars Trek وبيانات انحدار السطح أهميته القصوى لسلامة الرواد والنجاح العلمي.',
        subtitleEn:
          'Sample cache sealed: Mg-carbonates & smectite clays. Jezero chapter complete.',
        subtitleAr:
          'تم تأمين كبسولات العينات: كربونات المغنيسيوم ومعادن الطين. اكتمل فصل فوهة جيزيرو بنجاح.',
        durationSec: 15,
        scientificNoteEn:
          'NASA Caveat: 20° rim slip was an empirical robotic observation, not a universal human EVA limit. Elevations across floor, delta, and rim vary significantly.',
        scientificNoteAr:
          'ملاحظة ناسا: انزلاق الـ 20 درجة كان رصداً ميدانياً لحركة العربة، والارتفاعات تختلف جذرياً بين القاع والدلتا.',
        sourceCitation: 'NASA Mars 2020 Mission Archive & NASA Worldview',
      },
    ],
  },
  {
    id: 'gale',
    chapterNumber: '02',
    siteId: 'gale',
    titleEn: 'The Ancient Lake of Sharp',
    titleAr: 'بحيرة جبل شارب القديمة',
    subtitleEn: 'Curiosity Foothills & Fractured Boxwork Ridges',
    subtitleAr: 'سفوح كيوريوسيتي وتشكيلات البوكس وورك المتصدعة',
    missionRef: 'Mars Science Laboratory Curiosity',
    heroImage: '/assets/mars/',
    elevationDatum: 'MOLA / HRSC Datum (-4,500 m Crater Floor to Mount Sharp +5,000 m Central Mound)',
    sources: [
      'JPL Mars Trek (Curiosity Traverse & MOLA/HRSC Altimetry Grids)',
      'USGS-NASA Planetary Geologic Mapping Program (Gale Crater Geologic Map I-2888)',
      'NASA Worldview (Global Atmospheric Opacity & Seasonal Dust Monitoring)',
      'Curiosity Raw Images Gallery (Mastcam 2025 Boxwork Ridge Survey & PIA26558)',
      'Curiosity SAM (Sample Analysis at Mars Atmospheric Composition Archive)',
    ],
    beats: [
      {
        id: 'gl-b1',
        beatIndex: 0,
        titleEn: 'Orbital Approach: Mount Sharp Central Mound',
        titleAr: 'الاقتراب المداري: جبل شارب الأوسط',
        stage: 'orbit',
        cameraCue: { lat: -5.4, lon: 137.8, distance: 7.1, fovDeg: 45 },
        audioCue: 'ambient-wind',
        narrationEn:
          'Descending over Gale Crater, latitude 5.4 south, 137.8 east. Mount Sharp rises five kilometers from the crater floor, exposing billions of years of layered Martian climate history. From orbit, the mineral boxwork ridges look like a massive crystalline spiderweb.',
        narrationAr:
          'نهبط الآن فوق فوهة غيل، عند خط عرض 5.4 جنوباً وخط طول 137.8 شرقاً. يرتفع جبل شارب 5 كيلومترات من قاع الفوهة، كاشفاً مليارات السنين من التاريخ المناخي للمريخ. ومن المدار، تبدو تشكيلات حواف البوكس وورك المعدنية كشبكة بلورية عملاقة متصالبة.',
        subtitleEn:
          'Orbit locked at 5.4°S, 137.8°E. Mount Sharp central mound rises 5.5 km above crater floor (-4,500 m MOLA).',
        subtitleAr:
          'تم تثبيت المدار عند 5.4° جنوباً، 137.8° شرقاً. يرتفع جبل شارب 5.5 كم فوق قاع الفوهة (-4,500 م MOLA).',
        durationSec: 16,
        sourceCitation: 'USGS-NASA Planetary Geologic Mapping Program & MOLA Altimetry Grid',
      },
      {
        id: 'gl-b2',
        beatIndex: 1,
        titleEn: 'Surface Touchdown: The Boxwork Labyrinth',
        titleAr: 'الهبوط السطحي: متاهة تشكيلات البوكس وورك',
        stage: 'panorama',
        cameraCue: { azimuthDeg: 28, elevationDeg: 6, fovDeg: 60 },
        audioCue: 'descent-riser',
        narrationEn:
          'We have landed at the foothills. Towering stratified sandstone buttes surround us, with polygonal mineral ridges rising one to two meters above the basalt sand ripples. SAM atmospheric baseline confirms 95 percent carbon dioxide.',
        narrationAr:
          'هبطنا عند السفوح السفلية لجبل شارب. تحيط بنا تلال طبقية شاهقة، بينما ترتفع حواف معدنية متصلبة بارتفاع متر إلى مترين فوق المنخفضات الرملية البازلتية. ويؤكد جهاز سام أن الغلاف الجوي يتكون محلياً بنسبة 95% من ثاني أكسيد الكربون، ومتوسط الانحدار 11.2 درجة.',
        subtitleEn:
          'Curiosity SAM baseline: CO₂ ~95% · Temperature: -54°C · Mean slope: 11.2° (MSL Archive).',
        subtitleAr:
          'قياسات جهاز SAM: ثاني أكسيد الكربون ~95% · الحرارة: -54° مئوية · متوسط الانحدار: 11.2° (أرشيف MSL).',
        durationSec: 16,
        sourceCitation: 'Curiosity Raw Images Gallery (PIA26558) & SAM Atmospheric Instrument',
      },
      {
        id: 'gl-b3',
        beatIndex: 2,
        titleEn: 'Astronaut Dilemma: Navigating Brittle Ridges',
        titleAr: 'معضلة الرائد: عبور الحواف المعدنية المتصدعة',
        stage: 'panorama',
        cameraCue: { azimuthDeg: 86, elevationDeg: -4, fovDeg: 58 },
        audioCue: 'eva-tension',
        narrationEn:
          'The rover route ahead is obstructed by brittle, sharp-edged mineral boxwork ridges. Crossing directly over the fins risks punctures to our EVA suit overboots and umbilical cables, while detouring through deep sandy troughs risks entrapment. How do we traverse this maze?',
        narrationAr:
          'المسار أمامنا تعترضه شبكة حواف البوكس وورك المتصلبة بارتفاع 1 إلى 2 متر. المشي المباشر فوق الحواف يهدد بتمزيق قيعان الأحذية وأنابيب البدلة، بينما يخفي النزول في المنخفضات الرملية مصائد غبار عميقة. كيف سنتعامل مع هذه الشبكة الجيولوجية المعقدة؟',
        subtitleEn:
          'EVA Decision: Mineral-cemented boxwork fins vs. low-slope sandy hollows.',
        subtitleAr:
          'قرار السير: ممر رملي منبسط، أم تسلق الحواف المعدنية الحادة، أم خوض الخنادق الرملية العميقة.',
        durationSec: 17,
        sourceCitation: 'NASA Curiosity Traverse Hazard & Boxwork Study (2025)',
        choicePrompt: {
          questionEn: 'Select Passage Strategy Through Boxwork Zone',
          questionAr: 'اختر استراتيجية المرور عبر منطقة البوكس وورك',
          contextEn:
            'Boxwork ridges are cemented mineral fractures left behind after surrounding bedrock eroded. Edges are jagged and brittle.',
          contextAr:
            'تشكيلات البوكس وورك هي شقوق معدنية تصلبت ثم تآكلت الصخور المحيطة بها، مما ترك حوافاً بارزة وحادة.',
          options: [
            {
              id: 'gl-opt-detour',
              labelEn: 'Follow sandy low-relief corridor along butte apron',
              labelAr: 'اتباع الممر الرملي منخفض الانحدار بمحاذاة قاعدة التل',
              riskLevel: 'SAFE',
              consequenceEn:
                'Smooth, unobstructed passage. Traversing the gentle 6° basalt sand apron bypasses brittle mineral fins entirely. Life support telemetry registers nominal suit pressure and oxygen consumption rates.',
              consequenceAr:
                'عبور سلس وآمن. تجاوزت المسيرة الحواف المعدنية الهشة عبر ممر رملي منبسط بزاوية 6°، مع استقرار تام في ضغط البدلة ومعدل استهلاك الأكسجين.',
              nasaDataCitation: 'Curiosity Traverse Waypoint Paraitepuy Pass · JPL Mars Trek',
              targetHeadingDeg: 28,
              targetPitchDeg: 4,
            },
            {
              id: 'gl-opt-cross',
              labelEn: 'Carefully step across 1 m cemented mineral fins using boot crampons',
              labelAr: 'الخطو بحذر فوق الحواف المتصلبة بارتفاع متر باستخدام مسامير الأحذية',
              riskLevel: 'CAUTION',
              consequenceEn:
                'Heavy suit sole abrasion warning. Sharp crystalline sulfate fins scratched outer boot vulcanized treads. Echoes Curiosity’s historical wheel puncturing on sharp Gale Crater ventifacts and fractures.',
              consequenceAr:
                'تحذير من تآكل أسفل البدلة. سببت الحواف البلورية الحادة خدوشاً في مطاط الأحذية الخارجي، مستعيدة تجربة تضرر عجلات كيوريوسيتي التاريخية على الصخور المسننة في غيل.',
              nasaDataCitation: 'JPL Rover Wheel Damage Archive & Curiosity 2025 Boxwork Survey (PIA26558)',
              targetHeadingDeg: 86,
              targetPitchDeg: -6,
            },
            {
              id: 'gl-opt-trench',
              labelEn: 'Drop directly into deep unverified boxwork sand trough',
              labelAr: 'الهبوط المباشر في خندق رملي عميق بين حواف البوكس وورك',
              riskLevel: 'HAZARD',
              consequenceEn:
                'Entrapment alert! Concealed aeolian dust mantle collapsed under crew mass, sinking boots 32 cm into loose granular dust. Jagged subsurface boxwork edges snagged life support umbilical tether before emergency extraction.',
              consequenceAr:
                'إنذار احتجاز حرج! انهارت طبقة الغبار الهوائي الخفية تحت وزن الرائد وغاصت الأحذية 32 سم في الرمل المفكك، مع اشتباك حواف صخرية حادة بأنبوب دعم الحياة قبل التراجع الطارئ.',
              nasaDataCitation: 'NASA/JPL Curiosity Mobility Hazard Assessment & PIA26558',
              targetHeadingDeg: 350,
              targetPitchDeg: -16,
            },
          ],
        },
      },
      {
        id: 'gl-b4',
        beatIndex: 3,
        titleEn: 'Field Verdict: Climate Transition Unlocked',
        titleAr: 'التقرير الميداني: حل لغز التحول المناخي',
        stage: 'panorama',
        cameraCue: { azimuthDeg: 242, elevationDeg: 12, fovDeg: 62 },
        audioCue: 'discovery-swell',
        narrationEn:
          'Stratigraphic data verified. Gale Crater preserves the definitive planetary transition from ancient freshwater lakes to an arid, sulfate-rich Mars. The geological record written into Mount Sharp confirms that liquid water persisted on Mars far longer than previously thought.',
        narrationAr:
          'تم تأكيد التتابع الطبقي بنجاح. تحفظ فوهة غيل التحول الكوكبي الحاسم من بحيرات مياه عذبة طينية إلى عصر جاف غني بالكبريتات والترسبات المعدنية، مؤكدة استمرار تدفق المياه السائلة لفترات أطول مما كان متوقعاً.',
        subtitleEn:
          'Geological sequence documented: Lacustrine clays to sulfate deposits. Gale chapter complete.',
        subtitleAr:
          'توثيق التتابع الجيولوجي: من طين البحيرات إلى ترسبات الكبريتات. اكتمل فصل فوهة غيل بنجاح.',
        durationSec: 15,
        scientificNoteEn:
          'NASA Caveat: Groundwater and late erosion models for boxwork remain an active scientific hypothesis. Waypoint elevations require local DEM sampling.',
        scientificNoteAr:
          'ملاحظة ناسا: نماذج المياه الجوفية لتشكلات البوكس وورك ما زالت فرضية علمية قيد البحث وليست حقيقة قطعية.',
        sourceCitation: 'NASA MSL Science Team & USGS-NASA Geologic Mapping',
      },
    ],
  },
  {
    id: 'meridiani',
    chapterNumber: '03',
    siteId: 'meridiani',
    titleEn: 'Blueberries on the Rim',
    titleAr: 'حبات التوت الأزرق على الحافة',
    subtitleEn: 'Opportunity Endeavour Crater Rim & Hematite Plains',
    subtitleAr: 'حافة فوهة إنديفور وسهول الهيماتيت ووادي بيرسيفيرانس',
    missionRef: 'Mars Exploration Rover Opportunity',
    heroImage: '/assets/mars/',
    elevationDatum: 'MOLA / HiRISE DTM Datum (-1,420 m Regional Plain Datum · Eagle to Endeavour Rim)',
    sources: [
      'JPL Mars Trek (Endeavour Crater Rim 45.16 km Traverse & HiRISE DTM)',
      'USGS-NASA Planetary Geologic Mapping Program (Meridiani Planum Geologic Map I-2823)',
      'NASA Worldview (Thermal Emission Spectrometer TES Hematite Spectral Signature)',
      'Opportunity Raw Images Archive (Pancam Sol Mosaics & PIA21723 Perseverance Valley)',
      'NASA Planetary Data System (APXS & Mössbauer Hematite Spherule Study)',
    ],
    beats: [
      {
        id: 'mr-b1',
        beatIndex: 0,
        titleEn: 'Orbital Approach: The Hematite Plains',
        titleAr: 'الاقتراب المداري: سهول الهيماتيت الفضية',
        stage: 'orbit',
        cameraCue: { lat: -2.28, lon: 354.78, distance: 7.3, fovDeg: 45 },
        audioCue: 'ambient-wind',
        narrationEn:
          'Ares orbital scan over Meridiani Planum, coordinates 2.28 south, 354.78 east. From space, this region stands out by its strong thermal-emission signature of crystalline hematite—evidence that subterranean water once soaked through these layered sedimentary plains.',
        narrationAr:
          'مسح مداري فوق سهول ميريدياني بلانوم، عند خط عرض 2.28 جنوباً وخط طول 354.78 شرقاً. تتميز هذه السهول ببصمة طيفية قوية لمعدن الهيماتيت الرمادي البلوري، مما يثبت أن المياه الجوفية المشبعة بالمعادن غمرت هذه الصخور في عصور سحيقة.',
        subtitleEn:
          'Orbit locked at 2.28°S, 354.78°E. Endeavour crater diameter: 22 km · Elevation: -1,420 m MOLA datum.',
        subtitleAr:
          'تثبيت المدار عند 2.28° جنوباً، 354.78° شرقاً. قطر فوهة إنديفور: 22 كم · المنسوب: -1,420 م MOLA.',
        durationSec: 16,
        sourceCitation: 'USGS Meridiani Planum Map & Mars Global Surveyor TES',
      },
      {
        id: 'mr-b2',
        beatIndex: 1,
        titleEn: 'Surface Touchdown: The Western Rim',
        titleAr: 'الهبوط السطحي: الحافة الغربية ووادي بيرسيفيرانس',
        stage: 'panorama',
        cameraCue: { azimuthDeg: 42, elevationDeg: 3, fovDeg: 62 },
        audioCue: 'descent-riser',
        narrationEn:
          'Standing on the western rim of Endeavour Crater. Across the dark basalt sand ripples, millions of millimeter-sized gray hematite spherules—the famous Martian blueberries—glitter under the ochre sky. In the distance, Perseverance Valley cuts through the rim, marking Opportunity’s epic 45.16-kilometer marathon.',
        narrationAr:
          'نقف على الحافة الغربية لفوهة إنديفور. تنتشر ملايين الكريات الرمادية الدقيقة من الهيماتيت—حبات التوت المريخي الشهيرة—فوق تموجات الرمال البازلتية، بينما يمتد وادي بيرسيفيرانس متعرجاً نحو قاع الفوهة، شاهداً على رحلة أبورتيونيتي التاريخية لمسافة 45.16 كيلومتر.',
        subtitleEn:
          'Surface elevation: -1,420 m · Opportunity 14-year traverse distance: 45.16 km (PIA21723).',
        subtitleAr:
          'الارتفاع السطحي: -1,420 متر · مسافة رحلة أبورتيونيتي التاريخية: 45.16 كم (بانوراما PIA21723).',
        durationSec: 17,
        sourceCitation: 'Opportunity Raw Images Archive (PIA21723) & Pancam Team',
      },
      {
        id: 'mr-b3',
        beatIndex: 2,
        titleEn: 'Astronaut Dilemma: Traversing Basalt Ripples',
        titleAr: 'معضلة الرائد: النزول عبر منحدرات تموجات الرمال البازلتية',
        stage: 'panorama',
        cameraCue: { azimuthDeg: 120, elevationDeg: -7, fovDeg: 58 },
        audioCue: 'eva-tension',
        narrationEn:
          'We must descend into Perseverance Valley to sample hydrothermal gypsum veins. The slope drops through active basalt ripple fields and inner rim gullies steepening to 23 degrees. Crossing the soft sand ripples risks severe sinkage, as Opportunity experienced when stuck in Purgatory Dune. How do we descend?',
        narrationAr:
          'علينا النزول إلى وادي بيرسيفيرانس لأخذ عينات من عروق الجبس المائي. ينحدر السطح بزاوية تصل إلى 23 درجة عبر تموجات رملية بازلتية داكنة قد تبتلع الأقدام كما حدث لأبورتيونيتي في كثبان بورغاتوري. كيف سنختار مسار النزول؟',
        subtitleEn:
          'EVA Decision: Ripple descent vs. anchoring along exposed sulfate ridge.',
        subtitleAr:
          'قرار السير: تثبيت المسار فوق صخور الكبريتات الصلبة، أم عبور التموجات بحذر، أم النزول المباشر في المزلقة الرملية.',
        durationSec: 17,
        sourceCitation: 'Opportunity Rover Mobility & Purgatory Ripple Event',
        choicePrompt: {
          questionEn: 'Choose Descent Method Into Perseverance Valley',
          questionAr: 'اختر طريقة النزول إلى وادي بيرسيفيرانس',
          contextEn:
            'Opportunity famously became bogged in the Purgatory Ripple dune for five weeks due to soft basalt sand under thin crust. Inner rim gullies steepen to 23° with loose scree.',
          contextAr:
            'علق المسبار أبورتيونيتي سابقاً في كثبان بورغاتوري 5 أسابيع بسبب الرمال الناعمة، والمنحدرات الداخلية تصل إلى 23 درجة.',
          options: [
            {
              id: 'mr-opt-ridge',
              labelEn: 'Anchor traverse along solid sulfate bedrock outcrop ridge',
              labelAr: 'تثبيت المسار بمحاذاة بروزات صخور الكبريتات الصلبة',
              riskLevel: 'SAFE',
              consequenceEn:
                'Firm, rock-solid footing. Walking on the exposed Rocheport sulfate crest eliminates sinkage hazard, providing stable platform for APXS spectrometer analysis of gypsum veins and hematite concretions.',
              consequenceAr:
                'موطئ قدم صلب ومستقر تماماً. المشي فوق مرتفع الكبريتات الصخري لغى مخاطر الغوص في الرمال، ووفر منصة مثالية لفحص عروق الجبس وكرات الهيماتيت بالمطياف بأمان تام.',
              nasaDataCitation: 'HiRISE Endeavour Rim DTM Outcrop Survey · Slope 8.8°',
              targetHeadingDeg: 42,
              targetPitchDeg: 2,
            },
            {
              id: 'mr-opt-ripple',
              labelEn: 'Descend across low-amplitude basalt sand ripples with snowshoe gait',
              labelAr: 'النزول عبر تموجات الرمال البازلتية المنخفضة بخطوات واسعة',
              riskLevel: 'CAUTION',
              consequenceEn:
                'Heel sinkage up to 14 cm in loose aeolian sand. Dark basalt dust accumulated inside boot joint seals, requiring suit purge cycle before re-pressurization.',
              consequenceAr:
                'غوص الكعبين حتى 14 سم في الرمال البازلتية. تراكم الغبار الداكن حول مفاصل الأحذية مما تطلب دورة تنظيف بالضغط قبل العودة للمركبة.',
              nasaDataCitation: 'JPL Rover Sand Sinkage & Opportunity Mobility Analysis',
              targetHeadingDeg: 120,
              targetPitchDeg: -10,
            },
            {
              id: 'mr-opt-gully',
              labelEn: 'Fast plunge down steep 23° inner rim gully sand chute',
              labelAr: 'الهبوط السريع عبر مزلقة رملية بزاوية 23° على الحافة الداخلية',
              riskLevel: 'HAZARD',
              consequenceEn:
                'Sustained slip and slide! Triggered a cascading sand-slip down the 23° slope. Crew slid 8 meters into a basalt sand hollow before self-arresting, mirroring Opportunity’s 5-week Purgatory Dune wheel entrapment.',
              consequenceAr:
                'انزلاق رملي جارف! أدى النزول إلى انهيار المنحدر الرملي بزاوية 23° وانزلاق الفريق 8 أمتار داخل تجويف رملي، مستحضراً حادثة حصار أبورتيونيتي الشهيرة في كثبان بورغاتوري لخمسة أسابيع.',
              nasaDataCitation: 'Opportunity Purgatory Dune Entrapment Archive & HiRISE DTM 23° Gully',
              targetHeadingDeg: 280,
              targetPitchDeg: -18,
            },
          ],
        },
      },
      {
        id: 'mr-b4',
        beatIndex: 3,
        titleEn: 'Field Verdict: Groundwater Record Documented',
        titleAr: 'التقرير الميداني: توثيق أثر المياه الجوفية القديمة',
        stage: 'panorama',
        cameraCue: { azimuthDeg: 285, elevationDeg: 8, fovDeg: 62 },
        audioCue: 'discovery-swell',
        narrationEn:
          'Mission objective fulfilled. The hematite spherules and sulfate veins confirm an era of neutral-to-acidic groundwater percolation. Opportunity’s marathon journey across Meridiani has provided humanity with the empirical roadmap for safe interplanetary operations.',
        narrationAr:
          'تحقق الهدف الاستكشافي بالكامل. تؤكد كريات الهيماتيت وعروق الجبس حقبة طويلة من ترشح المياه الجوفية المعدلة للصخور. لقد مهدت مسيرة أبورتيونيتي الرائدة عبر ميريدياني الطريق لعمليات استكشاف بشرية آمنة.',
        subtitleEn:
          'Hematite spherules & gypsum veins logged. Meridiani chapter complete.',
        subtitleAr:
          'توثيق عينات الهيماتيت وعروق الجبس. اكتمل فصل ميريدياني بلانوم بنجاح.',
        durationSec: 15,
        scientificNoteEn:
          'NASA Caveat: Evidence of water supports groundwater alteration, not a single permanent lake. Rim elevations vary along the 22 km perimeter.',
        scientificNoteAr:
          'ملاحظة ناسا: أدلة المياه تدعم وجود مياه جوفية معدلة للصخور وليس بالضرورة بحيرة دائمة عميقة.',
        sourceCitation: 'NASA Opportunity Science Team & USGS-NASA Geologic Mapping',
      },
    ],
  },
  {
    id: 'utopia',
    chapterNumber: '04',
    siteId: 'utopia',
    titleEn: 'The Frozen Sea of Vastitas',
    titleAr: 'بحر الجليد في يوتوبيا',
    subtitleEn: 'Viking 2 Boulder Plain & SHARAD Subsurface Ice',
    subtitleAr: 'سهل صخور فايكنغ 2 وجليد رادار شاراد المدفون',
    missionRef: 'Viking 2 Lander & Mars Reconnaissance Orbiter SHARAD',
    heroImage: '/assets/mars/',
    elevationDatum: 'MOLA Global Datum (-3,000 m to -4,100 m Lowland Basin · Viking 2 Datum)',
    sources: [
      'JPL Mars Trek (Northern Lowlands MOLA Elevation Datum & Basin Relief)',
      'USGS-NASA Planetary Geologic Mapping Program (Utopia Planitia Photogeologic Map I-2161)',
      'NASA Worldview (Mars Lowlands Seasonal Surface Frost & Atmosphere Monitor)',
      'MRO SHARAD Radar Team (Subsurface Dielectric Permittivity ε ≈ 3.15 Water-Ice Survey)',
      'NASA Viking 2 Surface Archive (PIA00571 Pitted Basalt Plain & Soil Trench Logs)',
    ],
    beats: [
      {
        id: 'ut-b1',
        beatIndex: 0,
        titleEn: 'Orbital Approach: The Vast Lowland Basin',
        titleAr: 'الاقتراب المداري: حوض الأراضي المنخفضة الشمالية',
        stage: 'orbit',
        cameraCue: { lat: 47.97, lon: 134.28, distance: 7.2, fovDeg: 45 },
        audioCue: 'ambient-wind',
        narrationEn:
          'Orbiting over the vast northern plains of Utopia Planitia at 48 degrees north latitude. Sitting at over three kilometers below the Martian datum, this immense impact basin holds one of Mars’ greatest survival assets: an underground sheet of water ice as large as Lake Superior.',
        narrationAr:
          'نحلق فوق سهول يوتوبيا بلانيتيا الشمالية الشاسعة عند خط عرض 47.64 شمالاً وخط طول 134.29 شرقاً. يقع هذا الحوض البركاني العملاق على عمق يزيد عن 3 كيلومترات تحت الصفر المريخي، ويخفي تحت سطحه طبقة جليد مائي ضخمة تعادل مساحتها بحيرة سوبيريور.',
        subtitleEn:
          'Orbit locked at 47.97°N, 134.28°E. Elevation: -3,000 to -4,100 m MOLA datum.',
        subtitleAr:
          'تم تثبيت المدار عند 47.64° شمالاً، 134.29° شرقاً. الارتفاع: -3,000 إلى -4,100 متر وفق MOLA.',
        durationSec: 16,
        sourceCitation: 'MRO SHARAD Radar Survey & USGS-NASA Geologic Map',
      },
      {
        id: 'ut-b2',
        beatIndex: 1,
        titleEn: 'Surface Touchdown: The Plain of Pitted Basalt',
        titleAr: 'الهبوط السطحي: سهل الصخور البازلتية المنقرة',
        stage: 'panorama',
        cameraCue: { azimuthDeg: 15, elevationDeg: 2, fovDeg: 62 },
        audioCue: 'descent-riser',
        narrationEn:
          'Welcome to the Viking 2 landing site. As far as the eye can see, thousands of pitted vesicular basalt boulders litter the dark soil. In the shadows of the rocks, patches of seasonal water frost linger under a pale salmon sky. Ambient temperature reads minus 76 degrees Celsius.',
        narrationAr:
          'أهلاً بكم في موقع هبوط فايكنغ 2 التاريخي. على مد البصر، تنتشر آلاف الصخور البازلتية المنقرة فوق التربة القاتمة، وتلمع في ظلالها بقع الصقيع المائي الموسمي تحت سماء مريخية شاحبة. الحرارة تنخفض إلى 76 درجة مئوية تحت الصفر.',
        subtitleEn:
          'Viking 2 site · Temperature: -76°C · Pitted basalt boulders & seasonal frost (PIA00571).',
        subtitleAr:
          'موقع فايكنغ 2 · الحرارة: -76° مئوية · صخور بازلتية منقرة وبقع صقيع موسمي (PIA00571).',
        durationSec: 16,
        sourceCitation: 'NASA/JPL Viking 2 Surface Panorama Archive (PIA00571)',
      },
      {
        id: 'ut-b3',
        beatIndex: 2,
        titleEn: 'Astronaut Dilemma: Radar Dielectric Sounding for Ice',
        titleAr: 'معضلة الرائد: الحفر نحو الجليد المدفون عبر القياس الراداري',
        stage: 'panorama',
        cameraCue: { azimuthDeg: 110, elevationDeg: -8, fovDeg: 58 },
        audioCue: 'eva-tension',
        narrationEn:
          'Our mission is to confirm extractable water ice for human life support. MRO SHARAD orbital radar soundings detect a massive subsurface deposit with low dielectric permittivity—epsilon approximately 3.15—indicative of 50 to 85 percent pure water ice. Solid basalt rocks exhibit high permittivity exceeding 6.5. Where do we deploy the core drill?',
        narrationAr:
          'مهمتنا تأكيد استخراج الجليد المائي لدعم حياة الرواد. أظهر رادار شاراد المداري وجود طبقة جليد ذات سماحية كهربائية منخفضة (ε ≈ 3.15) تحت 1 إلى 10 أمتار من التربة، بينما الصخور البازلتية ذات سماحية مرتفعة تفوق 6.5. أين نوجه مثقاب الحفر؟',
        subtitleEn:
          'EVA Decision: Low-dielectric polygon trough vs. boulder shadow thermal trap.',
        subtitleAr:
          'قرار السير: حفر مضلعات الانكماش ذات السماحية 3.15، أم حفر ظل الصخرة السطحي، أم صخور البازلت المصمتة.',
        durationSec: 17,
        sourceCitation: 'SHARAD Regional Ice Sounding & Viking Soil Trench Log',
        choicePrompt: {
          questionEn: 'Select Subsurface Ice Drilling Target via Dielectric Permittivity',
          questionAr: 'اختر موقع حفر الجليد تحت السطحي وفق السماحية الكهربائية الرادارية',
          contextEn:
            'SHARAD orbital radar detected a 50% to 85% water ice sheet with low dielectric permittivity (ε ≈ 3.15) sealed beneath 1 to 10 m of regolith. Basalt rocks exhibit ε > 6.5.',
          contextAr:
            'رصد رادار شاراد طبقة جليد بنقاء 50% إلى 85% وسماحية منخفضة (ε ≈ 3.15) تحت غطاء عازل، بينما البازلت يمتلك سماحية ε > 6.5.',
          options: [
            {
              id: 'ut-opt-sharad',
              labelEn: 'Deploy deep core drill into SHARAD low-dielectric (ε ≈ 3.15) polygon trough',
              labelAr: 'حفر عميق في مضلع الانكماش المعاير بسماحية شاراد المنخفضة (ε ≈ 3.15)',
              riskLevel: 'SAFE',
              consequenceEn:
                'Spectacular strike! Core drill extracted massive crystalline water ice at 2.4 meters depth. Dielectric permittivity of 3.15 confirmed >80% pure water ice volume—providing an abundant ISRU water source for future human bases.',
              consequenceAr:
                'نجاح استكشافي مبهر! استخرج الحفار جليداً مائياً متبلوراً على عمق 2.4 متر. وأكدت السماحية الرادارية المنخفضة (3.15) نقاء الجليد بنسبة تتجاوز 80%، مما يضمن مصدراً مائياً حيوياً لمستعمرات المريخ.',
              nasaDataCitation: 'MRO SHARAD Radar Sounding · Dielectric Permittivity ε ≈ 3.15',
              targetHeadingDeg: 110,
              targetPitchDeg: -6,
            },
            {
              id: 'ut-opt-frost',
              labelEn: 'Shallow auger drill into boulder-shadow seasonal frost pocket',
              labelAr: 'حفر سطحي حلزوني في بقعة الصقيع الموسمي بظل الصخرة',
              riskLevel: 'CAUTION',
              consequenceEn:
                'Desiccation boundary encountered. The upper 80 cm contains only trace surface frost; sublimation has depleted near-surface moisture. Demonstrates that orbital radar dielectric sounding is mandatory to locate true deep ice sheets.',
              consequenceAr:
                'مواجهة طبقة جافة متبخرة. يحتوي أول 80 سم على آثار صقيع فقط بعد تسامي الرطوبة السطحية، مما يثبت ضرورة استخدام مسح الرادار المداري لتحديد العمق الحقيقي لطبقة الجليد.',
              nasaDataCitation: 'Viking 2 Surface Sampler Trench Log & Sublimation Model',
              targetHeadingDeg: 15,
              targetPitchDeg: -4,
            },
            {
              id: 'ut-opt-rock',
              labelEn: 'High-frequency percussion drill into high-dielectric (ε > 6.5) basalt mound',
              labelAr: 'حفر ارتدادي عالي التردد في تكتل بازلتي ذي سماحية كهربائية مرتفعة (ε > 6.5)',
              riskLevel: 'HAZARD',
              consequenceEn:
                'Mechanical overload hazard! High radar permittivity (ε = 6.8) reflected dense solid volcanic basalt without ice. Drill bit sheared on vesicular lava rock, overheating the power unit and draining 30% of suit emergency battery reserves.',
              consequenceAr:
                'خطر إجهاد ميكانيكي حرج! عكست السماحية الرادارية المرتفعة (6.8) صخوراً بازلتية بركانية مصمتة خالية من الجليد. انكسر رأس الحفار في الحمم المتصلبة مما استنزف 30% من طاقة بطارية البدلة الاحتياطية.',
              nasaDataCitation: 'USGS Utopia Planitia Basalt Density Survey & Dielectric Constant Analysis',
              targetHeadingDeg: 22,
              targetPitchDeg: -14,
            },
          ],
        },
      },
      {
        id: 'ut-b4',
        beatIndex: 3,
        titleEn: 'Field Verdict: Oasis of the North',
        titleAr: 'التقرير الميداني: واحة الشمال المريخي',
        stage: 'panorama',
        cameraCue: { azimuthDeg: 270, elevationDeg: 6, fovDeg: 62 },
        audioCue: 'discovery-swell',
        narrationEn:
          'Water ice reservoir confirmed. Utopia Planitia holds enough accessible water ice to sustain generations of human explorers and fuel return spacecraft to Earth. The robotic legacy of Viking 2 has culminated in human survival.',
        narrationAr:
          'تم تأكيد خزان الجليد المائي رسمياً. تحتوي يوتوبيا بلانيتيا على جليد مائي نقي يكفي لتأمين مياه الشرب وإنتاج وقود الهيدروجين والأكسجين لمركبات العودة إلى الأرض، متممة الإرث العلمي الذي بدأته فايكنغ 2 عام 1976.',
        subtitleEn:
          'Subsurface water ice verified: >80% volumetric concentration (ε ≈ 3.15). Utopia chapter complete.',
        subtitleAr:
          'تأكيد الجليد المائي تحت السطحي بنقاء >80%. اكتمل فصل يوتوبيا بلانيتيا.',
        durationSec: 15,
        scientificNoteEn:
          'NASA Caveat: Regional ice thickness estimates are based on orbital radar modeling, not direct drill cores beneath the Viking 2 footpad.',
        scientificNoteAr:
          'ملاحظة ناسا: تقديرات سماكة الجليد تعتمد على نماذج الرادار المداري وليست ناتجة عن حفر مباشر تحت أقدام فايكنغ 2.',
        sourceCitation: 'NASA Viking 2 Archive & MRO SHARAD Team',
      },
    ],
  },
  {
    id: 'gusev',
    chapterNumber: '05',
    siteId: 'gusev',
    titleEn: 'The Blue Sunset of Husband Hill',
    titleAr: 'الغروب الأزرق لتلال كولومبيا',
    subtitleEn: 'Spirit Rover Summit & Ancient Hydrothermal Springs',
    subtitleAr: 'قمة هازبند هيل والينابيع الحارة في هوم بليت',
    missionRef: 'Mars Exploration Rover Spirit',
    heroImage: '/assets/mars/',
    elevationDatum: 'USGS Global MOLA Datum (-1,920 m Regional Baseline · Columbia Hills +100 m Relief)',
    sources: [
      'JPL Mars Trek (Columbia Hills MOLA 463 m/px DEM & Husband Hill Traverse)',
      'USGS-NASA Planetary Geologic Mapping Program (Gusev Crater Geologic Map I-2782)',
      'NASA Worldview (Atmospheric Dust Forward Scattering & Sunset Radiance)',
      'Spirit Raw Images Archive (Pancam Blue Sunset PIA07997 & Husband Hill Summit Mosaic)',
      'USGS Astrogeology (Hydrothermal Opaline Silica Alteration at Home Plate)',
    ],
    beats: [
      {
        id: 'gv-b1',
        beatIndex: 0,
        titleEn: 'Orbital Approach: The Columbia Hills',
        titleAr: 'الاقتراب المداري: فوهة غوسيف وتلال كولومبيا',
        stage: 'orbit',
        cameraCue: { lat: -14.59, lon: 175.5, distance: 7.1, fovDeg: 45 },
        audioCue: 'ambient-wind',
        narrationEn:
          'Approaching our final chapter over Gusev Crater, coordinates 14.589 south, 175.501 east. Spanning 166 kilometers, this volcanic basin was named after astronomer Matvey Gusev. Rising from the dark basalt plains are the Columbia Hills, named in honor of the Space Shuttle Columbia crew.',
        narrationAr:
          'نقترب من محطتنا الأخيرة فوق فوهة غوسيف البركانية، عند 14.589 جنوباً و175.501 شرقاً. يمتد قطر الفوهة 166 كيلومتراً، وتبرز من سهولها البازلتية الداكنة تلال كولومبيا التي سُميت تخليداً لذكرى طاقم مكوك الفضاء كولومبيا.',
        subtitleEn:
          'Orbit locked at 14.589°S, 175.501°E. Columbia Hills rise ~100 m above crater floor (-1,920 m MOLA).',
        subtitleAr:
          'تثبيت المدار عند 14.589° جنوباً، 175.501° شرقاً. ترتفع التلال ~100 م فوق قاع الفوهة (-1,920 م MOLA).',
        durationSec: 16,
        sourceCitation: 'USGS-NASA Planetary Geologic Mapping Program & HiRISE DEM',
      },
      {
        id: 'gv-b2',
        beatIndex: 1,
        titleEn: 'Surface Touchdown: The Blue Twilight',
        titleAr: 'الهبوط السطحي: الشفق المريخي والغروب الأزرق',
        stage: 'panorama',
        cameraCue: { azimuthDeg: 0, elevationDeg: 2, fovDeg: 62 },
        audioCue: 'descent-riser',
        narrationEn:
          'We have ascended to the summit of Husband Hill. Ahead, the sun sinks below the distant crater rim, casting a cool, ethereal blue halo across the sky. On Mars, fine airborne dust particles scatter blue light forward toward the observer, making Martian sunsets famously blue.',
        narrationAr:
          'صعدنا إلى قمة هازبند هيل. تغرب الشمس وراء حافة الفوهة البعيدة ناشرة هالة زرقاء باردة وساحرة. على المريخ، تؤدي جزيئات الغبار الناعمة في الغلاف الجوي إلى تشتيت الضوء الأزرق نحو الأمام باتجاه الراصد، مما يجعل الغروب أزرقاً فريداً.',
        subtitleEn:
          'Gusev sunset: Forward Rayleigh-like dust scattering creates iconic blue twilight halo (PIA07997).',
        subtitleAr:
          'غروب غوسيف: تشتيت الغبار للضوء نحو الأمام يخلق الشفق الأزرق المريخي الأيقوني (PIA07997).',
        durationSec: 17,
        sourceCitation: 'Spirit Raw Images Archive (PIA07997) & NASA Science Team',
      },
      {
        id: 'gv-b3',
        beatIndex: 2,
        titleEn: 'Astronaut Dilemma: Navigating Volcanic Scree',
        titleAr: 'معضلة الرائد: عبور الركام البركاني المنحدر نحو رواسب السيليكا',
        stage: 'panorama',
        cameraCue: { azimuthDeg: 32, elevationDeg: -9, fovDeg: 58 },
        audioCue: 'eva-tension',
        narrationEn:
          'Twilight is fading and temperature is plunging toward minus eighty degrees. We need to reach the Home Plate hydrothermal silica beds. A direct descent down the scree slope faces a steep 28.5-degree pitch of loose volcanic rock, while a gentle switchback follows Spirit’s historic ascent route. Which route do we take?',
        narrationAr:
          'يخبو ضوء الشفق وتنخفض الحرارة سريعاً نحو 80 تحت الصفر. علينا الوصول إلى طبقات السيليكا الأوبالية في هوم بليت. أمامنا خيار النزول المباشر عبر ركام بركاني شديد الانحدار بزاوية 28.5 درجة، أو مسار صخري علوي، أو مسار متعرج مأمون يتبع خطى مسبار سبيريت. كيف ستتحرك؟',
        subtitleEn:
          'EVA Decision: 28.5° volcanic scree slope vs. gradual switchback route.',
        subtitleAr:
          'قرار السير: مسار سبيريت المتعرج المأمون، أم حافة الصخور البازلتية، أم الاندفاع في الركام المنحدر 28.5°.',
        durationSec: 18,
        sourceCitation: 'USGS Spirit Hydrothermal Survey & Mobility Log',
        choicePrompt: {
          questionEn: 'Choose Descent Route to Home Plate Silica Beds',
          questionAr: 'اختر مسار النزول نحو طبقات السيليكا المائية في هوم بليت',
          contextEn:
            'Spirit faced severe wheel stall and spin on loose volcanic scree slopes exceeding 20°. Human explorers must balance time against slope stability.',
          contextAr:
            'عانت عجلات سبيريت من التوقف والانزلاق في الركام البركاني فوق 20 درجة، وعلى الرواد الموازنة بين الوقت وتماسك الصخور.',
          options: [
            {
              id: 'gv-opt-switchback',
              labelEn: 'Follow gentle switchback traverse along Spirit’s historic ascent track',
              labelAr: 'اتباع مسار متعرج مأمون على خطى صعود مسبار سبيريت التاريخي',
              riskLevel: 'SAFE',
              consequenceEn:
                'Safe, controlled descent. Following the stabilized bedrock route kept incline under 12°. Crew successfully reached the Home Plate opaline silica beds—documenting 90% pure silica deposited by ancient volcanic hot springs.',
              consequenceAr:
                'نزول آمن ومدروس. حافظ المسار الصخري على انحدار أقل من 12°، ووصل الفريق بأمان إلى طبقات السيليكا الأوبالية في هوم بليت، موثقاً نقاءً بنسبة 90% خلفته ينابيع حارة بركانية قديمة.',
              nasaDataCitation: 'USGS Spirit Hydrothermal Alteration at Gusev & Sol Traverse Map',
              targetHeadingDeg: 32,
              targetPitchDeg: -6,
            },
            {
              id: 'gv-opt-ledge',
              labelEn: 'Traverse along upper basaltic bedrock ledge with ankle stabilizers',
              labelAr: 'العبور على حافة الصخور البازلتية العلوية باستخدام مثبتات الكاحل',
              riskLevel: 'CAUTION',
              consequenceEn:
                'Slow progress on narrow ledge. Firm rock footing avoids sliding, but gusting 14 m/s downslope winds cause suit aerodynamic drag, demanding constant tether checks and pacing.',
              consequenceAr:
                'تقدم بطيء على حافة ضيقة. يوفر الصخر تماسكاً جيداً ولكن هبات الرياح بسرعة 14 م/ث تسببت في مقاومة هوائية للبدلة، مما فرض فحصاً مستمراً للأحبال والتأني في المسير.',
              nasaDataCitation: 'Spirit Husband Hill Summit Wind & Ridge Survey · USGS',
              targetHeadingDeg: 215,
              targetPitchDeg: -8,
            },
            {
              id: 'gv-opt-scree',
              labelEn: 'Direct rush down 28.5° unstable volcanic scree slope',
              labelAr: 'الاندفاع المباشر عبر منحدر الركام البركاني غير المستقر بزاوية 28.5°',
              riskLevel: 'HAZARD',
              consequenceEn:
                'Catastrophic scree slide triggered! Shifting angular basalt rubble gave way under boot impact. Astronaut suffered a 12-meter uncontrolled slide, straining lower-limb suit actuators and confirming Spirit rover’s severe mobility stall on steep scree.',
              consequenceAr:
                'انهيار صخري خطير! انهارت الحجارة البازلتية المفككة تحت وطأة الأقدام، مما أدى لانزلاق الرائد 12 متراً وتضرر مفاصل البدلة الميكانيكية، مؤكداً ما واجهه مسبار سبيريت من شلل حركي على منحدرات الركام.',
              nasaDataCitation: 'NASA/JPL Spirit Rover Husband Hill Scree Mobility Report & HiRISE PSP0017771650',
              targetHeadingDeg: 215,
              targetPitchDeg: -16,
            },
          ],
        },
      },
      {
        id: 'gv-b4',
        beatIndex: 3,
        titleEn: 'Field Verdict: Humanity on the Red Planet',
        titleAr: 'التقرير الميداني: مسيرة الإنسانية على الكوكب الأحمر',
        stage: 'panorama',
        cameraCue: { azimuthDeg: 0, elevationDeg: 6, fovDeg: 64 },
        audioCue: 'discovery-swell',
        narrationEn:
          'Mission Stories complete. From the river deltas of Jezero to the mineral boxwork of Gale, the hematite plains of Meridiani, the frozen seas of Utopia, and the blue sunsets of Gusev—the empirical data gathered by NASA’s robotic pioneers now illuminates the path for the first human footsteps on Mars.',
        narrationAr:
          'اكتملت سلسلة قصص المهام الاستكشافية بنجاح. من دلتا جيزيرو النهرية إلى متاهة غيل المتصدعة، وسهول ميريدياني الفضية، وبحار يوتوبيا الجليدية، وغروب غوسيف الأزرق—إن البيانات التجريبية التي جمعتها مسابر ناسا ترسم اليوم معالم الطريق لأول خطى بشرية على سطح المريخ.',
        subtitleEn:
          'All five NASA mission provinces explored. AresWalk mission stories complete.',
        subtitleAr:
          'تم استكشاف مقاطعات ناسا الخمس بنجاح. اكتملت قصص آريس الميدانية.',
        durationSec: 16,
        scientificNoteEn:
          'NASA Caveat: Coordinates 14.589°S, 175.501°E mark the HiRISE center near Columbia Hills. Hydrothermal alteration applies to specific local geological units.',
        scientificNoteAr:
          'ملاحظة ناسا: الإحداثيات تمثل مركز نطاق هاي رايز، والتحولات الحرارية المائية تنطبق على وحدات صخرية محددة وليس كل الفوهة.',
        sourceCitation: 'NASA Mars Exploration Program & JPL Mars Trek',
      },
    ],
  },
];

export function getChapterById(id: string): StoryChapter | undefined {
  return STORY_CHAPTERS.find((c) => c.id === id);
}

export function getAllChapterPreviews(): {
  id: string;
  chapterNumber: string;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  heroImage: string;
  beatsCount: number;
}[] {
  return STORY_CHAPTERS.map((c) => ({
    id: c.id,
    chapterNumber: c.chapterNumber,
    titleEn: c.titleEn,
    titleAr: c.titleAr,
    subtitleEn: c.subtitleEn,
    subtitleAr: c.subtitleAr,
    heroImage: c.heroImage,
    beatsCount: c.beats.length,
  }));
}