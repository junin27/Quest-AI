import React, { useState, useEffect } from 'react';
import type { User } from './types/user.types';
import type { DifficultyLevel } from './types/quiz.types';
import { authService } from './services/authService';
import { OFFLINE_KEY } from './services/llmService';
import { useQuizSession } from './hooks/useQuizSession';

import { ParticleBackground } from './components/Common/ParticleBackground';
import { Toast } from './components/Common/Toast';
import type { ToastType } from './components/Common/Toast';
import { CONFIG } from './config';
import { ApiKeySetup } from './components/ApiKey/ApiKeySetup';
import { QuizSetup } from './components/Quiz/QuizSetup';
import type { BlendedQuizOptions } from './components/Quiz/QuizSetup';
import { QuestionCard } from './components/Quiz/QuestionCard';
import { ScoreBoard } from './components/Quiz/ScoreBoard';
import { Loading } from './components/Common/Loading';
import { UserProfile } from './components/Auth/UserProfile';
import { Header } from './components/Common/Header';
import { AuthLayout } from './components/Auth/AuthLayout';
import { RoomDashboard } from './components/Room/RoomDashboard';
import { roomService } from './services/roomService';

/**
 * Retorna true apenas quando o usuário tem uma chave de API real configurada
 * (i.e., não é a OFFLINE_KEY nem o modo fair sem chave).
 */
function hasRealApiKey(user: User): boolean {
  const storedKey = localStorage.getItem('quiz_app_global_api_key') ?? '';
  const storedKeyIsReal = storedKey.length > 0 && storedKey !== OFFLINE_KEY;
  const userKeyIsReal = !!(user.apiKey && user.apiKey.lastFourChars !== 'MOCK');
  return storedKeyIsReal || userKeyIsReal;
}

function resolvePostLoginView(user: User): string {
  return (user.apiKey || localStorage.getItem('quiz_app_global_api_key'))
    ? 'quiz-setup'
    : 'api-key-setup';
}

export const App: React.FC = () => {
  const [view, setView] = useState<string>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isTriviaMode, setIsTriviaMode] = useState<boolean>(false);
  // A senha é elevada ao estado pelo LoginForm via callback — sem DOM scraping
  const [currentUserPassword, setCurrentUserPassword] = useState<string>('');

  const [verifyData, setVerifyData] = useState<{ userId: string; email: string } | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMsg, setLoadingMsg] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean }>({
    message: '',
    type: 'info',
    isVisible: false,
  });

  const [pendingRoomCode, setPendingRoomCode] = useState<string | null>(null);

  const quizSession = useQuizSession();

  // ─── Toast ────────────────────────────────────────────────────────────────────

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type, isVisible: true });
  };

  const closeToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  };

  // ─── Auto-login ao montar ─────────────────────────────────────────────────────

  useEffect(() => {
    const tryAutoLogin = async () => {
      const user = await authService.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        if (CONFIG.FAIR_MODE) {
          setCurrentUserPassword('FairModePassword123!');
        }
        setIsTriviaMode(!hasRealApiKey(user));
        
        const params = new URLSearchParams(window.location.search);
        const roomCode = params.get('room');
        if (roomCode) {
          setPendingRoomCode(roomCode);
          setView('rooms');
        } else {
          setView(resolvePostLoginView(user));
        }
      }
    };
    tryAutoLogin();
  }, []);

  // Redireciona se vier com ?room=CÓDIGO na URL após login
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomCode = params.get('room');
    if (roomCode && currentUser) {
      setPendingRoomCode(roomCode);
      setView('rooms');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [currentUser]);

  // Pre-fetch de salas ativas em segundo plano ao autenticar o usuário
  useEffect(() => {
    if (currentUser) {
      roomService.getUserRooms().catch(() => {});
    }
  }, [currentUser]);

  // Valida token de confirmação de e-mail via URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verifyToken = params.get('verifyToken');
    if (!verifyToken) return;

    const verify = async () => {
      setIsLoading(true);
      setLoadingMsg('Validando token de confirmação...');
      try {
        const success = await authService.verifyEmail(verifyToken);
        showToast(
          success
            ? 'E-mail confirmado com sucesso! Faça login para jogar.'
            : 'Falha na confirmação. Link inválido ou expirado.',
          success ? 'success' : 'error'
        );
      } catch {
        showToast('Erro no processo de verificação.', 'error');
      } finally {
        setIsLoading(false);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };
    verify();
  }, []);

  // ─── Handlers de autenticação ─────────────────────────────────────────────────

  const handleLoginSuccess = (user: User, password: string) => {
    setCurrentUser(user);
    setCurrentUserPassword(CONFIG.FAIR_MODE ? 'FairModePassword123!' : password);
    setIsTriviaMode(!hasRealApiKey(user));

    const params = new URLSearchParams(window.location.search);
    const roomCode = params.get('room');
    if (roomCode) {
      setPendingRoomCode(roomCode);
      setView('rooms');
    } else {
      setView(resolvePostLoginView(user));
    }
  };

  const handleRegisterSuccess = (userId: string, email: string) => {
    setVerifyData({ userId, email });
    setView('verify-email');
  };

  const handleVerificationSuccess = () => {
    setView('login');
    setVerifyData(null);
  };

  const handleApiKeySetupSuccess = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    setIsTriviaMode(!hasRealApiKey(updatedUser));
    setView('quiz-setup');
  };

  const handleLogout = () => {
    authService.logout();
    roomService.clearCache();
    setCurrentUser(null);
    setCurrentUserPassword('');
    quizSession.resetQuizState();
    setView('login');
    showToast('Sessão encerrada.', 'info');
  };

  const handleTitleClick = () => {
    if (view === 'quiz') {
      if (!window.confirm('Deseja realmente cancelar o quiz e voltar para a tela inicial?')) {
        return;
      }
    }
    quizSession.resetQuizState();
    setView(currentUser ? resolvePostLoginView(currentUser) : 'login');
  };

  // ─── Handlers de quiz ─────────────────────────────────────────────────────────

  const handleStartQuiz = async (
    topic: string,
    difficulty: DifficultyLevel,
    count: number,
    options?: BlendedQuizOptions
  ) => {
    if (!currentUser) return;
    setIsLoading(true);

    const ragFiles = options?.ragFiles;
    const isRag = ragFiles && ragFiles.some((f) => f.status === 'success');
    setLoadingMsg(
      isTriviaMode
        ? 'Buscando questões de múltiplas fontes...'
        : isRag
          ? 'Lendo material e consultando o Gemini para gerar questões...'
          : `Consultando o Gemini para gerar questões sobre ${topic}...`
    );

    try {
      await quizSession.startSoloQuiz(
        topic,
        difficulty,
        count,
        currentUser,
        currentUserPassword,
        isTriviaMode,
        options
      );
      setView('quiz');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao iniciar o quiz. Tente novamente.';
      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelected = (selectedIndex: number, timeSpent: number, isCorrect: boolean) => {
    quizSession.handleAnswerSelected(selectedIndex, timeSpent, isCorrect);
  };

  const handleNextQuestion = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    setLoadingMsg('Salvando seus resultados...');
    try {
      const result = await quizSession.handleNextQuestion();
      if (result === 'finished') setView('scores');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar resultado.';
      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleActiveQuizStarted = async (startedQuizId: string) => {
    setIsLoading(true);
    setLoadingMsg('Carregando quiz da sala...');
    try {
      await quizSession.handleActiveQuizStarted(startedQuizId);
      setView('quiz');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar quiz da sala.';
      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartRoomQuiz = async (
    topic: string,
    difficulty: DifficultyLevel,
    count: number,
    options?: BlendedQuizOptions
  ) => {
    if (!currentUser || !quizSession.activeRoomId) return;
    setIsLoading(true);
    const isTrivia = !options;
    setLoadingMsg(
      isTrivia
        ? 'Buscando questões do banco de dados para a sala...'
        : 'Gerando questões por IA para a sala...'
    );
    try {
      await quizSession.startRoomQuiz(
        topic,
        difficulty,
        count,
        currentUser,
        currentUserPassword,
        isTrivia,
        options
      );
      setView('quiz');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao iniciar o quiz na sala.';
      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-screen flex flex-col z-10 font-sans">
      <ParticleBackground />

      <Header
        currentUser={currentUser}
        currentView={view}
        onTitleClick={handleTitleClick}
        onNavigateToProfile={() => setView('profile')}
        onNavigateToRooms={() => setView('rooms')}
        onNavigateToHistory={() => setView('scores')}
        onLogout={handleLogout}
      />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 flex flex-col justify-center">
        {isLoading ? (
          <Loading message={loadingMsg} />
        ) : (
          <>
            {['login', 'register', 'verify-email'].includes(view) ? (
              <AuthLayout
                view={view}
                setView={setView}
                verifyData={verifyData}
                onLoginSuccess={handleLoginSuccess}
                onRegisterSuccess={handleRegisterSuccess}
                onVerificationSuccess={handleVerificationSuccess}
                showToast={showToast}
              />
            ) : (
              <>
                {view === 'api-key-setup' && currentUser && (
                  <ApiKeySetup
                    currentUser={currentUser}
                    currentUserPassword={currentUserPassword}
                    onSetupSuccess={handleApiKeySetupSuccess}
                    showToastMessage={showToast}
                  />
                )}
                {view === 'quiz-setup' && currentUser && (
                  <QuizSetup
                    onStartQuiz={handleStartQuiz}
                    isLoading={isLoading}
                    isTriviaMode={isTriviaMode}
                    onNavigateToApiSetup={() => setView('api-key-setup')}
                  />
                )}
                {view === 'profile' && currentUser && (
                  <UserProfile
                    currentUser={currentUser}
                    currentUserPassword={currentUserPassword}
                    onBack={() => setView(resolvePostLoginView(currentUser))}
                    onUpdateCurrentUser={setCurrentUser}
                    showToast={showToast}
                  />
                )}
                {view === 'quiz' && quizSession.quizQuestions.length > 0 && (
                  <div className="space-y-4 w-full max-w-2xl mx-auto">
                    <div className="flex justify-start px-2">
                      <button
                        onClick={() => {
                          if (confirm('Deseja realmente sair do quiz em andamento? Seu progresso será perdido.')) {
                            quizSession.resetQuizState();
                            setView(quizSession.activeRoomId ? 'rooms' : 'quiz-setup');
                          }
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-slate-700 rounded-xl text-xs text-slate-400 hover:text-white font-bold transition-all transform active:scale-95 shadow-lg backdrop-blur-md"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <polyline points="15 18 9 12 15 6" />
                        </svg>
                        <span>Sair do Quiz</span>
                      </button>
                    </div>

                    <QuestionCard
                      question={quizSession.quizQuestions[quizSession.currentQuestionIndex]}
                      questionNumber={quizSession.currentQuestionIndex + 1}
                      totalQuestions={quizSession.quizQuestions.length}
                      difficulty={quizSession.quizDifficulty}
                      onAnswerSelected={handleAnswerSelected}
                      onNextQuestion={handleNextQuestion}
                      isLastQuestion={quizSession.currentQuestionIndex + 1 === quizSession.quizQuestions.length}
                    />
                  </div>
                )}
                {view === 'scores' && currentUser && (
                  <ScoreBoard
                    currentUser={currentUser}
                    onBackToSetup={() => setView('quiz-setup')}
                  />
                )}
                {view === 'rooms' && currentUser && (
                  <RoomDashboard
                    currentUserId={currentUser.id}
                    onStartRoomQuiz={handleStartRoomQuiz}
                    onActiveQuizStarted={handleActiveQuizStarted}
                    onActiveRoomChange={quizSession.setActiveRoomId}
                    showToast={showToast}
                    isIAActive={hasRealApiKey(currentUser)}
                    onNavigateToApiSetup={() => setView('api-key-setup')}
                    isLoadingIAQuiz={isLoading}
                    initialRoomCode={pendingRoomCode}
                    onClearInitialRoomCode={() => setPendingRoomCode(null)}
                  />
                )}
              </>
            )}
          </>
        )}
      </main>

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={closeToast}
      />
    </div>
  );
};

export default App;
