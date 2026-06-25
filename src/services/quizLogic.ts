import type { DifficultyLevel } from '../types/quiz.types';

/**
 * Calcula a pontuação obtida em uma única pergunta do quiz.
 * 
 * Exemplo de uso:
 * ```typescript
 * const pontos = calculateQuestionScore(true, 10, 'medium'); // Retorna 170
 * ```
 * 
 * @param isCorrect Se a resposta escolhida foi a correta.
 * @param timeUsed O tempo gasto para responder em segundos (máximo 30).
 * @param difficulty O nível de dificuldade selecionado ('easy', 'medium', 'hard').
 */
export function calculateQuestionScore(
  isCorrect: boolean,
  timeUsed: number,
  difficulty: DifficultyLevel
): number {
  if (!isCorrect) {
    return 0;
  }
  
  const BASE_POINTS = 100;
  const TIME_LIMIT = 30;
  const MAX_TIME_BONUS = 20;
  
  const timeRemaining = Math.max(0, TIME_LIMIT - timeUsed);
  const timeBonus = (timeRemaining / TIME_LIMIT) * MAX_TIME_BONUS;
  
  const multipliers: Record<string, number> = {
    easy: 1,
    medium: 1.5,
    hard: 2
  };
  
  let multiplier = multipliers[difficulty];
  if (multiplier === undefined) {
    const diffNum = parseFloat(difficulty);
    const validDiff = isNaN(diffNum) ? 5 : Math.max(0, Math.min(10, diffNum));
    multiplier = 1 + (validDiff / 10);
  }
  
  return Math.round((BASE_POINTS + timeBonus) * multiplier);
}
