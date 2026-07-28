import type { User } from '../types/user.types';
import type { Score } from '../types/quiz.types';

export interface SessionData {
  currentUserId: string | null;
  token: string | null;
  tokenExpiresAt: string | null;
}

export interface StorageSchema {
  quiz_app_users: Record<string, User>;
  quiz_app_scores: Record<string, Score>;
  quiz_app_session: SessionData;
  quiz_app_archived_scores: Array<Score & { archived: boolean; archivedAt: string }>;
}

const STORAGE_KEY = 'quiz_app_storage';

export class SessionStore {
  private schema: StorageSchema = {
    quiz_app_users: {},
    quiz_app_scores: {},
    quiz_app_session: {
      currentUserId: null,
      token: null,
      tokenExpiresAt: null
    },
    quiz_app_archived_scores: []
  };

  constructor() {
    this.initializeStorage();
  }

  private initializeStorage(): void {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      this.saveSchema();
    } else {
      try {
        this.schema = JSON.parse(data);
      } catch {
        this.saveSchema();
      }
    }
  }

  private saveSchema(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.schema));
  }

  saveUser(user: User): void {
    this.schema.quiz_app_users[user.id] = user;
    this.saveSchema();
  }

  getUser(userId: string): User | null {
    return this.schema.quiz_app_users[userId] || null;
  }

  findUserByEmail(email: string): User | null {
    const emailLower = email.toLowerCase().trim();
    return Object.values(this.schema.quiz_app_users)
      .find((u) => u.email.toLowerCase() === emailLower) || null;
  }

  saveScore(score: Score): void {
    this.schema.quiz_app_scores[score.id] = score;
    this.saveSchema();
  }

  getScores(userId: string): Score[] {
    return Object.values(this.schema.quiz_app_scores)
      .filter((s) => s.userId === userId);
  }

  getAllScores(): Score[] {
    return Object.values(this.schema.quiz_app_scores);
  }

  setSession(sessionData: SessionData): void {
    this.schema.quiz_app_session = sessionData;
    this.saveSchema();
  }

  getSession(): SessionData {
    return this.schema.quiz_app_session;
  }

  clearSession(): void {
    this.schema.quiz_app_session = {
      currentUserId: null,
      token: null,
      tokenExpiresAt: null
    };
    this.saveSchema();
  }

  clearUserScores(userId: string): void {
    const remainingScores: Record<string, Score> = {};
    for (const [id, score] of Object.entries(this.schema.quiz_app_scores)) {
      if (score.userId !== userId) {
        remainingScores[id] = score;
      }
    }
    this.schema.quiz_app_scores = remainingScores;
    this.saveSchema();
  }

  clearAll(): void {
    this.schema = {
      quiz_app_users: {},
      quiz_app_scores: {},
      quiz_app_session: {
        currentUserId: null,
        token: null,
        tokenExpiresAt: null
      },
      quiz_app_archived_scores: []
    };
    this.saveSchema();
  }
}

export const sessionStore = new SessionStore();
