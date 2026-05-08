const LANGUAGE_CODES: Record<string, string> = {
  English: 'en',
  Urdu: 'ur',
  Spanish: 'es',
  Arabic: 'ar',
  French: 'fr',
  German: 'de',
};

interface TranslationResult {
  translatedText: string;
  detectedSourceLanguage?: string;
}

/**
 * Translate text using MyMemory API (free, no authentication required)
 * Handles long texts by splitting into smaller chunks
 * @param text - Text to translate
 * @param targetLanguage - Target language name (e.g., 'Urdu', 'Spanish')
 * @param sourceLanguage - Source language (default: 'English')
 * @returns Translated text
 */
export async function translateText(
  text: string,
  targetLanguage: string = 'English',
  sourceLanguage: string = 'English'
): Promise<string> {
  // If source and target are the same, return original text
  if (sourceLanguage === targetLanguage) {
    return text;
  }

  // If English, return as is
  if (targetLanguage === 'English') {
    return text;
  }

  if (!text || text.trim().length === 0) {
    return text;
  }

  const sourceLangCode = LANGUAGE_CODES[sourceLanguage] || 'en';
  const targetLangCode = LANGUAGE_CODES[targetLanguage] || 'en';

  try {
    // Split text into smaller chunks if needed (API has 500 char limit per request)
    const chunks = [];
    const maxChunkSize = 400;
    
    // Split by sentences to avoid breaking mid-word
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    let currentChunk = '';
    
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxChunkSize && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    const translatedChunks = await Promise.all(
      chunks.map(async (chunk) => {
        const encoded = encodeURIComponent(chunk);
        const url = `https://api.mymemory.translated.net/get?q=${encoded}&langpair=${sourceLangCode}|${targetLangCode}`;

        try {
          const response = await fetch(url);
          const data = await response.json();

          if (data.responseStatus === 200 && data.responseData?.translatedText) {
            return data.responseData.translatedText;
          }
          console.warn(`Translation failed for chunk, returning original`);
          return chunk; // Return original if translation fails
        } catch (error) {
          console.error('MyMemory translation error for chunk:', error);
          return chunk;
        }
      })
    );

    return translatedChunks.join('');
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original text on error
  }
}

/**
 * Translate an entire analysis object
 */
export async function translateAnalysis(
  analysis: any,
  targetLanguage: string = 'English'
): Promise<any> {
  if (targetLanguage === 'English' || !analysis) {
    return analysis;
  }

  try {
    const translated = { ...analysis };

    // Translate summary
    if (translated.summary) {
      translated.summary = await translateText(translated.summary, targetLanguage);
    }

    // Translate key findings
    if (Array.isArray(translated.key_findings)) {
      translated.key_findings = await Promise.all(
        translated.key_findings.map((finding: string) =>
          translateText(finding, targetLanguage)
        )
      );
    }

    // Translate deficiencies
    if (Array.isArray(translated.deficiencies)) {
      translated.deficiencies = await Promise.all(
        translated.deficiencies.map(async (deficiency: any) => ({
          ...deficiency,
          name: await translateText(deficiency.name, targetLanguage),
          description: await translateText(deficiency.description, targetLanguage),
        }))
      );
    }

    // Translate recommendations
    if (Array.isArray(translated.recommendations)) {
      translated.recommendations = await Promise.all(
        translated.recommendations.map((rec: string) =>
          translateText(rec, targetLanguage)
        )
      );
    }

    return translated;
  } catch (error) {
    console.error('Analysis translation error:', error);
    return analysis;
  }
}

export { LANGUAGE_CODES };
