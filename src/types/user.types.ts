import type { ApiKeyInfo } from './apiKey.types';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  emailVerified: boolean;
  apiKey?: ApiKeyInfo;
  createdAt: string;
}
