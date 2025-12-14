import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../crypto';

describe('crypto service', () => {
  describe('hashPassword', () => {
    it('should generate a 64-character hex hash', async () => {
      const hash = await hashPassword('testpassword');
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate consistent hashes for the same password', async () => {
      const password = 'mypassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different passwords', async () => {
      const hash1 = await hashPassword('password1');
      const hash2 = await hashPassword('password2');
      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty strings', async () => {
      const hash = await hashPassword('');
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should handle special characters', async () => {
      const hash = await hashPassword('p@ssw0rd!#$%^&*()');
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('verifyPassword', () => {
    it('should return true for matching password and hash', async () => {
      const password = 'testpassword';
      const hash = await hashPassword(password);
      const result = await verifyPassword(password, hash);
      expect(result).toBe(true);
    });

    it('should return false for non-matching password and hash', async () => {
      const password = 'correctpassword';
      const wrongPassword = 'wrongpassword';
      const hash = await hashPassword(password);
      const result = await verifyPassword(wrongPassword, hash);
      expect(result).toBe(false);
    });

    it('should be case-sensitive', async () => {
      const password = 'Password';
      const hash = await hashPassword(password);
      const result = await verifyPassword('password', hash);
      expect(result).toBe(false);
    });

    it('should handle empty password verification', async () => {
      const hash = await hashPassword('');
      const result = await verifyPassword('', hash);
      expect(result).toBe(true);
    });
  });
});
