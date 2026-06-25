import React, { useState, useEffect } from 'react';
import type { QuizQuestion, DifficultyLevel } from '../../types/quiz.types';
import { Timer } from '../Common/Timer';
import { Button } from '../Common/Button';
import confetti from 'canvas-confetti';

interface QuestionCardProps {
  question: QuizQuestion;
  questionNumber: number;
  totalQuestions: number;
  difficulty: DifficultyLevel;
  onAnswerSelected: (selectedIndex: number, timeSpent: number, isCorrect: boolean) => void;
  onNextQuestion: () => void;
  isLastQuestion: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  questionNumber,
  totalQuestions,
  difficulty,
  onAnswerSelected,
  onNextQuestion,
  isLastQuestion
}) => {
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Timer countdown logic
  useEffect(() => {
    if (hasSubmitted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [question, hasSubmitted]);

  // Reset local state when question changes
  useEffect(() => {
    setTimeLeft(30);
    setSelectedAnswer(null);
    setHasSubmitted(false);
  }, [question]);

  const handleTimeout = () => {
    setSelectedAnswer(-1); // -1 representing timeout
    setHasSubmitted(true);
    onAnswerSelected(-1, 30, false);
  };

  const handleSelectOption = (idx: number) => {
    if (hasSubmitted) return;
    setSelectedAnswer(idx);
    setHasSubmitted(true);

    const isCorrect = idx === question.correctOptionIndex;
    const timeSpent = 30 - timeLeft;

    if (isCorrect) {
      triggerConfetti();
    }

    onAnswerSelected(idx, timeSpent, isCorrect);
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const optionLabels = ['A', 'B', 'C', 'D'];

  const getOptionStyle = (idx: number) => {
    const isSelected = selectedAnswer === idx;
    const isCorrectOption = question.correctOptionIndex === idx;

    if (!hasSubmitted) {
      return isSelected
        ? 'border-rose-500 bg-rose-500/10 text-white'
        : 'border-slate-800 bg-slate-950/20 text-slate-300 hover:border-slate-700';
    }

    if (isCorrectOption) {
      return 'border-emerald-500 bg-emerald-500/10 text-emerald-300 shadow-lg shadow-emerald-500/5';
    }

    if (isSelected) {
      return 'border-rose-500 bg-rose-500/10 text-rose-300 shadow-lg shadow-rose-500/5';
    }

    return 'border-slate-900 bg-slate-950/10 text-slate-500 opacity-60';
  };

  return (
    <div className="glass-card w-full max-w-2xl p-6 rounded-2xl mx-auto my-6 relative space-y-6">
      {/* Header Info */}
      <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-slate-400">
        <div className="flex items-center gap-2">
          <span>Questão {questionNumber} de {totalQuestions}</span>
          {question.isPopularExam && (
            <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-normal animate-pulse shrink-0">
              🎓 Popular em Provas
            </span>
          )}
        </div>
        <span className="bg-rose-500/10 text-rose-400 px-3 py-1 rounded-full">
          Dificuldade: {difficulty}
        </span>
      </div>

      {/* Timer */}
      <Timer duration={30} timeLeft={timeLeft} />

      {/* Question Text */}
      <h3 className="text-xl font-bold text-white leading-relaxed mt-4">
        {question.questionText}
      </h3>

      {/* Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {question.options.map((option, idx) => (
          <button
            key={idx}
            disabled={hasSubmitted}
            onClick={() => handleSelectOption(idx)}
            className={`flex items-center gap-4 px-5 py-4 rounded-xl border text-left font-semibold text-sm transition-all duration-200 transform ${getOptionStyle(
              idx
            )}`}
          >
            <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-slate-900/40 text-xs font-bold font-mono">
              {optionLabels[idx]}
            </span>
            <span className="flex-1">{option}</span>
          </button>
        ))}
      </div>

      {/* Feedback & Explanation */}
      {hasSubmitted && (
        <div className="bg-slate-950/40 p-5 rounded-xl border border-slate-900 space-y-3 mt-6 animate-fade-in">
          <div className="flex items-center gap-2">
            {selectedAnswer === question.correctOptionIndex ? (
              <span className="text-emerald-400 font-extrabold text-sm uppercase">✓ Resposta Correta</span>
            ) : (
              <span className="text-rose-400 font-extrabold text-sm uppercase">
                {selectedAnswer === -1 ? '⏱ Tempo Esgotado' : '✗ Resposta Incorreta'}
              </span>
            )}
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">{question.explanation}</p>
        </div>
      )}

      {/* Action Button */}
      {hasSubmitted && (
        <div className="flex justify-end pt-2">
          <Button onClick={onNextQuestion} className="w-full md:w-auto">
            {isLastQuestion ? 'Finalizar Quiz' : 'Próxima Questão'}
          </Button>
        </div>
      )}
    </div>
  );
};
export default QuestionCard;
