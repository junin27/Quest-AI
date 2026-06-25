import React, { useState } from 'react';
import { tryResetLeaderboard } from '../../services/leaderboardManager';
import { sessionStore } from '../../services/sessionStore';
import { Button } from '../Common/Button';

interface AdminPanelProps {
  onBack: () => void;
  showToastMessage: (msg: string, type: 'success' | 'error') => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  onBack,
  showToastMessage
}) => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [confirmStep, setConfirmStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Valida usando a senha admin ("admin-secret")
      await tryResetLeaderboard(password);
      // Se não der erro, a senha é correta (vamos apenas autenticar o painel para manipulação local)
      setIsAuthenticated(true);
      showToastMessage('Autenticação de administrador realizada!', 'success');
    } catch (err: any) {
      showToastMessage(err.message || 'Senha incorreta.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetClick = async () => {
    if (confirmStep < 2) {
      setConfirmStep((prev) => prev + 1);
      return;
    }

    setIsLoading(true);
    try {
      await tryResetLeaderboard(password);
      showToastMessage('Leaderboard resetado com sucesso!', 'success');
      setConfirmStep(0);
    } catch (err: any) {
      showToastMessage(err.message || 'Erro ao resetar o leaderboard.', 'error');
      setConfirmStep(0);
    } finally {
      setIsLoading(false);
    }
  };

  const getResetButtonText = () => {
    if (confirmStep === 1) return 'Tem certeza?';
    if (confirmStep === 2) return 'Clique novamente para confirmar!';
    return 'Resetar Leaderboard';
  };

  const logs = sessionStore.getAdminLogs();

  return (
    <div className="glass-card w-full max-w-md p-8 rounded-2xl mx-auto my-10 relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6">
        <h2 className="text-xl font-extrabold text-white">Painel do Administrador</h2>
        <button
          onClick={onBack}
          className="text-xs text-slate-400 hover:text-white font-semibold transition-colors"
        >
          Voltar
        </button>
      </div>

      {!isAuthenticated ? (
        <form onSubmit={handleAuthenticate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Senha de Acesso Local (Admin Password)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-white outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
            />
          </div>
          <Button type="submit" variant="danger" isLoading={isLoading} className="w-full">
            Autenticar
          </Button>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="bg-rose-950/10 border border-rose-500/20 p-4 rounded-xl text-xs space-y-3">
            <h4 className="font-bold text-rose-300 uppercase tracking-wide">Ações de Risco</h4>
            <p className="text-slate-400 leading-relaxed">
              O reset arquivará todos os scores ativos no Leaderboard local, impedindo que novos jogadores os vejam.
            </p>
            
            <Button
              onClick={handleResetClick}
              variant={confirmStep > 0 ? 'danger' : 'secondary'}
              isLoading={isLoading}
              className="w-full text-xs py-2 font-bold"
            >
              {getResetButtonText()}
            </Button>
            {confirmStep > 0 && (
              <button
                onClick={() => setConfirmStep(0)}
                className="w-full text-center text-[10px] text-slate-500 hover:text-slate-400 font-semibold mt-1"
              >
                Cancelar Ação
              </button>
            )}
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Histórico de Resets</h4>
            <div className="bg-slate-950/40 border border-slate-900 rounded-xl max-h-40 overflow-y-auto no-scrollbar p-3 space-y-2">
              {logs.length === 0 ? (
                <p className="text-[11px] text-slate-600 text-center py-4">Nenhum reset registrado nos logs.</p>
              ) : (
                logs
                  .slice()
                  .reverse()
                  .map((log, idx) => (
                    <div key={idx} className="flex justify-between text-[10px] border-b border-slate-900 pb-1.5 last:border-0 last:pb-0 text-slate-400">
                      <span>{new Date(log.timestamp).toLocaleTimeString()} ({log.count} arquivados)</span>
                      <span className="text-rose-400 font-bold">{log.action}</span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminPanel;
