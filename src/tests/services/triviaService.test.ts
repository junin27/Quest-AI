import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  mapDifficultyToTrivia,
  decodeHtmlEntities,
  shuffleOptionsWithCorrectTracking,
  translateText,
  fetchTriviaQuestions,
} from '../../services/triviaService';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

afterEach(() => {
  mockFetch.mockReset();
});

describe('mapDifficultyToTrivia', () => {
  it('mapeia dificuldades baixas (< 5) ou inválidas para "easy"', () => {
    expect(mapDifficultyToTrivia('3')).toBe('easy');
    expect(mapDifficultyToTrivia('abc')).toBe('easy');
    expect(mapDifficultyToTrivia('1')).toBe('easy');
  });

  it('mapeia dificuldades médias (5 ou 6) para "medium"', () => {
    expect(mapDifficultyToTrivia('5')).toBe('medium');
    expect(mapDifficultyToTrivia('6')).toBe('medium');
  });

  it('mapeia dificuldades altas (>= 7) para "hard"', () => {
    expect(mapDifficultyToTrivia('7')).toBe('hard');
    expect(mapDifficultyToTrivia('10')).toBe('hard');
  });
});

describe('decodeHtmlEntities', () => {
  it('decodifica entidades HTML corretamente em ambiente DOM', () => {
    // Como vitest roda em ambiente happy-dom (conforme vite.config.ts), o DOM está disponível.
    expect(decodeHtmlEntities('Hello &amp; World')).toBe('Hello & World');
    expect(decodeHtmlEntities('It&#039;s &quot;fine&quot;')).toBe("It's \"fine\"");
    expect(decodeHtmlEntities('A &lt; B &gt; C')).toBe('A < B > C');
  });
});

describe('shuffleOptionsWithCorrectTracking', () => {
  it('embaralha as opções e localiza o índice correto corretamente', () => {
    const correct = 'Alternativa Correta';
    const incorrects = ['Incorreta 1', 'Incorreta 2', 'Incorreta 3'];

    const result = shuffleOptionsWithCorrectTracking(correct, incorrects);

    expect(result.options).toHaveLength(4);
    expect(result.options).toContain(correct);
    expect(result.options[result.correctOptionIndex]).toBe(correct);
  });
});

describe('translateText', () => {
  it('traduz texto com sucesso usando MyMemory API', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ responseData: { translatedText: 'Olá Mundo' } }),
    });

    const result = await translateText('Hello World');
    expect(result).toBe('Olá Mundo');
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('api.mymemory.translated.net'));
  });

  it('retorna o texto original em inglês como fallback quando MyMemory retorna cota esgotada', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ responseData: { translatedText: 'MYMEMORY WARNING: LIMIT EXCEEDED' } }),
    });

    const result = await translateText('Hello World');
    expect(result).toBe('Hello World');
  });

  it('retorna o texto original em inglês como fallback quando MyMemory falha', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Erro de Conexão'));

    const result = await translateText('Hello World');
    expect(result).toBe('Hello World');
  });
});

describe('fetchTriviaQuestions', () => {
  const mockTriviaResponse = {
    response_code: 0,
    results: [
      {
        type: 'multiple',
        difficulty: 'easy',
        category: 'Computers',
        question: 'What does CPU stand for?',
        correct_answer: 'Central Processing Unit',
        incorrect_answers: [
          'Computer Personal Unit',
          'Central Processor Unified',
          'Central Process Utility',
        ],
      },
    ],
  };

  it('busca e mapeia questões com sucesso no caso feliz (com tradução mockada)', async () => {
    // 1º Mock para Open Trivia DB
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTriviaResponse),
    });

    // 5 Mocks subsequentes para as 5 chamadas de tradução de translateQuestionFields:
    // 1 da pergunta, 1 da resposta certa, 3 das incorretas
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ responseData: { translatedText: 'O que significa CPU?' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ responseData: { translatedText: 'Unidade Central de Processamento' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ responseData: { translatedText: 'Unidade Pessoal de Computador' } })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ responseData: { translatedText: 'Processador Central Unificado' } })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ responseData: { translatedText: 'Utilitário de Processo Central' } })
      });

    const questions = await fetchTriviaQuestions(18, '3', 5);

    expect(questions).toHaveLength(1);
    expect(questions[0].id).toContain('trivia-18-0-');
    expect(questions[0].questionText).toBe('O que significa CPU?');
    expect(questions[0].options).toContain('Unidade Central de Processamento');
    expect(questions[0].options[questions[0].correctOptionIndex]).toBe('Unidade Central de Processamento');
    expect(questions[0].explanation).toContain('Unidade Central de Processamento');
  });

  it('limita a quantidade máxima para TRIVIA_MAX_QUESTIONS (50)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ response_code: 0, results: [] }),
    });

    try {
      await fetchTriviaQuestions(18, '3', 99);
    } catch {
      // Ignora erro de resultados vazios nos testes
    }

    // A URL deve conter amount=50
    expect(mockFetch.mock.calls[0][0]).toContain('amount=50');
  });

  it('lança erro específico de limite/sem resultados quando response_code é 1', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ response_code: 1, results: [] }),
    });

    await expect(fetchTriviaQuestions(18, '3', 5)).rejects.toThrow(
      /Não há questões suficientes nesta categoria/
    );
  });

  it('lança erro amigável se a API do Trivia retornar status não-200', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    await expect(fetchTriviaQuestions(18, '3', 5)).rejects.toThrow(
      /Falha ao conectar com o banco de questões/
    );
  });
});
