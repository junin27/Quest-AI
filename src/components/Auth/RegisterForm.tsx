import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { registerSchema, uppercaseRegex, lowercaseRegex, numberRegex, specialCharRegex } from '../../utils/validation';
import { Button } from '../Common/Button';

interface RegisterFormProps {
  onRegisterSuccess: (userId: string, email: string) => void;
  setView: (view: string) => void;
  showToastMessage: (msg: string, type: 'success' | 'error') => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onRegisterSuccess,
  setView,
  showToastMessage
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field === 'name') setName(value as string);
    if (field === 'email') setEmail(value as string);
    if (field === 'password') setPassword(value as string);
    if (field === 'confirmPassword') setConfirmPassword(value as string);
    if (field === 'termsAccepted') setTermsAccepted(value as boolean);
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const validation = registerSchema.safeParse({ name, email, password, confirmPassword, termsAccepted });
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        if (issue.path[0]) fieldErrors[issue.path[0].toString()] = issue.message;
      });
      setErrors(fieldErrors);
      setIsLoading(false);
      return;
    }

    try {
      const response = await authService.register({ name, email, password, confirmPassword, termsAccepted });
      if (response.success) {
        const sentReal = await authService.sendVerificationEmail(response.userId!, email);
        if (sentReal) {
          showToastMessage('Cadastro realizado! E-mail de confirmação enviado.', 'success');
        } else {
          showToastMessage('Cadastro realizado! (Link gerado para simulação)', 'success');
        }
        onRegisterSuccess(response.userId!, email);
      }
    } catch (err: any) {
      showToastMessage(err.message || 'Erro ao realizar cadastro.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Requisitos de senha dinâmicos
  const requirements = [
    { label: 'Mínimo de 8 caracteres', satisfied: password.length >= 8 },
    { label: 'Uma letra maiúscula', satisfied: uppercaseRegex.test(password) },
    { label: 'Uma letra minúscula', satisfied: lowercaseRegex.test(password) },
    { label: 'Um número', satisfied: numberRegex.test(password) },
    { label: 'Um caractere especial', satisfied: specialCharRegex.test(password) },
  ];

  return (
    <div className="glass-card w-full max-w-md p-8 rounded-2xl mx-auto my-6 relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <h2 className="text-2xl font-extrabold text-white text-center mb-6">Crie sua Conta</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Nome Completo</label>
          <input
            type="text"
            value={name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Seu Nome"
            className={`w-full px-4 py-2.5 bg-slate-950/50 border rounded-xl outline-none text-white placeholder-slate-600 focus:ring-1 ${
              errors.name ? 'border-rose-500/50 focus:ring-rose-500' : 'border-slate-800 focus:border-rose-500 focus:ring-rose-500'
            }`}
          />
          {errors.name && <p className="text-rose-400 text-xs mt-1 font-medium">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="exemplo@email.com"
            className={`w-full px-4 py-2.5 bg-slate-950/50 border rounded-xl outline-none text-white placeholder-slate-600 focus:ring-1 ${
              errors.email ? 'border-rose-500/50 focus:ring-rose-500' : 'border-slate-800 focus:border-rose-500 focus:ring-rose-500'
            }`}
          />
          {errors.email && <p className="text-rose-400 text-xs mt-1 font-medium">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            placeholder="••••••••"
            className={`w-full px-4 py-2.5 bg-slate-950/50 border rounded-xl outline-none text-white placeholder-slate-600 focus:ring-1 ${
              errors.password ? 'border-rose-500/50 focus:ring-rose-500' : 'border-slate-800 focus:border-rose-500 focus:ring-rose-500'
            }`}
          />
          {errors.password && <p className="text-rose-400 text-xs mt-1 font-medium">{errors.password}</p>}
          
          {/* Indicador visual de senha */}
          <div className="mt-2.5 p-3 bg-slate-950/40 rounded-lg border border-slate-800/40 space-y-1.5 text-[11px] text-slate-400">
            {requirements.map((req, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className={req.satisfied ? 'text-emerald-400' : 'text-slate-600'}>
                  {req.satisfied ? '✓' : '•'}
                </span>
                <span className={req.satisfied ? 'text-slate-300 font-medium' : ''}>
                  {req.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Confirmar Senha</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            placeholder="••••••••"
            className={`w-full px-4 py-2.5 bg-slate-950/50 border rounded-xl outline-none text-white placeholder-slate-600 focus:ring-1 ${
              errors.confirmPassword ? 'border-rose-500/50 focus:ring-rose-500' : 'border-slate-800 focus:border-rose-500 focus:ring-rose-500'
            }`}
          />
          {errors.confirmPassword && <p className="text-rose-400 text-xs mt-1 font-medium">{errors.confirmPassword}</p>}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => handleInputChange('termsAccepted', e.target.checked)}
            className="accent-rose-500 w-4 h-4 rounded border-slate-800 bg-slate-950/50"
          />
          <label className="cursor-pointer select-none">
            Aceito os <span className="text-rose-400 hover:underline">Termos de Serviço</span> e <span className="text-rose-400 hover:underline">Políticas</span>.
          </label>
        </div>
        {errors.termsAccepted && <p className="text-rose-400 text-xs font-medium">{errors.termsAccepted}</p>}

        <Button type="submit" isLoading={isLoading} className="w-full mt-2">
          Cadastrar
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-slate-400 border-t border-slate-800/40 pt-4">
        Já tem uma conta?{' '}
        <button
          onClick={() => setView('login')}
          className="text-rose-400 hover:text-rose-300 font-semibold transition-colors"
        >
          Faça Login
        </button>
      </div>
    </div>
  );
};
export default RegisterForm;
