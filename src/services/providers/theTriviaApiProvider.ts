import { BaseTriviaBankProvider } from './baseProvider';
import { mapDifficultyScaleToNumber } from '../triviaService';
import type {
  TriviaBankCategory,
  TriviaBankQuestion,
  TriviaBankFetchOptions,
  TriviaBankArea,
} from '../../types/triviaBanks.types';

interface TheTriviaApiQuestion {
  category: string;
  id: string;
  correctAnswer: string;
  incorrectAnswers: string[];
  question: string;
  tags: string[];
  type: string;
  difficulty: string;
  regions: string[];
}

const THE_TRIVIA_CATEGORIES = [
  { id: 1, name: 'Science' },
  { id: 2, name: 'History' },
  { id: 3, name: 'Geography' },
  { id: 4, name: 'Music' },
  { id: 5, name: 'Film' },
  { id: 6, name: 'Sport' },
  { id: 7, name: 'Arts & Literature' },
  { id: 8, name: 'General Knowledge' },
  { id: 9, name: 'Food & Drink' },
  { id: 10, name: 'Society & Culture' },
];

const CATEGORY_MAP: Record<string, string> = {
  'Science': 'science',
  'History': 'history',
  'Geography': 'geography',
  'Music': 'music',
  'Film': 'film',
  'Sport': 'sport',
  'Arts & Literature': 'arts',
  'General Knowledge': 'general',
  'Food & Drink': 'food',
  'Society & Culture': 'society',
};

const STATIC_AREAS: Record<string, string[]> = {
  'science': [
    'Anatomia', 'Medicina', 'Biologia', 'Física', 'Química', 
    'Espaço', 'Astronomia', 'Astrofísica', 'Materiais', 'Sistema Solar', 'Doenças'
  ],
  'history': [
    'Eventos Históricos', 'Primeiros Feitos', 'Medicina', 'História', 'França',
    'Presidentes', 'Líderes', 'Política', 'Europa', 'Rússia', 'Suécia', 'Império Otomano', 'Século XVIII', 'China'
  ],
  'geography': [
    'Continentes', 'Estados dos EUA', 'Fronteiras', 'México', 'Geografia',
    'Apelidos', 'Vizinhos', 'Cidades', 'Internet', 'EUA', 'Capitais'
  ],
  'music': [
    'Álbuns de Música', 'Músicas', 'Anos 1960', 'Bandas', 'Música',
    'Pseudônimos', 'Orquestra', 'Instrumentos', 'Músicos', 'Letras de Música'
  ],
  'film': [
    'Cinema e TV', 'Filmes', 'Atuação', 'Conhecimento Geral', 'James Bond',
    'Prêmios Oscar', 'Programas de TV', 'Personagens Fictícios', 'Citações de Filmes'
  ],
  'sport': [
    'Esporte Geral', 'Sinuca', 'Cores no Esporte', 'Jogos', 'Basquete', 'NBA'
  ],
  'arts': [
    'Artes e Literatura', 'Contos de Fadas', 'Romances Clássicos', 'Literatura',
    'Construções Famosas', 'Disney', 'Arquitetura'
  ],
  'general': [
    'Conhecimento Geral', 'Variados'
  ],
  'food': [
    'Comida', 'Frases sobre Culinária', 'Frutos do Mar', 'Idioma', 'Comidas e Bebidas',
    'Presidentes', 'Molhos', 'Alemanha', 'Culinária', 'França', 'Bebidas', 'Vinho', 'Itália', 'Álcool', 'Gírias'
  ],
  'society': [
    'Sociedade e Cultura', 'Cristianismo', 'Filosofia'
  ]
};

export class TheTriviaApiProvider extends BaseTriviaBankProvider {
  providerName = 'theTriviaApi' as const;
  private areasCache: Map<string, TriviaBankArea[]> = new Map();

  async getCategories(): Promise<TriviaBankCategory[]> {
    const categories = THE_TRIVIA_CATEGORIES.map((cat) => ({
      id: `theTriviaApi_${cat.id}`,
      name: cat.name,
      provider: this.providerName,
    }));

    for (const cat of categories) {
      const areas = await this.fetchAreas(cat.name);
      if (areas.length > 0) {
        (cat as any).areas = areas;
      }
    }

    return categories;
  }

  async fetchQuestions(
    options: TriviaBankFetchOptions
  ): Promise<TriviaBankQuestion[]> {
    const categoryName = Array.from(THE_TRIVIA_CATEGORIES.values()).find(
      (c) => `theTriviaApi_${c.id}` === options.categoryId
    )?.name;

    if (!categoryName) {
      return [];
    }

    const categoryParam = CATEGORY_MAP[categoryName] || categoryName.toLowerCase();

    try {
      let url = `https://the-trivia-api.com/v2/questions?categories=${categoryParam}&limit=${options.count}`;

      if (options.difficulty) {
        url += `&difficulty=${options.difficulty}`;
      }

      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });

      if (!response.ok) {
        return [];
      }

      const data = (await response.json()) as TheTriviaApiQuestion[];
      if (!Array.isArray(data) || data.length === 0) {
        return [];
      }

      return data.map((q, index) => {
        const allOptions = [q.correctAnswer, ...q.incorrectAnswers];
        const shuffled = this.shuffleArray(allOptions);
        const correctIndex = shuffled.indexOf(q.correctAnswer);

        return {
          id: `theTriviaApi-${categoryName}-${q.id}-${index}`,
          text: q.question,
          options: shuffled,
          correctIndex,
          provider: this.providerName,
          category: categoryName,
          categoryId: options.categoryId,
          areaId: options.areaIds?.[0],
          areaName: options.areaIds && options.areaIds.length > 0 ? this.extractAreaName(q.tags) : undefined,
          difficulty: mapDifficultyScaleToNumber(q.difficulty),
          explanation: `A resposta correta é: "${q.correctAnswer}".`,
        };
      });
    } catch {
      return [];
    }
  }

  private async fetchAreas(categoryName: string): Promise<TriviaBankArea[]> {
    const cacheKey = categoryName;
    if (this.areasCache.has(cacheKey)) {
      return this.areasCache.get(cacheKey) || [];
    }

    const categoryParam = CATEGORY_MAP[categoryName] || categoryName.toLowerCase();
    const areaNames = STATIC_AREAS[categoryParam] || [];

    const areas = areaNames.map((name, index) => ({
      id: `theTriviaApi_area_${categoryName}_${index}`,
      name: name,
      provider: this.providerName,
    }));

    this.areasCache.set(cacheKey, areas);
    return areas;
  }

  private extractAreaName(tags: string[]): string {
    return tags && tags.length > 0 ? tags[0] : 'General';
  }
}
