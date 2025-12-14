import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateEventId,
  eventIdExists,
  generateUniqueEventId,
} from '../idGenerator';

describe('idGenerator', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('generateEventId', () => {
    it('should generate an 8-character ID', () => {
      const id = generateEventId();
      expect(id).toHaveLength(8);
    });

    it('should only contain lowercase letters and numbers', () => {
      const id = generateEventId();
      expect(id).toMatch(/^[a-z0-9]{8}$/);
    });

    it('should generate different IDs on multiple calls', () => {
      const id1 = generateEventId();
      const id2 = generateEventId();
      const id3 = generateEventId();

      // While theoretically possible to be the same, extremely unlikely
      expect(new Set([id1, id2, id3]).size).toBeGreaterThan(1);
    });
  });

  describe('eventIdExists', () => {
    it('should return false for non-existent ID', () => {
      expect(eventIdExists('abc12345')).toBe(false);
    });

    it('should return true for existing ID', () => {
      localStorage.setItem('event:abc12345', '{}');
      expect(eventIdExists('abc12345')).toBe(true);
    });
  });

  describe('generateUniqueEventId', () => {
    it('should generate a unique ID', () => {
      const id = generateUniqueEventId();
      expect(id).toHaveLength(8);
      expect(eventIdExists(id)).toBe(false);
    });

    it('should retry if collision occurs', () => {
      // Pre-populate some IDs
      localStorage.setItem('event:aaaaaaaa', '{}');
      localStorage.setItem('event:bbbbbbbb', '{}');

      const id = generateUniqueEventId();
      expect(id).not.toBe('aaaaaaaa');
      expect(id).not.toBe('bbbbbbbb');
    });
  });
});
