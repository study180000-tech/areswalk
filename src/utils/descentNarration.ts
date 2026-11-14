import type { MarsSite } from '../types/mars';

export function getDescentNarration(site: MarsSite, lang: 'ar' | 'en'): {
  spokenText: string;
  telemetryPoints: { label: string; value: string }[];
} {
  const isAr = lang === 'ar';

  if (isAr) {
    const verdictText =
      site.safetyVerdict === 'SAFE'
        ? 'منطقة آمنة ومستقرة'
        : site.safetyVerdict === 'CAUTION'
          ? 'منطقة تحذير ميداني بسبب المنحدرات والرواسب'
          : 'منطقة خطرة عالية الانحدار';

    const spokenText = `نحن نتجه الآن نحو ${site.nameAr}. نسبة ثاني أكسيد الكربون ${site.co2Percent}% مع ضغط جوي ${site.pressureKpa} كيلوباسكال. المنسوب المداري ${site.elevationM} متراً وفق مقياس MOLA. متوسط الانحدار ${site.meanSlopeDeg} درجات ويصل إلى ${site.maxSlopeDeg} درجة كحد أقصى. تصنيف المنطقة: ${verdictText}. ملامسة السطح مؤكدة.`;

    return {
      spokenText,
      telemetryPoints: [
        { label: 'الغاز السائد', value: `CO₂ ${site.co2Percent}%` },
        { label: 'الضغط السطحي', value: `${site.pressureKpa} kPa` },
        { label: 'المنسوب المداري', value: `${site.elevationM} m (MOLA)` },
        { label: 'الانحدار', value: `${site.meanSlopeDeg}° (أقصى ${site.maxSlopeDeg}°)` },
        { label: 'تقييم السلامة', value: verdictText },
      ],
    };
  }

  const verdictText =
    site.safetyVerdict === 'SAFE'
      ? 'SAFE AND STABLE'
      : site.safetyVerdict === 'CAUTION'
        ? 'FIELD CAUTION · SLOPE & MOBILITY FACTORS'
        : 'HIGH RISK HAZARDOUS';

  const spokenText = `Now entering atmospheric descent corridor toward ${site.name}. Atmospheric composition is ${site.co2Percent}% carbon dioxide with surface pressure of ${site.pressureKpa} kilopascals. Elevation datum is ${site.elevationM} meters MOLA. Average slope is ${site.meanSlopeDeg} degrees, peaking at ${site.maxSlopeDeg} degrees near scarps. Regional terrain verdict: ${verdictText}. Surface contact confirmed.`;

  return {
    spokenText,
    telemetryPoints: [
      { label: 'Dominant Gas', value: `CO₂ ${site.co2Percent}%` },
      { label: 'Surface Pressure', value: `${site.pressureKpa} kPa` },
      { label: 'Elevation Datum', value: `${site.elevationM} m (MOLA)` },
      { label: 'Slope Profile', value: `${site.meanSlopeDeg}° avg (max ${site.maxSlopeDeg}°)` },
      { label: 'Safety Verdict', value: verdictText },
    ],
  };
}

const audioCache = new Map<string, string>();

export async function fetchDescentAudio(
  site: MarsSite,
  lang: 'ar' | 'en'
): Promise<string | null> {
  const { spokenText } = getDescentNarration(site, lang);
  const cacheKey = `${lang}:${site.id}`;
  if (audioCache.has(cacheKey)) {
    return audioCache.get(cacheKey)!;
  }

  try {
    const res = await fetch('/api/stories/voiceover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: spokenText, language: lang }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.ok && typeof data.audio === 'string') {
      audioCache.set(cacheKey, data.audio);
      return data.audio;
    }
    return null;
  } catch {
    return null;
  }
}