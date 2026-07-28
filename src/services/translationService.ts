/**
 * Serviço de tradução usando MyMemory API
 * Reutiliza a lógica de tradução do triviaService
 */

const MYMEMORY_QUOTA_WARNING = 'MYMEMORY WARNING';
const translationCache = new Map<string, Promise<string>>();

const LOCAL_DICTIONARY: Record<string, string> = {
  // Categorias em Inglês (normalizadas para minúsculo, com espaços e 'and')
  'science': 'Ciência',
  'people': 'Pessoas',
  'animals': 'Animais',
  'numbers': 'Números',
  'chemistry': 'Química',
  'words': 'Palavras',
  'physics': 'Física',
  'inventions': 'Invenções',
  'biology': 'Biologia',
  'history': 'História',
  'leaders': 'Líderes',
  'war': 'Guerra',
  'russia': 'Rússia',
  'sweden': 'Suécia',
  'china': 'China',
  'continents': 'Continentes',
  'us states': 'Estados dos EUA',
  'borders': 'Fronteiras',
  'mexico': 'México',
  'geography': 'Geografia',
  'nicknames': 'Apelidos',
  'neighbors': 'Vizinhos',
  'cities': 'Cidades',
  'the internet': 'Internet',
  'usa': 'EUA',
  'capital cities': 'Capitais',
  'music albums': 'Álbuns de Música',
  'songs': 'Músicas',
  'bands': 'Bandas',
  'music': 'Música',
  'pseudonyms': 'Pseudônimos',
  'orchestra': 'Orquestra',
  'instrument': 'Instrumento',
  'musicians': 'Músicos',
  'lyrics': 'Letras de Música',
  'film and tv': 'Cinema e TV',
  'film': 'Cinema',
  'acting': 'Atuação',
  'general knowledge': 'Conhecimento Geral',
  'james bond': 'James Bond',
  'academy awards': 'Oscar',
  'tv': 'TV',
  'fictitious characters': 'Personagens Fictícios',
  'quotes': 'Citações',
  'sport': 'Esporte',
  'sports': 'Esportes',
  'colours': 'Cores',
  'games': 'Jogos',
  'basketball': 'Basquete',
  'literature': 'Literatura',
  'buildings': 'Construções',
  'disney': 'Disney',
  'architecture': 'Arquitetura',
  'food': 'Comida',
  'phrases': 'Frases',
  'seafood': 'Frutos do Mar',
  'language': 'Idioma',
  'food and drink': 'Comida e Bebida',
  'presidents': 'Presidentes',
  'sauces': 'Molhos',
  'germany': 'Alemanha',
  'cooking': 'Culinária',
  'france': 'França',
  'drink': 'Bebida',
  'wine': 'Vinho',
  'italy': 'Itália',
  'alcohol': 'Álcool',
  'slang': 'Gíria',
  'society and culture': 'Sociedade e Cultura',
  'christianity': 'Cristianismo',
  'philosophy': 'Filosofia',
  'mythology': 'Mitologia',
  'space': 'Espaço',
  'astrophysics': 'Astrofísica',
  'astronomy': 'Astronomia',
  'disease': 'Doença',
  'diseases': 'Doenças',
  'medicine': 'Medicina',
  'aztecs': 'Astecas',
  'uk': 'Reino Unido',
  'events': 'Eventos',
  'the solar system': 'Sistema Solar',
  'entertainment': 'Entretenimento',
  'dad jokes': 'Piadas de Pai',
  'arts and literature': 'Artes e Literatura',
  'politics': 'Política',
  'books': 'Literatura',
  'musicals and theatres': 'Musicais e Teatro',
  'television': 'Televisão',
  'video games': 'Videogames',
  'videogames': 'Videogames',
  'board games': 'Jogos de Tabuleiro',
  'science and nature': 'Ciência e Natureza',
  'science computers': 'Tecnologia e Computação',
  'science mathematics': 'Matemática',
  'art': 'Arte',
  'celebrities': 'Celebridades',
  'vehicles': 'Veículos',
  'entertainment comics': 'Quadrinhos',
  'science gadgets': 'Gadgets e Tecnologia',
  'entertainment japanese anime and manga': 'Anime e Mangá',
  'entertainment cartoon and animations': 'Desenhos e Animações',

  // Categorias em Português (mapeamento de identidade para evitar chamadas de API)
  'piadas': 'Piadas',
  'piadas sombrias': 'Piadas Sombrias',
  'fatos curiosos': 'Fatos Curiosos',
  'perguntas trivia': 'Perguntas Trivia',
  'citações': 'Citações',
  'piadas de programação': 'Piadas de Programação',
  'fatos matemáticos': 'Fatos Matemáticos',
  'fatos de anos': 'Fatos de Anos',
  'piadas gerais': 'Piadas Gerais',
  'piadas knox': 'Piadas Knox',
  'veículos': 'Veículos',
  'política': 'Política',
  'celebridades': 'Celebridades',
  'quadrinhos': 'Quadrinhos',
  'datas históricas': 'Datas Históricas',
  'gadgets e tecnologia': 'Gadgets e Tecnologia',
  'desenhos e animações': 'Desenhos e Animações',
  'jogos de tabuleiro': 'Jogos de Tabuleiro',
  'conhecimento geral': 'Conhecimento Geral',
  'líderes': 'Líderes',
  'animais': 'Animais',
  'números': 'Números',
  'química': 'Química',
  'palavras': 'Palavras',
  'física': 'Física',
  'invenções': 'Invenções',
  'biologia': 'Biologia',
  'história': 'História',
  'guerra': 'Guerra',
  'continentes': 'Continentes',
  'fronteiras': 'Fronteiras',
  'vizinhos': 'Vizinhos',
  'cidades': 'Cidades',
  'capitais': 'Capitais',
  'músicas': 'Músicas',
  'bandas': 'Bandas',
  'música': 'Música',
  'pseudônimos': 'Pseudônimos',
  'orquestra': 'Orquestra',
  'instrumento': 'Instrumento',
  'músicos': 'Músicos',
  'letras de música': 'Letras de Música',
  'cinema e tv': 'Cinema e TV',
  'cinema': 'Cinema',
  'atuação': 'Atuação',
  'esporte': 'Esporte',
  'esportes': 'Esportes',
  'cores': 'Cores',
  'jogos': 'Jogos',
  'basquete': 'Basquete',
  'literatura': 'Literatura',
  'construções': 'Construções',
  'arquitetura': 'Arquitetura',
  'comida': 'Comida',
  'frases': 'Frases',
  'frutos do mar': 'Frutos do Mar',
  'idioma': 'Idioma',
  'comida e bebida': 'Comida e Bebida',
  'presidentes': 'Presidentes',
  'molhos': 'Molhos',
  'culinária': 'Culinária',
  'bebida': 'Bebida',
  'vinho': 'Vinho',
  'álcool': 'Álcool',
  'gíria': 'Gíria',
  'sociedade e cultura': 'Sociedade e Cultura',
  'cristianismo': 'Cristianismo',
  'filosofia': 'Filosofia',
  'mitologia': 'Mitologia',
  'espaço': 'Espaço',
  'astrofísica': 'Astrofísica',
  'astronomia': 'Astronomia',
  'doença': 'Doença',
  'doenças': 'Doenças',
  'medicina': 'Medicina',
  'astecas': 'Astecas',
  'eventos': 'Eventos',
  'sistema solar': 'Sistema Solar',
  'entretenimento': 'Entretenimento'
};

const PT_REGEX = /[áéíóúâêîôûãõçÁÉÍÓÚÂÊÎÔÛÃÕÇ]/;
const PT_WORDS = new Set([
  'de', 'e', 'o', 'a', 'os', 'as', 'do', 'da', 'dos', 'das', 'para', 'em', 'com', 'um', 'uma',
  'piadas', 'fatos', 'perguntas', 'citações', 'veículos', 'celebridades', 'quadrinhos', 'desenhos',
  'jogos', 'líderes', 'animais', 'números', 'química', 'palavras', 'física', 'invenções', 'biologia',
  'história', 'guerra', 'continentes', 'fronteiras', 'vizinhos', 'cidades', 'capitais', 'músicas',
  'bandas', 'música', 'pseudônimos', 'orquestra', 'instrumento', 'músicos', 'cinema', 'atuação',
  'esporte', 'esportes', 'cores', 'basquete', 'literatura', 'construções', 'arquitetura', 'comida',
  'frases', 'idioma', 'presidentes', 'molhos', 'culinária', 'bebida', 'vinho', 'álcool', 'gíria',
  'sociedade', 'cultura', 'cristianismo', 'filosofia', 'mitologia', 'espaço', 'astrofísica', 'astronomia',
  'doença', 'doenças', 'medicina', 'astecas', 'eventos', 'entretenimento', 'computação', 'tecnologia'
]);

export function translateText(text: string): Promise<string> {
  if (!text || !text.trim()) return Promise.resolve(text);

  // Normalização do texto para busca (minúsculo, sem sublinhados, substitui '&' por 'and', remove espaços múltiplos)
  const cleanKey = text.toLowerCase().trim()
    .replace(/_/g, ' ')
    .replace(/&/g, 'and')
    .replace(/\s+/g, ' ');

  // 1. Verificar dicionário estático local
  if (LOCAL_DICTIONARY[cleanKey]) {
    return Promise.resolve(LOCAL_DICTIONARY[cleanKey]);
  }

  // 2. Verificar se o texto já parece estar em português
  const hasAccents = PT_REGEX.test(text);
  const words = cleanKey.split(' ');
  const hasPtWords = words.some(w => PT_WORDS.has(w));

  if (hasAccents || hasPtWords) {
    return Promise.resolve(text);
  }

  // 3. Verificar cache de promessas (impede concorrência redundante)
  if (translationCache.has(text)) {
    return translationCache.get(text)!;
  }

  // 4. Chamar API externa e salvar a Promessa no cache imediatamente
  const promise = (async () => {
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|pt-BR`;
      const response = await fetch(url, { signal: AbortSignal.timeout(3000) });

      if (!response.ok) {
        console.warn(`[Translation] API MyMemory retornou status de erro ${response.status} para "${text}". Mantendo original.`);
        return text;
      }

      const data = (await response.json()) as { responseData?: { translatedText?: string } };
      const translated = data.responseData?.translatedText ?? '';

      if (!translated || translated.startsWith(MYMEMORY_QUOTA_WARNING)) {
        console.warn(`[Translation] API MyMemory retornou aviso de cota ou resposta vazia para "${text}". Mantendo original.`);
        return text;
      }

      return translated;
    } catch (err: any) {
      console.error(`[Translation] Falha/Timeout na API MyMemory para "${text}":`, err.message || err);
      return text;
    }
  })();

  translationCache.set(text, promise);
  return promise;
}

export async function translateBatch(texts: string[]): Promise<string[]> {
  return Promise.all(texts.map((text) => translateText(text)));
}

export function clearTranslationCache(): void {
  translationCache.clear();
}
