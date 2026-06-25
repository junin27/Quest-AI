import { BaseTriviaBankProvider } from './baseProvider';
import type {
  TriviaBankCategory,
  TriviaBankQuestion,
  TriviaBankFetchOptions,
} from '../../types/triviaBanks.types';
import {
  TRIVIA_CATEGORIES,
  mapDifficultyToTrivia,
  decodeHtmlEntities,
  translateQuestionFields,
} from '../triviaService';

interface OpenTriviaApiResult {
  type: string;
  difficulty: string;
  category: string;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

interface OpenTriviaApiResponse {
  response_code: number;
  results: OpenTriviaApiResult[];
}

const TRIVIA_CODE_SUCCESS = 0;
const TRIVIA_CODE_NO_RESULTS = 1;

export class OpenTriviaBankProvider extends BaseTriviaBankProvider {
  providerName = 'openTrivia' as const;

  async getCategories(): Promise<TriviaBankCategory[]> {
    return TRIVIA_CATEGORIES.map((cat) => ({
      id: `openTrivia_${cat.id}`,
      name: cat.label,
      provider: this.providerName,
      questionCount: undefined,
    }));
  }

  async fetchQuestions(
    options: TriviaBankFetchOptions
  ): Promise<TriviaBankQuestion[]> {
    const categoryId = parseInt(options.categoryId.split('_')[1], 10);
    if (isNaN(categoryId)) {
      return [];
    }

    const difficulty = mapDifficultyToTrivia(options.difficulty || '5');
    const amount = Math.min(options.count, 50);

    const url = `https://opentdb.com/api.php?amount=${amount}&category=${categoryId}&difficulty=${difficulty}&type=multiple`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Falha ao conectar com Open Trivia DB.');
      }

      const apiResponse = (await response.json()) as OpenTriviaApiResponse;

      if (
        apiResponse.response_code === TRIVIA_CODE_NO_RESULTS ||
        apiResponse.response_code !== TRIVIA_CODE_SUCCESS ||
        apiResponse.results.length === 0
      ) {
        return [];
      }

      const decoded = apiResponse.results.map((r) => ({
        question: decodeHtmlEntities(r.question),
        correct_answer: decodeHtmlEntities(r.correct_answer),
        incorrect_answers: r.incorrect_answers.map(decodeHtmlEntities),
      }));

      const translatedFields = await Promise.all(
        decoded.map((r) =>
          translateQuestionFields(r.question, r.correct_answer, r.incorrect_answers)
        )
      );

      return translatedFields.map((fields, index) => ({
        id: `openTrivia-${categoryId}-${index}-${Date.now()}`,
        text: fields.questionText,
        options: fields.options,
        correctIndex: fields.correctOptionIndex,
        provider: this.providerName,
        category: TRIVIA_CATEGORIES.find((c) => c.id === categoryId)?.label || `Categoria ${categoryId}`,
        categoryId: `openTrivia_${categoryId}`,
        difficulty: options.difficulty,
        explanation: `A resposta correta é: "${fields.options[fields.correctOptionIndex]}".`,
      }));
    } catch {
      return [];
    }
  }
}
