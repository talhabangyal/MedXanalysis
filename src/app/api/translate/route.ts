import { NextResponse } from 'next/server';

const LANGUAGE_CODES: Record<string, string> = {
  English: 'en',
  Urdu: 'ur',
  Spanish: 'es',
  Arabic: 'ar',
  French: 'fr',
  German: 'de',
};

async function translateWithGooglePublic(text: string, targetCode: string): Promise<string> {
  const url = new URL('https://translate.googleapis.com/translate_a/single');
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('sl', 'auto');
  url.searchParams.set('tl', targetCode);
  url.searchParams.set('dt', 't');
  url.searchParams.set('q', text);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google public translate failed: ${body}`);
  }

  const payload = await res.json();
  const translated = Array.isArray(payload?.[0])
    ? payload[0].map((part: any[]) => part?.[0]).filter(Boolean).join('')
    : '';

  if (!translated) {
    throw new Error('Google public translate returned no translated text');
  }

  return translated;
}

async function translateWithLibre(text: string, targetCode: string): Promise<string> {
  const res = await fetch('https://libretranslate.de/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: text,
      source: 'auto',
      target: targetCode,
      format: 'text',
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`LibreTranslate failed: ${body}`);
  }

  const payload = await res.json();
  return payload?.translatedText || text;
}

async function translateWithMyMemory(text: string, targetCode: string): Promise<string> {
  const encoded = encodeURIComponent(text);
  const url = `https://api.mymemory.translated.net/get?q=${encoded}&langpair=en|${targetCode}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`MyMemory failed: ${body}`);
  }

  const payload = await res.json();
  if (payload?.responseStatus === 200 && payload?.responseData?.translatedText) {
    return payload.responseData.translatedText;
  }

  throw new Error('MyMemory returned no translated text');
}

async function translateText(text: string, targetLanguage: string): Promise<string> {
  if (!text || targetLanguage === 'English') return text;

  const targetCode = LANGUAGE_CODES[targetLanguage] || 'en';
  // Free providers only; public Google endpoint is keyless.
  const providers = [translateWithGooglePublic, translateWithLibre, translateWithMyMemory];

  let lastError: unknown;
  for (const provider of providers) {
    try {
      return await provider(text, targetCode);
    } catch (err) {
      lastError = err;
      console.warn('Translation provider failed, trying fallback:', err);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('All translation providers failed');
}

async function translateAnalysisObject(analysis: any, language: string) {
  if (!analysis || language === 'English') return analysis;

  const translated = { ...analysis };

  if (translated.summary) {
    translated.summary = await translateText(String(translated.summary), language);
  }

  if (Array.isArray(translated.key_findings)) {
    translated.key_findings = await Promise.all(
      translated.key_findings.map(async (item: any) => {
        if (typeof item === 'string') {
          return await translateText(item, language);
        }

        return {
          ...item,
          heading: item?.heading ? await translateText(String(item.heading), language) : item?.heading,
          detail: item?.detail ? await translateText(String(item.detail), language) : item?.detail,
          name: item?.name ? await translateText(String(item.name), language) : item?.name,
          description: item?.description ? await translateText(String(item.description), language) : item?.description,
        };
      })
    );
  }

  if (Array.isArray(translated.deficiencies)) {
    translated.deficiencies = await Promise.all(
      translated.deficiencies.map(async (item: any) => ({
        ...item,
        heading: item?.heading ? await translateText(String(item.heading), language) : item?.heading,
        detail: item?.detail ? await translateText(String(item.detail), language) : item?.detail,
        name: item?.name ? await translateText(String(item.name), language) : item?.name,
        description: item?.description ? await translateText(String(item.description), language) : item?.description,
      }))
    );
  }

  if (Array.isArray(translated.recommendations)) {
    translated.recommendations = await Promise.all(
      translated.recommendations.map(async (item: any) => {
        if (typeof item === 'string') {
          return await translateText(item, language);
        }

        return {
          ...item,
          heading: item?.heading ? await translateText(String(item.heading), language) : item?.heading,
          detail: item?.detail ? await translateText(String(item.detail), language) : item?.detail,
          name: item?.name ? await translateText(String(item.name), language) : item?.name,
          description: item?.description ? await translateText(String(item.description), language) : item?.description,
        };
      })
    );
  }

  if (translated.severity && language !== 'English') {
    translated.severity = await translateText(String(translated.severity), language);
  }

  return translated;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { analysis, language } = body;

    if (!analysis || !language) {
      return NextResponse.json(
        { error: 'analysis and language are required' },
        { status: 400 }
      );
    }

    let analysisObject = analysis;
    if (typeof analysis === 'string') {
      try {
        analysisObject = JSON.parse(analysis);
      } catch {
        analysisObject = { summary: analysis, key_findings: [], deficiencies: [], recommendations: [], severity: 'unknown' };
      }
    }

    const translated = await translateAnalysisObject(analysisObject, language);
    return NextResponse.json({ data: translated });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: 'Translation failed' },
      { status: 500 }
    );
  }
}
