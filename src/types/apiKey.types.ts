export interface EncryptedData {
  ciphertext: string; // base64
  iv: string; // base64
  salt: string; // base64
}

export type LLMProvider = 'gemini' | 'openai' | 'anthropic' | 'deepseek' | 'groq' | 'mistral' | 'openrouter';

export interface ApiKeyInfo {
  provider: LLMProvider;
  modelId?: string;
  encryptedKey: EncryptedData;
  lastFourChars: string;
  createdAt: string;
  lastUsedAt: string;
  isActive: boolean;
}
