import React from 'react';
import type { User } from '../../types/user.types';

interface HeaderProps {
  currentUser: User | null;
  onTitleClick: () => void;
  onNavigateToProfile: () => void;
  onNavigateToRooms: () => void;
  onNavigateToHistory: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onTitleClick,
  onNavigateToProfile,
  onNavigateToRooms,
  onNavigateToHistory,
  onLogout
}) => {
  const isApiKeyActive = currentUser && (
    currentUser.apiKey || (
      localStorage.getItem('quiz_app_global_api_key') &&
      localStorage.getItem('quiz_app_global_api_key') !== 'mock-key-for-testing'
    )
  );

  const activeProvider = (
    currentUser?.apiKey?.provider ||
    localStorage.getItem('quiz_app_global_api_provider') ||
    'gemini'
  );

  const getProviderLabel = (prov: string): string => {
    const labels: Record<string, string> = {
      gemini: 'Gemini',
      openai: 'OpenAI',
      anthropic: 'Anthropic',
      deepseek: 'DeepSeek',
      groq: 'Groq',
      mistral: 'Mistral',
      openrouter: 'OpenRouter'
    };
    return labels[prov.toLowerCase()] || prov;
  };

  return (
    <header className="glass-panel w-full px-6 py-4 flex flex-col sm:flex-row justify-between items-center shadow-lg border-b border-slate-800/50 gap-4">
      <h1
        onClick={onTitleClick}
        className="text-xl font-extrabold bg-gradient-to-r from-rose-500 via-red-500 to-orange-400 bg-clip-text text-transparent tracking-wide cursor-pointer m-0 flex items-center gap-2"
      >
        ❓ Quiz Inteligente com IA
      </h1>
      {currentUser && (
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4 sm:gap-5 text-xs font-semibold">
          {/* Navegação Rápida */}
          <button
            onClick={onTitleClick}
            className="text-slate-400 hover:text-rose-400 transition-all duration-300 cursor-pointer flex items-center gap-1.5 group shrink-0"
          >
            <span>Novo Quiz</span>
          </button>

          <button
            onClick={onNavigateToRooms}
            className="text-slate-400 hover:text-rose-400 transition-all duration-300 cursor-pointer flex items-center gap-1.5 group shrink-0"
          >
            <span>Salas</span>
          </button>

          <button
            onClick={onNavigateToHistory}
            className="text-slate-400 hover:text-rose-400 transition-all duration-300 cursor-pointer flex items-center gap-1.5 group shrink-0"
          >
            <span>Histórico</span>
          </button>

          <button
            onClick={onNavigateToProfile}
            className="text-slate-350 hover:text-rose-300 transition-all duration-300 cursor-pointer flex items-center gap-1.5 group shrink-0 border-l border-slate-800 pl-4"
          >
            <svg className="w-3.5 h-3.5 text-slate-450 group-hover:text-rose-300 transition-colors shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>{currentUser.name}</span>
          </button>
          
          {isApiKeyActive && (
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1.5 shrink-0">
              <span>{getProviderLabel(activeProvider)}</span>
            </span>
          )}
          
          <button
            onClick={onLogout}
            className="text-slate-400 hover:text-rose-400 transition-all duration-300 cursor-pointer flex items-center gap-1.5 group shrink-0 border-l border-slate-800 pl-4"
          >
            <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-400 transition-colors shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            <span>Sair</span>
          </button>
        </div>
      )}
    </header>
  );
};
export default Header;
