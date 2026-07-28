import type { User } from './user.types';
import type { Score } from './quiz.types';
import type { SessionData } from './auth.types';

export interface StorageSchema {
  quiz_app_users: Record<string, User>;
  quiz_app_scores: Record<string, Score>;
  quiz_app_session: SessionData;
  quiz_app_archived_scores: Score[];
}
