import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { PREDEFINED_DEMO_QUESTIONS } from './demoQuestions';

export const MarketingSection: React.FC = () => {
  const [demoQuestionIndex, setDemoQuestionIndex] = useState<number>(0);
  const [demoSelectedAnswer, setDemoSelectedAnswer] = useState<number | null>(null);
  const [demoSubmitted, setDemoSubmitted] = useState<boolean>(false);

  const activeQuestion = PREDEFINED_DEMO_QUESTIONS[demoQuestionIndex];

  const handleSelectTopic = (idx: number) => {
    setDemoQuestionIndex(idx);
    setDemoSelectedAnswer(null);
    setDemoSubmitted(false);
  };

  const handleAnswerOption = (idx: number, isCorrect: boolean) => {
    setDemoSelectedAnswer(idx);
    setDemoSubmitted(true);
    if (isCorrect) {
      try {
        const fireConfetti = confetti || (window as any).confetti;
        if (fireConfetti) {
          fireConfetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      } catch (err) {
        console.error("Erro ao disparar confetes na demo:", err);
      }
    }
  };

  return (
    <div className="lg:col-span-6 space-y-8 text-left flex flex-col justify-center">
      <div className="space-y-4">
        <h2 className="text-4xl lg:text-5xl font-black text-white leading-none tracking-tight">
          DESAFIE SUA MENTE COM <span className="bg-gradient-to-r from-rose-500 via-red-500 to-orange-400 bg-clip-text text-transparent">INTELIGÊNCIA ARTIFICIAL</span>
        </h2>
        <p className="text-slate-300 text-sm lg:text-base leading-relaxed max-w-lg font-medium">
          A primeira plataforma de estudo interativo que gera perguntas dinâmicas e personalizadas em segundos sobre qualquer assunto do universo.
        </p>
      </div>

      {/* Grid de Estatísticas e Destaques Unificados */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg border-y border-slate-800/50 py-4 my-2">
        <div className="text-center p-2.5 rounded-xl bg-slate-950/20 border border-slate-900/40">
          <div className="text-base lg:text-lg font-black bg-gradient-to-r from-rose-400 to-orange-400 bg-clip-text text-transparent tracking-tight">+15.000</div>
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Quizzes Criados</div>
        </div>
        <div className="text-center p-2.5 rounded-xl bg-slate-950/20 border border-slate-900/40">
          <div className="text-base lg:text-lg font-black bg-gradient-to-r from-rose-400 to-orange-400 bg-clip-text text-transparent tracking-tight">99.8%</div>
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Acurácia da IA</div>
        </div>
        <div className="text-center p-2.5 rounded-xl bg-slate-950/20 border border-slate-900/40">
          <div className="text-base lg:text-lg font-black bg-gradient-to-r from-rose-400 to-orange-400 bg-clip-text text-transparent tracking-tight">3 seg</div>
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Geração Instantânea</div>
        </div>
        <div className="text-center p-2.5 rounded-xl bg-slate-950/20 border border-slate-900/40">
          <div className="text-base lg:text-lg font-black bg-gradient-to-r from-rose-400 to-orange-400 bg-clip-text text-transparent tracking-tight">Geração em 3s</div>
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Perguntas na hora</div>
        </div>
        <div className="text-center p-2.5 rounded-xl bg-slate-950/20 border border-slate-900/40">
          <div className="text-base lg:text-lg font-black bg-gradient-to-r from-rose-400 to-orange-400 bg-clip-text text-transparent tracking-tight">IA Inteligente</div>
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Dicas e explicações</div>
        </div>
        <div className="text-center p-2.5 rounded-xl bg-slate-950/20 border border-slate-900/40">
          <div className="text-base lg:text-lg font-black bg-gradient-to-r from-rose-400 to-orange-400 bg-clip-text text-transparent tracking-tight">Placar Global</div>
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Compita em tempo real</div>
        </div>
        <div className="text-center p-2.5 rounded-xl bg-slate-950/20 border border-slate-900/40 col-span-2 sm:col-span-1">
          <div className="text-base lg:text-lg font-black bg-gradient-to-r from-rose-400 to-orange-400 bg-clip-text text-transparent tracking-tight">Criptografia Local</div>
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Proteção com AES-256</div>
        </div>
      </div>

      <div className="pt-1">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
          Selecione um tema para testar o simulador:
        </p>
      </div>

      {/* Pool de Temas com ícones SVG profissionais */}
      <div className="flex flex-wrap gap-2 max-w-lg">
        {PREDEFINED_DEMO_QUESTIONS.map((q, idx) => {
          const isActive = demoQuestionIndex === idx;
          return (
            <button
              key={q.topic}
              onClick={() => handleSelectTopic(idx)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all duration-300 group cursor-pointer ${
                isActive
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 scale-105 shadow-md shadow-rose-500/5'
                  : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {q.icon()}
              <span>{q.topic}</span>
            </button>
          );
        })}
      </div>

      {/* Mockup Interativo Real e Jogável */}
      <div className="relative max-w-md w-full bg-slate-950/80 border border-slate-850 rounded-2xl p-5 shadow-2xl transform lg:-rotate-2 hover:rotate-0 transition-transform duration-500 overflow-hidden group animate-fade-in">
        {/* Brilho de Decoração */}
        <div className="absolute -right-20 -top-20 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-rose-500/20 transition-all duration-500" />
        
        <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 uppercase tracking-widest border-b border-slate-900 pb-2.5 mb-3.5">
          <span>TÓPICO: {activeQuestion.topic}</span>
          <span className="text-rose-400 font-bold">Dificuldade: {activeQuestion.difficulty}/10</span>
        </div>
        
        <p className="text-sm font-bold text-slate-200 leading-snug mb-4">
          {activeQuestion.questionText}
        </p>
        
        <div className="space-y-2">
          {activeQuestion.options.map((option, idx) => {
            const isSelected = demoSelectedAnswer === idx;
            const isCorrectOption = activeQuestion.correctOptionIndex === idx;
            
            let optionStyle = "border-slate-800 bg-slate-900/40 text-slate-300 hover:border-rose-500/35 hover:bg-rose-500/5 cursor-pointer";
            if (demoSubmitted) {
              if (isCorrectOption) {
                optionStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-300 shadow-inner";
              } else if (isSelected) {
                optionStyle = "border-rose-500 bg-rose-500/10 text-rose-300 shadow-inner";
              } else {
                optionStyle = "border-slate-900 bg-slate-950/20 text-slate-600 opacity-50";
              }
            }
            
            return (
              <button
                key={idx}
                disabled={demoSubmitted}
                onClick={() => handleAnswerOption(idx, isCorrectOption)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left text-xs font-bold transition-all duration-200 ${optionStyle}`}
              >
                <span className={`w-5 h-5 flex items-center justify-center rounded font-mono text-[9px] font-black ${
                  demoSubmitted && isCorrectOption ? 'bg-emerald-500 text-white' :
                  demoSubmitted && isSelected ? 'bg-rose-500 text-white' :
                  'bg-slate-900 text-slate-500'
                }`}>
                  {['A', 'B', 'C'][idx]}
                </span>
                <span>{option}</span>
              </button>
            );
          })}
        </div>

        {/* Explicação e Feedback */}
        {demoSubmitted && (
          <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-900 space-y-1.5 mt-4 animate-fade-in text-[11px] leading-relaxed">
            <div className="flex items-center gap-1.5">
              {demoSelectedAnswer === activeQuestion.correctOptionIndex ? (
                <span className="text-emerald-400 font-black uppercase text-[10px] tracking-wider">✓ Resposta Correta</span>
              ) : (
                <span className="text-rose-400 font-black uppercase text-[10px] tracking-wider">✗ Resposta Incorreta</span>
              )}
            </div>
            <p className="text-slate-400">
              {activeQuestion.explanation}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
