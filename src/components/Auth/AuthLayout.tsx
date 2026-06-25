import React from 'react';
import type { User } from '../../types/user.types';
import type { ToastType } from '../Common/Toast';
import { CONFIG } from '../../config';
import { LoginForm } from './LoginForm';
import { FairLoginForm } from './FairLoginForm';
import { RegisterForm } from './RegisterForm';
import { EmailVerification } from './EmailVerification';
import { MarketingSection } from '../Marketing/MarketingSection';

interface AuthLayoutProps {
  view: string;
  setView: (view: string) => void;
  verifyData: { userId: string; email: string } | null;
  onLoginSuccess: (user: User) => void;
  onRegisterSuccess: (userId: string, email: string) => void;
  onVerificationSuccess: () => void;
  showToast: (message: string, type?: ToastType) => void;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  view,
  setView,
  verifyData,
  onLoginSuccess,
  onRegisterSuccess,
  onVerificationSuccess,
  showToast
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center w-full max-w-5xl mx-auto my-6 animate-fade-in">
      <MarketingSection />

      {/* Form Card (Direita) */}
      <div className="lg:col-span-6 w-full flex justify-center">
        {view === 'login' && (
          CONFIG.FAIR_MODE ? (
            <FairLoginForm
              onLoginSuccess={onLoginSuccess}
              showToastMessage={showToast}
            />
          ) : (
            <LoginForm
              onLoginSuccess={onLoginSuccess}
              setView={setView}
              showToastMessage={showToast}
            />
          )
        )}
        {view === 'register' && (
          <RegisterForm
            onRegisterSuccess={onRegisterSuccess}
            setView={setView}
            showToastMessage={showToast}
          />
        )}
        {view === 'verify-email' && verifyData && (
          <EmailVerification
            userId={verifyData.userId}
            email={verifyData.email}
            onVerificationSuccess={onVerificationSuccess}
            setView={setView}
            showToastMessage={showToast}
          />
        )}
      </div>
    </div>
  );
};
export default AuthLayout;
