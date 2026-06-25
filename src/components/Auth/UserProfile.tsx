import React, { useState } from 'react';
import type { User } from '../../types/user.types';
import { ApiKeyManager } from '../ApiKey/ApiKeyManager';
import { ScoreBoard } from '../Quiz/ScoreBoard';
import { Button } from '../Common/Button';
import { ProfileForm } from './ProfileForm';
import { ArrowLeft } from 'lucide-react';

interface UserProfileProps {
  currentUser: User;
  currentUserPassword?: string;
  onBack: () => void;
  onUpdateCurrentUser: (updatedUser: User) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

type TabType = 'account' | 'apikey' | 'history';

export const UserProfile: React.FC<UserProfileProps> = ({
  currentUser,
  currentUserPassword = '',
  onBack,
  onUpdateCurrentUser,
  showToast
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('account');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'account':
        return (
          <ProfileForm
            currentUser={currentUser}
            onUpdateCurrentUser={onUpdateCurrentUser}
            showToast={showToast}
          />
        );
      case 'apikey':
        return (
          <ApiKeyManager
            currentUser={currentUser}
            currentUserPassword={currentUserPassword}
            onUpdateSuccess={onUpdateCurrentUser}
            showToastMessage={showToast}
          />
        );
      case 'history':
        return (
          <ScoreBoard
            currentUser={currentUser}
            onBackToSetup={onBack}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-6 space-y-6">
      {/* Header do Perfil com Navegação */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-black text-white">Minha Conta</h2>
          <p className="text-xs text-slate-400">Gerencie seus dados, configurações de IA e acompanhe suas pontuações.</p>
        </div>
        <Button onClick={onBack} variant="secondary" className="text-xs gap-2">
          <ArrowLeft size={14} strokeWidth={3.5} />
          VOLTAR PARA O QUIZ
        </Button>
      </div>

      {/* Abas */}
      <div className="flex gap-2 border-b border-slate-900 pb-px text-sm">
        {(['account', 'apikey', 'history'] as const).map((tab) => {
          const label = tab === 'account' ? 'Dados Pessoais' : tab === 'apikey' ? 'Chave de API (IA)' : 'Histórico & Ranking';
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 font-bold transition-all border-b-2 cursor-pointer ${isActive
                  ? 'border-rose-500 text-rose-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Conteúdo das Abas */}
      <div className="mt-4 animate-fade-in">
        {renderTabContent()}
      </div>
    </div>
  );
};
