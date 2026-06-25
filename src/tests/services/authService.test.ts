import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from '../../services/authService';
import { sessionStore } from '../../services/sessionStore';

describe('AuthService Tests', () => {
  beforeEach(() => {
    sessionStore.clearAll();
  });

  it('should register a new user successfully', async () => {
    const registerInput = {
      name: 'Mario Silva',
      email: 'mario@example.com',
      password: 'StrongPassword123!',
      confirmPassword: 'StrongPassword123!',
      termsAccepted: true
    };

    const response = await authService.register(registerInput);
    expect(response.success).toBe(true);
    expect(response.userId).toBeDefined();

    const savedUser = sessionStore.getUser(response.userId!);
    expect(savedUser).not.toBeNull();
    expect(savedUser!.name).toBe('Mario Silva');
    expect(savedUser!.emailVerified).toBe(false);
  });

  it('should login successfully with correct credentials', async () => {
    const email = 'login@example.com';
    const password = 'StrongPassword123!';

    await authService.register({
      name: 'User Login',
      email,
      password,
      confirmPassword: password,
      termsAccepted: true
    });

    // Verify login is locked to verified email by default? 
    // Wait, the prompt requirements say: 
    // "if (!user.emailVerified) { throw new Error('Please verify your email before logging in') }"
    // So let's mock or perform verification before logging in!
    const user = sessionStore.findUserByEmail(email);
    expect(user).not.toBeNull();
    user!.emailVerified = true;
    sessionStore.saveUser(user!);

    const loginResponse = await authService.login({ email, password });
    expect(loginResponse.success).toBe(true);
    expect(loginResponse.token).toBeDefined();
    expect(loginResponse.user.name).toBe('User Login');
  });

  it('should lock out user after 5 failed login attempts', async () => {
    const email = 'lockout@example.com';
    const password = 'StrongPassword123!';

    await authService.register({
      name: 'User Lock',
      email,
      password,
      confirmPassword: password,
      termsAccepted: true
    });

    // Make 5 failed attempts
    for (let i = 0; i < 5; i++) {
      try {
        await authService.login({ email, password: 'WrongPassword1!' });
      } catch (err) {
        // Expected
      }
    }

    // 6th attempt should trigger rate limit error
    await expect(authService.login({ email, password })).rejects.toThrow(
      /Muitas tentativas/
    );
  });

  it('should login/register fair user with all fields provided', async () => {
    const response = await authService.loginFair('Carlos Alberto', 'carlos@feira.com');
    expect(response.success).toBe(true);
    expect(response.user.name).toBe('Carlos Alberto');
    expect(response.user.email).toBe('carlos@feira.com');
    expect(response.user.emailVerified).toBe(true);
  });

  it('should login/register fair user with optional fields missing', async () => {
    const response = await authService.loginFair();
    expect(response.success).toBe(true);
    expect(response.user.name).toBe('Jogador não informado');
    expect(response.user.email).toContain('guest_');
    expect(response.user.email).toContain('@feira.local');
  });

  it('should retrieve existing user if email matches in fair mode', async () => {
    const email = 'existing@feira.com';
    const firstRes = await authService.loginFair('First Name', email);
    const secondRes = await authService.loginFair('Second Name', email);
    expect(firstRes.user.id).toBe(secondRes.user.id);
  });

  it('should call fetch and return true on successful email send', async () => {
    const response = await authService.register({
      name: 'Mario Silva',
      email: 'mario@example.com',
      password: 'StrongPassword123!',
      confirmPassword: 'StrongPassword123!',
      termsAccepted: true
    });

    const mockFetch = vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response)
    );

    const emailSent = await authService.sendVerificationEmail(response.userId, 'mario@example.com');
    expect(emailSent).toBe(true);
    expect(mockFetch).toHaveBeenCalled();

    mockFetch.mockRestore();
  });

  describe('updateProfile', () => {
    it('should update the name without requiring current password', async () => {
      const response = await authService.register({
        name: 'User Update',
        email: 'update@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        termsAccepted: true
      });

      const updated = await authService.updateProfile(response.userId, '', { name: 'Novo Nome' });
      expect(updated.name).toBe('Novo Nome');
      expect(updated.email).toBe('update@example.com');
    });

    it('should fail to update email if current password is wrong', async () => {
      const response = await authService.register({
        name: 'User Update',
        email: 'update_email@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        termsAccepted: true
      });

      await expect(
        authService.updateProfile(response.userId, 'WrongPassword', { email: 'new@example.com' })
      ).rejects.toThrow('Senha atual incorreta');
    });

    it('should update email and password if current password is correct', async () => {
      const response = await authService.register({
        name: 'User Update',
        email: 'update_email2@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        termsAccepted: true
      });

      const updated = await authService.updateProfile(response.userId, 'Password123!', {
        email: 'new_email@example.com',
        password: 'NewPassword123!'
      });

      expect(updated.email).toBe('new_email@example.com');
      
      // Verify user can login with new credentials
      updated.emailVerified = true;
      sessionStore.saveUser(updated);

      const loginRes = await authService.login({
        email: 'new_email@example.com',
        password: 'NewPassword123!'
      });
      expect(loginRes.success).toBe(true);
    });
  });
});
