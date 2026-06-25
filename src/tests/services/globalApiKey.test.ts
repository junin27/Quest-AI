import { describe, it, expect, beforeEach } from 'vitest';

describe('Global API Key Storage Tests', () => {
  const STORAGE_KEY = 'quiz_app_global_api_key';

  beforeEach(() => {
    localStorage.clear();
  });

  it('should save API key globally in localStorage', () => {
    const testKey = 'AIzaSyTestApiKey12345';
    localStorage.setItem(STORAGE_KEY, testKey);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(testKey);
  });

  it('should retrieve correct key after setting it', () => {
    const testKey = 'AIzaSyTestApiKey67890';
    localStorage.setItem(STORAGE_KEY, testKey);
    const retrieved = localStorage.getItem(STORAGE_KEY);
    expect(retrieved).toBe(testKey);
  });

  it('should return null when key is not set', () => {
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('should delete key correctly from localStorage', () => {
    localStorage.setItem(STORAGE_KEY, 'AIzaSyTestApiKeyToDelete');
    localStorage.removeItem(STORAGE_KEY);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('should support mock key for testing', () => {
    localStorage.setItem(STORAGE_KEY, 'mock-key-for-testing');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('mock-key-for-testing');
  });
});
