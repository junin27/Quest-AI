import { BaseTriviaBankProvider } from './baseProvider';
import type {
  TriviaBankCategory,
  TriviaBankQuestion,
  TriviaBankFetchOptions,
} from '../../types/triviaBanks.types';

interface OfficialJoke {
  id: number;
  type: string;
  setup?: string;
  delivery?: string;
  joke?: string;
  error?: boolean;
}

const JOKE_CATEGORIES = [
  { id: 1, name: 'Piadas Gerais', type: 'general' },
  { id: 2, name: 'Piadas de Programação', type: 'programming' },
  { id: 3, name: 'Piadas Knox', type: 'knock-knock' },
];

export class OfficialJokeApiProvider extends BaseTriviaBankProvider {
  providerName = 'officialJokes' as const;

  async getCategories(): Promise<TriviaBankCategory[]> {
    return JOKE_CATEGORIES.map((cat) => ({
      id: `officialJokes_${cat.id}`,
      name: cat.name,
      provider: this.providerName,
    }));
  }

  async fetchQuestions(
    options: TriviaBankFetchOptions
  ): Promise<TriviaBankQuestion[]> {
    const categoryId = parseInt(options.categoryId.split('_')[1], 10);
    if (isNaN(categoryId) || categoryId < 1 || categoryId > 3) {
      return [];
    }

    const category = JOKE_CATEGORIES[categoryId - 1];
    const questions: TriviaBankQuestion[] = [];

    try {
      const url = `https://official-joke-api.appspot.com/jokes/${category.type}/ten`;
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });

      if (!response.ok) {
        return [];
      }

      const data = (await response.json()) as OfficialJoke[];

      if (!Array.isArray(data)) {
        return [];
      }

      const filtered = data.filter((j) => !j.error);

      for (let i = 0; i < Math.min(filtered.length, options.count); i++) {
        const joke = filtered[i];

        if (joke.setup && joke.delivery) {
          questions.push({
            id: `officialJokes-${categoryId}-${joke.id}-${i}`,
            text: joke.setup,
            options: [
              joke.delivery,
              'Não é engraçado',
              'Desconhecido',
              'Outra resposta',
            ],
            correctIndex: 0,
            provider: this.providerName,
            category: category.name,
            categoryId: options.categoryId,
            difficulty: '1',
            explanation: `A resposta correta é: "${joke.delivery}".`,
          });
        }
      }

      return questions;
    } catch {
      return [];
    }
  }
}
