import React, { useState } from 'react';
import type { User } from '../../types/user.types';
import { authService } from '../../services/authService';
import { Button } from '../Common/Button';

interface ProfileFormProps {
  currentUser: User;
  onUpdateCurrentUser: (updatedUser: User) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
  currentUser,
  onUpdateCurrentUser,
  showToast
}) => {
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEmailOrPasswordChanged = email !== currentUser.email || password.length > 0;

  const validateInputs = (): boolean => {
    if (isEmailOrPasswordChanged && !currentPassword) {
      showToast('A senha atual é necessária para alterar o e-mail ou senha.', 'error');
      return false;
    }
    if (password && password !== confirmPassword) {
      showToast('A confirmação da nova senha está incorreta.', 'error');
      return false;
    }
    return true;
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;

    setIsSubmitting(true);
    try {
      const updated = await authService.updateProfile(currentUser.id, currentPassword, {
        name: name !== currentUser.name ? name : undefined,
        email: email !== currentUser.email ? email : undefined,
        password: password || undefined
      });
      onUpdateCurrentUser(updated);
      showToast('Perfil atualizado com sucesso!', 'success');
      setPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar perfil.';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-card max-w-md p-6 rounded-2xl border border-slate-800/60 mx-auto">
      <h3 className="text-lg font-bold text-white mb-4">Atualizar Informações</h3>
      <form onSubmit={handleProfileSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Nome completo</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950/60 border border-slate-850 rounded-xl text-white text-xs outline-none focus:border-rose-500"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">E-mail</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950/60 border border-slate-850 rounded-xl text-white text-xs outline-none focus:border-rose-500"
          />
        </div>
        
        <div className="border-t border-slate-900 pt-3 my-2 space-y-4">
          <h4 className="text-xs font-bold text-rose-400">Alterar Senha (Opcional)</h4>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Nova Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Deixe em branco para manter a atual"
              className="w-full px-3 py-2 bg-slate-950/60 border border-slate-850 rounded-xl text-white text-xs outline-none focus:border-rose-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Confirmar Nova Senha</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirme a nova senha"
              className="w-full px-3 py-2 bg-slate-950/60 border border-slate-850 rounded-xl text-white text-xs outline-none focus:border-rose-500"
            />
          </div>
        </div>

        {isEmailOrPasswordChanged && (
          <div className="border-t border-slate-900 pt-3 space-y-3">
            <div className="bg-orange-500/10 border border-orange-500/20 text-orange-400 p-2.5 rounded-lg text-[10px] leading-relaxed font-semibold">
              A confirmação da senha atual é obrigatória para atualizar o e-mail ou a senha.
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-rose-400 mb-1.5">Senha Atual</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Digite sua senha atual"
                className="w-full px-3 py-2 bg-slate-950/60 border border-slate-850 rounded-xl text-white text-xs outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
              />
            </div>
          </div>
        )}

        <Button type="submit" isLoading={isSubmitting} className="w-full text-xs py-2.5 mt-2">
          Salvar Alterações
        </Button>
      </form>
    </div>
  );
};
