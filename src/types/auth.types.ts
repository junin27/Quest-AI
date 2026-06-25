export interface UserProfile {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
}

export interface SessionData {
  currentUserId: string | null;
  token: string | null;
  tokenExpiresAt: string | null;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: UserProfile;
  error?: string;
  code?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  userId?: string;
  error?: string;
}
