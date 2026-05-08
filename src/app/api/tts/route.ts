import { NextResponse } from 'next/server';

const LANGUAGE_CODES: Record<string, string> = {
  English: 'en',
  Urdu: 'ur',
  Spanish: 'es',
  Arabic: 'ar',
  French: 'fr',
  German: 'de',
};

type TTSResult = {
  mimeType: string;
  audioBase64: string;
  provider: string;
};

async function ttsWithGooglePublic(text: string, language: string): Promise<TTSResult> {
  const languageCode = LANGUAGE_CODES[language] || 'en';
  const url = new URL('https://translate.googleapis.com/translate_tts');
  url.searchParams.set('ie', 'UTF-8');
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('q', text);
  url.searchParams.set('tl', languageCode);
  url.searchParams.set('ttsspeed', '1');

  const res = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'Mozilla/5.0',
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google public TTS failed: ${body}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');

  return {
    mimeType: 'audio/mpeg',
    audioBase64: base64,
    provider: 'google-public-tts',
  };
}

function splitTextForSpeech(text: string, maxLength = 160): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return [normalized];

  const chunks: string[] = [];
  let current = '';

  for (const sentence of normalized.split(/(?<=[.!?۔؟])\s+/)) {
    if (!sentence) continue;

    if ((current + ' ' + sentence).trim().length <= maxLength) {
      current = `${current} ${sentence}`.trim();
      continue;
    }

    if (current) chunks.push(current);
    if (sentence.length <= maxLength) {
      current = sentence;
      continue;
    }

    for (let index = 0; index < sentence.length; index += maxLength) {
      const part = sentence.slice(index, index + maxLength).trim();
      if (part) chunks.push(part);
    }
    current = '';
  }

  if (current) chunks.push(current);
  return chunks;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const text = String(body?.text || '').trim();
    const language = String(body?.language || 'English');

    if (!text) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

    try {
      const chunks = splitTextForSpeech(text);
      const audioParts: Buffer[] = [];

      for (const chunk of chunks) {
        const result = await ttsWithGooglePublic(chunk, language);
        audioParts.push(Buffer.from(result.audioBase64, 'base64'));
      }

      const audioBuffer = Buffer.concat(audioParts);
      return NextResponse.json({
        data: {
          audioUrl: `data:audio/mpeg;base64,${audioBuffer.toString('base64')}`,
          provider: 'google-public-tts',
        },
      });
    } catch (err) {
      console.warn('Google public TTS failed:', err);
      throw err instanceof Error ? err : new Error('Google public TTS failed');
    }
  } catch (error) {
    console.error('TTS error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate audio' },
      { status: 500 }
    );
  }
}
