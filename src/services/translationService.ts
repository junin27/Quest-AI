/**
 * Serviço de tradução usando MyMemory API
 * Reutiliza a lógica de tradução do triviaService
 */

const MYMEMORY_QUOTA_WARNING = 'MYMEMORY WARNING';
const translationCache = new Map<string, string>();

export async function translateText(text: string): Promise<string> {
  if (!text || !text.trim()) return text;

  // Verificar cache
  if (translationCache.has(text)) {
    return translationCache.get(text)!;
  }

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|pt-BR`;
    const response = await fetch(url, { signal: AbortSignal.timeout(3000) });

    if (!response.ok) {
      translationCache.set(text, text);
      return text;
    }

    const data = (await response.json()) as { responseData?: { translatedText?: string } };
    const translated = data.responseData?.translatedText ?? '';

    if (!translated || translated.startsWith(MYMEMORY_QUOTA_WARNING)) {
      translationCache.set(text, text);
      return text;
    }

    translationCache.set(text, translated);
    return translated;
  } catch {
    translationCache.set(text, text);
    return text;
  }
}

export async function translateBatch(texts: string[]): Promise<string[]> {
  return Promise.all(texts.map((text) => translateText(text)));
}

export function clearTranslationCache(): void {
  translationCache.clear();
}
