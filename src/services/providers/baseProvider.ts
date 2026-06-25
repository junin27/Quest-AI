import type {
  TriviaBankProvider,
  TriviaBankCategory,
  TriviaBankQuestion,
  TriviaBankFetchOptions,
} from '../../types/triviaBanks.types';

export abstract class BaseTriviaBankProvider {
  abstract providerName: TriviaBankProvider;

  abstract getCategories(): Promise<TriviaBankCategory[]>;

  abstract fetchQuestions(
    options: TriviaBankFetchOptions
  ): Promise<TriviaBankQuestion[]>;

  protected normalizeText(text: string): string {
    return text
      .trim()
      .toLowerCase()
      .replace(/[^\w\s]/g, '');
  }

  protected shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
