import { BaseTriviaBankProvider } from './baseProvider';
import type {
  TriviaBankCategory,
  TriviaBankQuestion,
  TriviaBankFetchOptions,
} from '../../types/triviaBanks.types';

const NUMBERS_CATEGORIES = [
  { id: 1, name: 'Trivia de Números', type: 'trivia' },
  { id: 2, name: 'Fatos Matemáticos', type: 'math' },
  { id: 3, name: 'Datas Históricas', type: 'date' },
  { id: 4, name: 'Fatos de Anos', type: 'year' },
];

export class NumbersApiProvider extends BaseTriviaBankProvider {
  providerName = 'numbersApi' as const;

  async getCategories(): Promise<TriviaBankCategory[]> {
    return NUMBERS_CATEGORIES.map((cat) => ({
      id: `numbersApi_${cat.id}`,
      name: cat.name,
      provider: this.providerName,
    }));
  }

  async fetchQuestions(
    options: TriviaBankFetchOptions
  ): Promise<TriviaBankQuestion[]> {
    const categoryId = parseInt(options.categoryId.split('_')[1], 10);
    if (isNaN(categoryId) || categoryId < 1 || categoryId > 4) {
      return [];
    }

    const category = NUMBERS_CATEGORIES[categoryId - 1];
    const questions: TriviaBankQuestion[] = [];

    try {
      for (let i = 0; i < options.count; i++) {
        const number = Math.floor(Math.random() * 1000);
        const url = `https://numbersapi.com/${number}/${category.type}?json`;

        try {
          const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
          if (!response.ok) continue;

          const data = (await response.json()) as { text?: string; found?: boolean };

          if (data.text && data.found) {
            questions.push({
              id: `numbersApi-${categoryId}-${number}-${i}`,
              text: `Qual é o fato sobre ${number}? "${data.text}"`,
              options: [
                data.text,
                'Desconhecido',
                'Não aplicável',
                'Nenhuma das opções',
              ],
              correctIndex: 0,
              provider: this.providerName,
              category: category.name,
              categoryId: options.categoryId,
              difficulty: '3',
              explanation: `A resposta correta é: "${data.text}".`,
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
