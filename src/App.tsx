import React, { useState, useEffect } from 'react';
import type { User } from './types/user.types';
import type { QuizQuestion, DifficultyLevel, RagFile, QuizAnswer } from './types/quiz.types';
import { authService } from './services/authService';
import { decryptApiKey } from './utils/encryption';
import { generateQuizQuestions, OFFLINE_KEY } from './services/llmService';
import { multiSourceTriviaService } from './services/multiSourceTriviaService';
import { translateText } from './services/translationService';
import { saveQuizResult, saveQuizQuestions } from './services/scoreManager';
import { RoomDashboard } from './components/Room/RoomDashboard';
import { supabase } from './lib/supabaseClient';
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

import { ParticleBackground } from './components/Common/ParticleBackground';
import { Toast } from './components/Common/Toast';
import type { ToastType } from './components/Common/Toast';
import { CONFIG } from './config';
import { ApiKeySetup } from './components/ApiKey/ApiKeySetup';
import { QuizSetup } from './components/Quiz/QuizSetup';
import { QuestionCard } from './components/Quiz/QuestionCard';
import { ScoreBoard } from './components/Quiz/ScoreBoard';
import { Loading } from './components/Common/Loading';
import { UserProfile } from './components/Auth/UserProfile';
import { Header } from './components/Common/Header';
import { AuthLayout } from './components/Auth/AuthLayout';

export const App: React.FC = () => {
  const [view, setView] = useState<string>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isTriviaMode, setIsTriviaMode] = useState<boolean>(false);
  const [currentUserPassword, setCurrentUserPassword] = useState<string>('');

  // Registration Verification Temporary State
  const [verifyData, setVerifyData] = useState<{ userId: string; email: string } | null>(null);

  // Quiz Playing State
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [questionTimes, setQuestionTimes] = useState<Record<number, number>>({});
  const [correctAnswersMap, setCorrectAnswersMap] = useState<Record<number, boolean>>({});
  const [questionsCorrectCount, setQuestionsCorrectCount] = useState<number>(0);
  const [quizTopic, setQuizTopic] = useState<string>('');
  const [quizDifficulty, setQuizDifficulty] = useState<DifficultyLevel>('medium');

  // Supabase states
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [answersList, setAnswersList] = useState<QuizAnswer[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMsg, setLoadingMsg] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean }>({
    message: '',
    type: 'info',
    isVisible: false
  });

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type, isVisible: true });
  };

  const closeToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  };

  // Auto-login on mount
  useEffect(() => {
    const tryAutoLogin = async () => {
      const user = await authService.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        if (CONFIG.FAIR_MODE) {
          setCurrentUserPassword('FairModePassword123!');
        }
        setIsTriviaMode(!hasRealApiKey(user));
        setView((user.apiKey || localStorage.getItem('quiz_app_global_api_key')) ? 'quiz-setup' : 'api-key-setup');
      }
    };
    tryAutoLogin();
  }, []);

  // Redirecionamento automático caso venha com o link ?room=CÓDIGO ou ?verifyToken=
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomCode = params.get('room');
    if (roomCode && currentUser) {
      setView('rooms');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [currentUser]);

  // Validar confirmação de e-mail por URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verifyToken = params.get('verifyToken');
    if (verifyToken) {
      const verify = async () => {
        setIsLoading(true);
        setLoadingMsg('Validando token de confirmação...');
        try {
          const success = await authService.verifyEmail(verifyToken);
          if (success) {
            showToast('E-mail confirmado com sucesso! Faça login para jogar.', 'success');
          } else {
            showToast('Falha na confirmação. Link inválido ou expirado.', 'error');
          }
        } catch {
          showToast('Erro no processo de verificação.', 'error');
        } finally {
          setIsLoading(false);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      };
      verify();
    }
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    const passInput = (document.querySelector('input[type="password"]') as HTMLInputElement)?.value || '';
    setCurrentUserPassword(CONFIG.FAIR_MODE ? 'FairModePassword123!' : passInput);
    setIsTriviaMode(!hasRealApiKey(user));
    
    // Se veio com ?room na URL antes do login, vai para salas
    const params = new URLSearchParams(window.location.search);
    if (params.get('room')) {
      setView('rooms');
    } else {
      setView((user.apiKey || localStorage.getItem('quiz_app_global_api_key')) ? 'quiz-setup' : 'api-key-setup');
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

  // Iniciar Quiz Solo
  const handleStartQuiz = async (
    topic: string, 
    difficulty: DifficultyLevel, 
    count: number, 
    popularExamOnly: boolean = false,
    ragFiles?: RagFile[]
  ) => {
    if (!currentUser) return;
    setIsLoading(true);
    setActiveRoomId(null); // Jogando solo

    // ── Modo Trivia Multi-Banco (sem API key real) ──────────────────────────
    if (isTriviaMode) {
      const [categoryId, areaIdsStr] = topic.includes('|') ? topic.split('|') : [topic, undefined];
      const areaIds = areaIdsStr ? areaIdsStr.split(',') : undefined;
      setLoadingMsg('Buscando questões de múltiplas fontes...');

      try {
        const triviaBankQuestions = await multiSourceTriviaService.fetchQuestionsForCategory(
          categoryId,
          areaIds,
          difficulty,
          count
        );

        if (triviaBankQuestions.length === 0) {
          showToast('Nenhuma questão encontrada para esta categoria. Tente outra.', 'error');
          setIsLoading(false);
          return;
        }

        const convertedQuestions: QuizQuestion[] = await Promise.all(
          triviaBankQuestions.map(async (tbq) => {
            let questionText = '';
            if (typeof tbq.text === 'string') {
              questionText = tbq.text;
            } else if (typeof tbq.text === 'object' && tbq.text !== null) {
              questionText = (tbq.text as any)?.text || JSON.stringify(tbq.text);
            } else {
              questionText = String(tbq.text);
            }

            const explanation = typeof tbq.explanation === 'string' ? tbq.explanation : 'Resposta correta acima.';

            const [translatedQuestion, ...translatedOptions] = await Promise.all([
              translateText(questionText),
              ...((tbq.options as string[]) || []).map((opt) => translateText(opt)),
            ]);

            return {
              id: tbq.id,
              questionText: translatedQuestion || questionText,
              options: translatedOptions || tbq.options || [],
              correctOptionIndex: tbq.correctIndex ?? 0,
              explanation: explanation || 'Resposta correta acima.',
            };
          })
        );

        // Salvar o quiz no banco
        const qId = await saveQuizQuestions(currentUser.id, `Multi-Banco: ${categoryId}`, difficulty, convertedQuestions);
        setQuizId(qId);
        setQuizQuestions(convertedQuestions);
        setAnswersList([]);
        setCurrentQuestionIndex(0);
        setQuestionTimes({});
        setCorrectAnswersMap({});
        setQuestionsCorrectCount(0);
        setQuizTopic(`Multi-Banco: ${categoryId}`);
        setQuizDifficulty(difficulty);
        setView('quiz');
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erro ao buscar questões. Tente novamente.';
        showToast(message, 'error');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // ── Modo LLM (com API key) ───────────────────────────────────────────────
    const isRag = ragFiles && ragFiles.length > 0;
    setLoadingMsg(
      isRag 
        ? `Lendo material e consultando o Gemini para gerar questões...` 
        : `Consultando o Gemini para gerar questões sobre ${topic}...`
    );

    try {
      let apiKeyPlain = localStorage.getItem('quiz_app_global_api_key') || '';
      let provider: any = localStorage.getItem('quiz_app_global_api_provider') || 'gemini';
      let modelId: string | undefined = localStorage.getItem('quiz_app_global_api_modelId') || undefined;

      if (!apiKeyPlain && currentUser.apiKey) {
        apiKeyPlain = await decryptApiKey(currentUser.apiKey.encryptedKey, currentUserPassword);
        provider = currentUser.apiKey.provider;
        modelId = currentUser.apiKey.modelId;
      }

      let ragData: { text: string; images: any[] } | undefined = undefined;
      if (isRag) {
        const successfulFiles = ragFiles.filter((f) => f.status === 'success');
        if (successfulFiles.length > 0) {
          const combinedText = successfulFiles
            .map((f) => `--- ARQUIVO: ${f.name} ---\n${f.text}`)
            .join('\n\n');
          const allImages = successfulFiles.flatMap((f) => f.images);
          ragData = {
            text: combinedText,
            images: allImages,
          };
        }
      }

      const questions = await generateQuizQuestions(
        apiKeyPlain,
        topic,
        difficulty,
        count,
        provider,
        modelId,
        popularExamOnly,
        ragData
      );

      // Salvar o quiz no banco
      const qId = await saveQuizQuestions(currentUser.id, topic, difficulty, questions);
      setQuizId(qId);
      setQuizQuestions(questions);
      setAnswersList([]);
      setCurrentQuestionIndex(0);
      setQuestionTimes({});
      setCorrectAnswersMap({});
      setQuestionsCorrectCount(0);
      setQuizTopic(topic);
      setQuizDifficulty(difficulty);
      setView('quiz');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao obter perguntas do Gemini. Tente novamente.';
      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelected = (selectedIndex: number, timeSpent: number, isCorrect: boolean) => {
    setQuestionTimes((prev) => ({ ...prev, [currentQuestionIndex]: timeSpent }));
    setCorrectAnswersMap((prev) => ({ ...prev, [currentQuestionIndex]: isCorrect }));
    
    // Registrar a resposta detalhada do usuário para revisão
    const question = quizQuestions[currentQuestionIndex];
    const newAnswer: QuizAnswer = {
      questionId: question.id,
      selectedOptionIndex: selectedIndex,
      isCorrect,
    };
    
    setAnswersList((prev) => [...prev, newAnswer]);

    if (isCorrect) {
      setQuestionsCorrectCount((prev) => prev + 1);
    }
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex + 1 < quizQuestions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // Salvar resultados no banco de dados do Supabase
      if (!currentUser) return;
      const totalTime = Object.values(questionTimes).reduce((acc, t) => acc + t, 0);
      
      setIsLoading(true);
      setLoadingMsg('Salvando seus resultados...');

      try {
        await saveQuizResult(
          currentUser.id,
          quizId!,
          activeRoomId || undefined,
          quizTopic,
          quizDifficulty,
          quizQuestions.length,
          questionsCorrectCount,
          totalTime,
          questionTimes,
          correctAnswersMap,
          answersList
        );
        setView('scores');
      } catch (err: any) {
        showToast(err.message, 'error');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // WebSocket / Realtime callback quando um convidado escuta que um quiz iniciou na sala
  const handleActiveQuizStarted = async (startedQuizId: string) => {
    setIsLoading(true);
    setLoadingMsg('Carregando quiz da sala...');
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', startedQuizId)
        .single();

      if (error || !data) {
        throw new Error('Falha ao obter questões do quiz iniciado na sala.');
      }

      setQuizQuestions(data.questions);
      setQuizId(startedQuizId);
      setAnswersList([]);
      setCurrentQuestionIndex(0);
      setQuestionTimes({});
      setCorrectAnswersMap({});
      setQuestionsCorrectCount(0);
      setQuizTopic(data.topic);
      setQuizDifficulty(data.difficulty);
      setView('quiz');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setCurrentUserPassword('');
    setView('login');
    showToast('Sessão encerrada.', 'info');
  };

  const handleTitleClick = () => {
    if (view === 'quiz') {
      if (!window.confirm('Deseja realmente cancelar o quiz e voltar para a tela inicial?')) {
        return;
      }
    }

    // Reset quiz playing states
    setQuizQuestions([]);
    setCurrentQuestionIndex(0);
    setQuestionTimes({});
    setCorrectAnswersMap({});
    setQuestionsCorrectCount(0);
    setQuizTopic('');
    setAnswersList([]);

    if (currentUser) {
      setView((currentUser.apiKey || localStorage.getItem('quiz_app_global_api_key')) ? 'quiz-setup' : 'api-key-setup');
    } else {
      setView('login');
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col z-10 font-sans">
      <ParticleBackground />

      <Header
        currentUser={currentUser}
        onTitleClick={handleTitleClick}
        onNavigateToProfile={() => setView('profile')}
        onNavigateToRooms={() => setView('rooms')}
        onNavigateToHistory={() => setView('scores')}
        onLogout={handleLogout}
      />

      {/* Main Container */}
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
                    onBack={() => setView((currentUser.apiKey || localStorage.getItem('quiz_app_global_api_key')) ? 'quiz-setup' : 'api-key-setup')}
                    onUpdateCurrentUser={setCurrentUser}
                    showToast={showToast}
                  />
                )}
                {view === 'quiz' && quizQuestions.length > 0 && (
                  <QuestionCard
                    question={quizQuestions[currentQuestionIndex]}
                    questionNumber={currentQuestionIndex + 1}
                    totalQuestions={quizQuestions.length}
                    difficulty={quizDifficulty}
                    onAnswerSelected={handleAnswerSelected}
                    onNextQuestion={handleNextQuestion}
                    isLastQuestion={currentQuestionIndex + 1 === quizQuestions.length}
                  />
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
                    onStartRoomQuiz={async (topic, difficulty, count, popularExamOnly, ragFiles) => {
                      if (!currentUser || !activeRoomId) return;
                      setIsLoading(true);
                      setLoadingMsg('Gerando questões por IA para a sala...');
                      try {
                        let apiKeyPlain = localStorage.getItem('quiz_app_global_api_key') || '';
                        let provider: any = localStorage.getItem('quiz_app_global_api_provider') || 'gemini';
                        let modelId: string | undefined = localStorage.getItem('quiz_app_global_api_modelId') || undefined;

                        if (!apiKeyPlain && currentUser.apiKey) {
                          apiKeyPlain = await decryptApiKey(currentUser.apiKey.encryptedKey, currentUserPassword);
                          provider = currentUser.apiKey.provider;
                          modelId = currentUser.apiKey.modelId;
                        }

                        let ragData: { text: string; images: any[] } | undefined = undefined;
                        if (ragFiles && ragFiles.length > 0) {
                          const successfulFiles = ragFiles.filter((f) => f.status === 'success');
                          if (successfulFiles.length > 0) {
                            const combinedText = successfulFiles
                              .map((f) => `--- ARQUIVO: ${f.name} ---\n${f.text}`)
                              .join('\n\n');
                            const allImages = successfulFiles.flatMap((f) => f.images);
                            ragData = {
                              text: combinedText,
                              images: allImages,
                            };
                          }
                        }

                        const questions = await generateQuizQuestions(
                          apiKeyPlain,
                          topic,
                          difficulty,
                          count,
                          provider,
                          modelId,
                          popularExamOnly,
                          ragData
                        );

                        setLoadingMsg('Iniciando o quiz na sala multiplayer...');
                        const qId = await roomService.startRoomQuiz(
                          activeRoomId,
                          topic,
                          difficulty,
                          questions,
                          currentUser.id
                        );

                        setQuizId(qId);
                        setQuizQuestions(questions);
                        setAnswersList([]);
                        setCurrentQuestionIndex(0);
                        setQuestionTimes({});
                        setCorrectAnswersMap({});
                        setQuestionsCorrectCount(0);
                        setQuizTopic(topic);
                        setQuizDifficulty(difficulty);
                        setView('quiz');
                      } catch (err: any) {
                        showToast(err.message, 'error');
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    onActiveQuizStarted={handleActiveQuizStarted}
                    onActiveRoomChange={setActiveRoomId}
                    showToast={showToast}
                    isIAActive={hasRealApiKey(currentUser)}
                    onNavigateToApiSetup={() => setView('api-key-setup')}
                    isLoadingIAQuiz={isLoading}
                  />
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* Toast Notification */}
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
