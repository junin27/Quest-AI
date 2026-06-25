import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { generateAccessToken } from '../../utils/token';
import { Button } from '../Common/Button';

interface EmailVerificationProps {
  userId: string;
  email: string;
  onVerificationSuccess: () => void;
  setView: (view: string) => void;
  showToastMessage: (msg: string, type: 'success' | 'error') => void;
}

function maskEmail(emailAddress: string): string {
  const [local, domain] = emailAddress.split('@');
  if (!domain) return '***';
  if (local.length <= 3) {
    return `${local[0]}***@${domain}`;
  }
  return `${local.slice(0, 3)}***@${domain}`;
}

export const EmailVerification: React.FC<EmailVerificationProps> = ({
  userId,
  email,
  onVerificationSuccess,
  setView,
  showToastMessage
}) => {
  const [resendCount, setResendCount] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const MAX_RESENDS = 3;

  const handleSimulateVerification = async () => {
    setIsVerifying(true);
    try {
      // Cria um token JWT simulado para verificação (expiração de 24h)
      const token = await generateAccessToken(userId, email);
      const success = await authService.verifyEmail(token);
      
      if (success) {
        showToastMessage('E-mail verificado com sucesso!', 'success');
        onVerificationSuccess();
      } else {
        showToastMessage('Falha ao verificar e-mail. Token inválido.', 'error');
      }
    } catch {
      showToastMessage('Erro no processo de verificação.', 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendCount >= MAX_RESENDS) {
      showToastMessage('Limite de reenvios excedido.', 'error');
      return;
    }
    setResendCount((prev) => prev + 1);
    const sentReal = await authService.sendVerificationEmail(userId, email);
    if (sentReal) {
      showToastMessage('E-mail de confirmação reenviado com sucesso!', 'success');
    } else {
      showToastMessage(`Link reenviado para ${maskEmail(email)} (Simulado localmente)`, 'success');
    }
  };

  return (
    <div className="glass-card w-full max-w-md p-8 rounded-2xl mx-auto my-10 text-center relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="mx-auto w-16 h-16 bg-rose-500/10 text-rose-400 rounded-full flex items-center justify-center mb-6">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-2.25-1.5a2 2 0 00-2.22 0l-2.25 1.5" />
        </svg>
      </div>

      <h2 className="text-2xl font-extrabold text-white mb-3">Verifique seu E-mail</h2>
      <p className="text-slate-300 text-sm mb-6 leading-relaxed">
        Enviamos um link de confirmação para o endereço mascarado:<br />
        <span className="text-rose-400 font-bold font-mono text-base">{maskEmail(email)}</span>
      </p>

      <div className="space-y-4">
        <Button
          onClick={handleSimulateVerification}
          isLoading={isVerifying}
          className="w-full"
        >
          Simular Clique no E-mail
        </Button>

        <div className="flex gap-4">
          <Button
            variant="secondary"
            onClick={handleResend}
            disabled={resendCount >= MAX_RESENDS}
            className="flex-1 text-xs py-2"
          >
            Reenviar Link ({MAX_RESENDS - resendCount})
          </Button>

          <Button
            variant="secondary"
            onClick={() => setView('login')}
            className="flex-1 text-xs py-2"
          >
            Voltar ao Login
          </Button>
        </div>
      </div>
    </div>
  );
};
export default EmailVerification;
