import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema, apiKeySchema } from '../../utils/validation';

describe('Validation Schema Tests', () => {
  describe('Register Schema', () => {
    const validData = {
      name: 'Joao Silva',
      email: 'joao@example.com',
      password: 'StrongPassword123!',
      confirmPassword: 'StrongPassword123!',
      termsAccepted: true
    };

    it('should validate complete valid registration data', () => {
      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject passwords that are too short', () => {
      const invalid = { ...validData, password: 'Short1!', confirmPassword: 'Short1!' };
      const result = registerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject passwords without uppercase letters', () => {
      const invalid = { ...validData, password: 'password123!', confirmPassword: 'password123!' };
      const result = registerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject passwords that do not match confirmation', () => {
      const invalid = { ...validData, confirmPassword: 'DifferentPassword123!' };
      const result = registerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject passwords equal to the user name', () => {
      const invalid = { ...validData, password: 'Joao Silva', confirmPassword: 'Joao Silva' };
      const result = registerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject if terms of service are not accepted', () => {
      const invalid = { ...validData, termsAccepted: false };
      const result = registerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('Login Schema', () => {
    it('should validate correct login fields', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'Password123'
      });
      expect(result.success).toBe(true);
    });
  });

  describe('ApiKey Schema', () => {
    it('should accept valid gemini api key starting with AIzaSy', () => {
      const result = apiKeySchema.safeParse({
        provider: 'gemini',
        apiKey: 'AIzaSyTestApiKey12345'
      });
      expect(result.success).toBe(true);
    });

    it('should reject api key not starting with AIzaSy', () => {
      const result = apiKeySchema.safeParse({
        provider: 'gemini',
        apiKey: 'invalidKey123'
      });
      expect(result.success).toBe(false);
    });
  });
});
