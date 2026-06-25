import { sessionStore } from './sessionStore';
import { CONFIG } from '../config';
import type { LeaderboardEntry, DifficultyLevel } from '../types/quiz.types';
import type { AdminLog } from '../types/storage.types';

const ADMIN_PASSWORD_HASH = '16175223c8ddce5ace0493c948569c211b03c4c6bb3d3e484434999448cffe01'; // SHA-256 of "admin-secret"
const RESET_SPAM_WINDOW_MS = 60 * 60 * 1000; // 1 hour in ms

async function computeSha256(text: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(text);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function maskUserName(fullName: string): string {
  if (fullName.length < 2) {
    return '***';
  }
  return fullName.slice(0, 2) + '***';
}

/**
 * Valida a senha de administrador e executa o arquivamento do Leaderboard.
 * 
 * Exemplo de uso:
 * ```typescript
 * const success = await tryResetLeaderboard("admin-secret"); // true
 * ```
 */
export async function tryResetLeaderboard(password: string): Promise<boolean> {
  const hash = await computeSha256(password);
  if (hash !== ADMIN_PASSWORD_HASH) {
    throw new Error('Senha administrativa inválida.');
  }

  // Previne spam: verifica se houve reset nos últimos 60 minutos
  const logs = sessionStore.getAdminLogs();
  const lastReset = logs
    .filter(log => log.action === 'LEADERBOARD_RESET')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

  if (lastReset && Date.now() - new Date(lastReset.timestamp).getTime() < RESET_SPAM_WINDOW_MS) {
    throw new Error('Limite de reset atingido. Permitido apenas 1 reset por hora.');
  }

  const activeScores = sessionStore.getAllScores();
  sessionStore.archiveScores();

  const adminLog: AdminLog = {
    action: 'LEADERBOARD_RESET',
    timestamp: new Date().toISOString(),
    count: activeScores.length
  };
  sessionStore.addAdminLog(adminLog);

  return true;
}

/**
 * Retorna os top 5 jogadores filtrados por tópico e/ou dificuldade.
 */
export function getLeaderboard(
  topic?: string,
  difficulty?: DifficultyLevel
): LeaderboardEntry[] {
  const scores = sessionStore.getAllScores()
    .filter(s => !s.archived)
    .filter(s => !topic || s.topic.toLowerCase() === topic.toLowerCase())
    .filter(s => {
      if (!difficulty) return true;
      if (CONFIG.FAIR_MODE) {
        const diffVal = parseInt(s.difficulty, 10);
        if (!isNaN(diffVal)) {
          if (difficulty === 'easy') return diffVal <= 3;
          if (difficulty === 'medium') return diffVal >= 4 && diffVal <= 6;
          if (difficulty === 'hard') return diffVal >= 7;
        }
      }
      return s.difficulty === difficulty;
    });

  // Agrupa por userId e pega a pontuação mais alta de cada usuário
  const userHighestScores: Record<string, typeof scores[0]> = {};
  for (const score of scores) {
    const existing = userHighestScores[score.userId];
    if (!existing || score.totalScore > existing.totalScore) {
      userHighestScores[score.userId] = score;
    }
  }

  return Object.values(userHighestScores)
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 5)
    .map((score, index) => {
      const user = sessionStore.getUser(score.userId);
      const name = user ? user.name : 'Jogador não informado';
      const email = user ? user.email : '';
      const displayEmail = (!email || email.startsWith('guest_')) ? 'Email não informado' : email;
      const displayName = CONFIG.FAIR_MODE ? name : maskUserName(name);
      return {
        position: index + 1,
        userId: score.userId,
        userName: displayName,
        userEmail: displayEmail,
        score: score.totalScore,
        topic: score.topic,
        difficulty: score.difficulty,
        completedAt: score.completedAt
      };
    });
}
