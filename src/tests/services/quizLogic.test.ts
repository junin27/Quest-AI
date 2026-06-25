import { describe, it, expect } from 'vitest';
import { calculateQuestionScore } from '../../services/quizLogic';

describe('calculateQuestionScore', () => {
  it('should return 0 when answer is incorrect', () => {
    const score = calculateQuestionScore(false, 10, 'medium');
    expect(score).toBe(0);
  });

  it('should calculate score for correct easy question with 10s used', () => {
    // base 100 + bonus (20 * 20/30) = 100 + 13.33 = 113.33 -> 113 * 1 = 113
    const score = calculateQuestionScore(true, 10, 'easy');
    expect(score).toBe(113);
  });

  it('should apply difficulty multiplier of 1.5 for medium difficulty', () => {
    // (100 + (15/30)*20) * 1.5 = (100 + 10) * 1.5 = 165
    const score = calculateQuestionScore(true, 15, 'medium');
    expect(score).toBe(165);
  });

  it('should apply difficulty multiplier of 2 for hard difficulty', () => {
    // (100 + (30/30)*20) * 2 = 120 * 2 = 240
    const score = calculateQuestionScore(true, 0, 'hard');
    expect(score).toBe(240);
  });

  it('should give minimum points (base * multiplier) when time runs out', () => {
    const score = calculateQuestionScore(true, 30, 'medium');
    expect(score).toBe(150); // 100 * 1.5 = 150
  });

  it('should apply linear numeric multiplier for scale 0 to 10', () => {
    // difficulty '5': multiplier = 1 + 5/10 = 1.5
    const scoreVal5 = calculateQuestionScore(true, 15, '5');
    expect(scoreVal5).toBe(165);

    // difficulty '10': multiplier = 1 + 10/10 = 2.0
    const scoreVal10 = calculateQuestionScore(true, 0, '10');
    expect(scoreVal10).toBe(240);

    // difficulty '0': multiplier = 1 + 0/10 = 1.0
    const scoreVal0 = calculateQuestionScore(true, 30, '0');
    expect(scoreVal0).toBe(100);
  });
});
