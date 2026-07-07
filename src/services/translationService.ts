/**
 * Serviço de tradução usando MyMemory API
 * Reutiliza a lógica de tradução do triviaService
 */

const MYMEMORY_QUOTA_WARNING = 'MYMEMORY WARNING';
const translationCache = new Map<string, string>();

const LOCAL_DICTIONARY: Record<string, string> = {
  'science': 'ciência',
  'people': 'pessoas',
  'animals': 'animais',
  'numbers': 'números',
  'chemistry': 'química',
  'words': 'palavras',
  'physics': 'física',
  'inventions': 'invenções',
  'biology': 'biologia',
  'history': 'história',
  'leaders': 'líderes',
  'war': 'guerra',
  'russia': 'Rússia',
  'sweden': 'Suécia',
  'china': 'China',
  'continents': 'continentes',
  'us_states': 'estados dos EUA',
  'borders': 'fronteiras',
  'mexico': 'México',
  'geography': 'geografia',
  'nicknames': 'apelidos',
  'neighbors': 'vizinhos',
  'cities': 'cidades',
  'the_internet': 'internet',
  'usa': 'EUA',
  'capital_cities': 'capitais',
  'music_albums': 'álbuns de música',
  'songs': 'músicas',
  'bands': 'bandas',
  'music': 'música',
  'pseudonyms': 'pseudônimos',
  'orchestra': 'orquestra',
  'instrument': 'instrumento',
  'musicians': 'músicos',
  'lyrics': 'letras de música',
  'film_and_tv': 'cinema e TV',
  'film': 'cinema',
  'acting': 'atuação',
  'general_knowledge': 'conhecimento geral',
  'james_bond': 'James Bond',
  'academy_awards': 'Oscar',
  'tv': 'TV',
  'fictitious_characters': 'personagens fictícios',
  'quotes': 'citações',
  'sport': 'esporte',
  'sports': 'esportes',
  'colours': 'cores',
  'games': 'jogos',
  'basketball': 'basquete',
  'literature': 'literatura',
  'buildings': 'construções',
  'disney': 'Disney',
  'architecture': 'arquitetura',
  'food': 'comida',
  'phrases': 'frases',
  'seafood': 'frutos do mar',
  'language': 'idioma',
  'food_and_drink': 'comida e bebida',
  'presidents': 'presidentes',
  'sauces': 'molhos',
  'germany': 'Alemanha',
  'cooking': 'culinária',
  'france': 'França',
  'drink': 'bebida',
  'wine': 'vinho',
  'italy': 'Itália',
  'alcohol': 'álcool',
  'slang': 'gíria',
  'society_and_culture': 'sociedade e cultura',
  'christianity': 'cristianismo',
  'philosophy': 'filosofia',
  'mythology': 'mitologia',
  'space': 'espaço',
  'astrophysics': 'astrofísica',
  'astronomy': 'astronomia',
  'disease': 'doença',
  'diseases': 'doenças',
  'medicine': 'medicina',
  'aztecs': 'astecas',
  'uk': 'Reino Unido',
  'events': 'eventos',
  'the_solar_system': 'sistema solar'
};

export async function translateText(text: string): Promise<string> {
  if (!text || !text.trim()) return text;

  // 1. Verificar dicionário estático local
  const key = text.toLowerCase().trim();
  const normalized = key.replace(/_/g, ' ');
  if (LOCAL_DICTIONARY[key]) {
    return LOCAL_DICTIONARY[key];
  }
  if (LOCAL_DICTIONARY[normalized]) {
    return LOCAL_DICTIONARY[normalized];
  }

  // 2. Verificar cache em memória
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
