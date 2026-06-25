import { BaseTriviaBankProvider } from './baseProvider';
import type {
  TriviaBankCategory,
  TriviaBankQuestion,
  TriviaBankFetchOptions,
} from '../../types/triviaBanks.types';

interface DadJoke {
  id: string;
  joke: string;
  status: number;
}

export class DadJokesApiProvider extends BaseTriviaBankProvider {
  providerName = 'dadJokes' as const;

  async getCategories(): Promise<TriviaBankCategory[]> {
    return [
      {
        id: 'dadJokes_1',
        name: 'Dad Jokes',
        provider: this.providerName,
      },
    ];
  }

  async fetchQuestions(
    options: TriviaBankFetchOptions
  ): Promise<TriviaBankQuestion[]> {
    if (!options.categoryId.startsWith('dadJokes_')) {
      return [];
    }

    const questions: TriviaBankQuestion[] = [];

    try {
      for (let i = 0; i < options.count; i++) {
        try {
          const response = await fetch('https://icanhazdadjoke.com/api', {
            signal: AbortSignal.timeout(3000),
          });

          if (!response.ok) continue;

          const data = (await response.json()) as DadJoke;

          if (data.joke) {
            const parts = this.parseJoke(data.joke);
            if (parts) {
              questions.push({
                id: `dadJokes-${data.id}-${i}`,
                text: parts.setup,
                options: [
                  parts.punchline,
                  'Não é engraçado',
                  'Infeliz',
                  'Diferente',
                ],
                correctIndex: 0,
                provider: this.providerName,
                category: 'Dad Jokes',
                categoryId: options.categoryId,
                difficulty: '1',
                explanation: `A resposta correta é: "${parts.punchline}".`,
              });
            }
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

  private parseJoke(joke: string): { setup: string; punchline: string } | null {
    const parts = joke.split('.');
    if (parts.length >= 2) {
      return {
        setup: parts[0].trim() + '?',
        punchline: parts.slice(1).join('.').trim(),
      };
    }

    if (joke.includes('?')) {
      const [setup, ...rest] = joke.split('?');
      return {
        setup: setup + '?',
        punchline: rest.join('?').trim(),
      };
    }

    return null;
  }
}
