import { describe, it, expect } from 'vitest';
import { encryptApiKey, decryptApiKey } from '../../utils/encryption';

describe('Encryption Utils', () => {
  it('should encrypt and decrypt a string successfully', async () => {
    const plainText = 'AIzaSyTestApiKey123';
    const password = 'UserPassword123!';

    const encrypted = await encryptApiKey(plainText, password);
    expect(encrypted.ciphertext).toBeDefined();
    expect(encrypted.iv).toBeDefined();
    expect(encrypted.salt).toBeDefined();

    const decrypted = await decryptApiKey(encrypted, password);
    expect(decrypted).toBe(plainText);
  });

  it('should fail to decrypt with wrong password', async () => {
    const plainText = 'AIzaSyTestApiKey123';
    const password = 'UserPassword123!';

    const encrypted = await encryptApiKey(plainText, password);
    await expect(decryptApiKey(encrypted, 'WrongPassword1!')).rejects.toThrow();
  });
});
