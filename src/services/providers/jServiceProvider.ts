import { BaseTriviaBankProvider } from './baseProvider';
import type {
  TriviaBankCategory,
  TriviaBankQuestion,
  TriviaBankFetchOptions,
} from '../../types/triviaBanks.types';

interface JServiceCategory {
  id: number;
  title: string;
  clues_count: number;
}

interface JServiceClue {
  id: number;
  answer: string;
  question: string;
  value: number | null;
  airdate: string;
  category_id: number;
  game_id: number;
  invalid_count: number | null;
  valid_answer_count: number | null;
}

const CACHE_DURATION = 3600000; // 1 hora
let categoriesCache: TriviaBankCategory[] | null = null;
let cacheTimestamp = 0;

export class JServiceProvider extends BaseTriviaBankProvider {
  providerName = 'jService' as const;

  async getCategories(): Promise<TriviaBankCategory[]> {
    const now = Date.now();
    if (categoriesCache && now - cacheTimestamp < CACHE_DURATION) {
      return categoriesCache;
    }

    try {
      const categories: TriviaBankCategory[] = [];
      const BATCH_SIZE = 100;
      const MAX_OFFSET = 18300;

      for (let offset = 0; offset < MAX_OFFSET; offset += BATCH_SIZE) {
        const url = `http://jservice.io/api/categories?count=${BATCH_SIZE}&offset=${offset}`;

        try {
          const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
          if (!response.ok) break;

          const data = (await response.json()) as JServiceCategory[];
          if (!data || data.length === 0) break;

          categories.push(
            ...data.map((cat) => ({
              id: `jService_${cat.id}`,
              name: cat.title,
              provider: this.providerName,
              questionCount: cat.clues_count,
            }))
          );
        } catch {
          break;
        }
      }

      categoriesCache = categories;
      cacheTimestamp = now;
      return categories;
    } catch {
      return [];
    }
  }

  async fetchQuestions(
    options: TriviaBankFetchOptions
  ): Promise<TriviaBankQuestion[]> {
    const categoryId = parseInt(options.categoryId.split('_')[1], 10);
    if (isNaN(categoryId)) {
      return [];
    }

    try {
      const url = `http://jservice.io/api/category?id=${categoryId}`;
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });

      if (!response.ok) {
        return [];
      }

      const data = (await response.json()) as { title?: string; clues: JServiceClue[] };
      if (!data.clues || data.clues.length === 0) {
        return [];
      }

      const filtered = data.clues.filter(
        (clue) => clue.question && clue.answer && clue.question.trim() && clue.answer.trim()
      );

      const shuffled = this.shuffleArray(filtered);
      const selected = shuffled.slice(0, options.count);

      return selected.map((clue, index) => ({
        id: `jService-${categoryId}-${clue.id}-${index}`,
        text: clue.question,
        options: this.generateMultipleChoice(clue.answer, categoryId),
        correctIndex: 0,
        provider: this.providerName,
        category: data.title || `Categoria ${categoryId}`,
        categoryId: options.categoryId,
        difficulty: this.mapValueToDifficulty(clue.value),
        explanation: `A resposta correta é: "${clue.answer}".`,
      }));
    } catch {
      return [];
    }
  }

  private generateMultipleChoice(correctAnswer: string, _categoryId: number): string[] {
    const options = [correctAnswer];
    const fakeAnswers = [
      'Desconhecido',
      'Não especificado',
      'Indefinido',
      'Não documentado',
      'Inválido',
      'Nenhuma das opções',
      'Sem informação',
      'Não aplicável',
    ];

    for (let i = 0; i < 3 && options.length < 4; i++) {
      const fake = fakeAnswers[Math.floor(Math.random() * fakeAnswers.length)];
      if (!options.includes(fake)) {
        options.push(fake);
      }
    }

    return this.shuffleArray(options);
  }

  private mapValueToDifficulty(value: number | null): string {
    if (!value) return '5';
    if (value <= 200) return '3';
    if (value <= 400) return '5';
    if (value <= 800) return '7';
    return '9';
  }
}
