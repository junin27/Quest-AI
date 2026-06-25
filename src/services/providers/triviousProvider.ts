import { BaseTriviaBankProvider } from './baseProvider';
import type {
  TriviaBankCategory,
  TriviaBankQuestion,
  TriviaBankFetchOptions,
} from '../../types/triviaBanks.types';

interface TriviousQuestion {
  question: string;
  value: number;
  airdate: string;
  answer: string;
  id: number;
  category_id: number;
}

interface TriviousCategory {
  id: number;
  title: string;
}

const CACHE_DURATION = 3600000;
let categoriesCache: TriviaBankCategory[] | null = null;
let cacheTimestamp = 0;

export class TriviousProvider extends BaseTriviaBankProvider {
  providerName = 'trivious' as const;

  async getCategories(): Promise<TriviaBankCategory[]> {
    const now = Date.now();
    if (categoriesCache && now - cacheTimestamp < CACHE_DURATION) {
      return categoriesCache;
    }

    try {
      const categories: TriviaBankCategory[] = [];
      const BATCH_SIZE = 50;
      const MAX_REQUESTS = 200;

      for (let i = 0; i < MAX_REQUESTS; i++) {
        const url = `https://trivia.connorsmyth.com/api/categories?start=${i * BATCH_SIZE}&limit=${BATCH_SIZE}`;

        try {
          const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
          if (!response.ok) break;

          const data = (await response.json()) as TriviousCategory[];
          if (!data || data.length === 0) break;

          categories.push(
            ...data.map((cat) => ({
              id: `trivious_${cat.id}`,
              name: cat.title,
              provider: this.providerName,
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
      const url = `https://trivia.connorsmyth.com/api/questions?category=${categoryId}&limit=${options.count}`;
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });

      if (!response.ok) {
        return [];
      }

      const data = (await response.json()) as TriviousQuestion[];
      if (!Array.isArray(data) || data.length === 0) {
        return [];
      }

      const filtered = data.filter((q) => q.question && q.answer);
      const shuffled = this.shuffleArray(filtered);
      const selected = shuffled.slice(0, options.count);

      return selected.map((q, index) => ({
        id: `trivious-${categoryId}-${q.id}-${index}`,
        text: q.question,
        options: this.generateMultipleChoice(q.answer),
        correctIndex: 0,
        provider: this.providerName,
        category: 'Trivia Jeopardy',
        categoryId: options.categoryId,
        difficulty: this.mapValueToDifficulty(q.value),
        explanation: `A resposta correta é: "${q.answer}".`,
      }));
    } catch {
      return [];
    }
  }

  private generateMultipleChoice(correctAnswer: string): string[] {
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

  private mapValueToDifficulty(value: number): string {
    if (value <= 200) return '3';
    if (value <= 400) return '5';
    if (value <= 800) return '7';
    return '9';
  }
}
