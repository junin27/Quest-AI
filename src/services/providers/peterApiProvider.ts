import { BaseTriviaBankProvider } from './baseProvider';
import type {
  TriviaBankCategory,
  TriviaBankQuestion,
  TriviaBankFetchOptions,
} from '../../types/triviaBanks.types';

interface PeterApiResponse {
  data: string;
  error?: string;
}

const PETER_CATEGORIES = [
  { id: 1, name: 'Piadas', endpoint: '/api/joke' },
  { id: 2, name: 'Piadas Sombrias', endpoint: '/api/darkjoke' },
  { id: 3, name: 'Fatos Curiosos', endpoint: '/api/fact' },
  { id: 4, name: 'Perguntas Trivia', endpoint: '/api/question' },
  { id: 5, name: 'Citações', endpoint: '/api/quote' },
];

export class PeterApiProvider extends BaseTriviaBankProvider {
  providerName = 'peterApi' as const;

  async getCategories(): Promise<TriviaBankCategory[]> {
    return PETER_CATEGORIES.map((cat) => ({
      id: `peterApi_${cat.id}`,
      name: cat.name,
      provider: this.providerName,
    }));
  }

  async fetchQuestions(
    options: TriviaBankFetchOptions
  ): Promise<TriviaBankQuestion[]> {
    const categoryId = parseInt(options.categoryId.split('_')[1], 10);
    if (isNaN(categoryId) || categoryId < 1 || categoryId > 5) {
      return [];
    }

    const category = PETER_CATEGORIES[categoryId - 1];
    const questions: TriviaBankQuestion[] = [];

    try {
      for (let i = 0; i < options.count; i++) {
        try {
          const response = await fetch(
            `https://api.api-ninjas.com/v1/riddles${category.endpoint.replace('/api', '')}`,
            { signal: AbortSignal.timeout(3000) }
          );

          if (!response.ok) continue;

          const data = (await response.json()) as PeterApiResponse;

          if (data.data) {
            questions.push({
              id: `peterApi-${categoryId}-${i}`,
              text: `${category.name}: ${data.data}`,
              options: [
                data.data,
                'Desconhecido',
                'Não sei',
                'Indefinido',
              ],
              correctIndex: 0,
              provider: this.providerName,
              category: category.name,
              categoryId: options.categoryId,
              difficulty: '2',
              explanation: `A resposta correta é: "${data.data}".`,
            });
          }
        } catch {
          continue;
        }
      }

      return questions;
    } catch {
      return [];
    }
  }
}
