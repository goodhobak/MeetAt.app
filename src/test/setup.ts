import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup after each test
afterEach(() => {
  cleanup();
  localStorage.clear();
});

// Mock Web Crypto API for tests
if (typeof globalThis.crypto === 'undefined') {
  const crypto = require('crypto');
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      subtle: {
        digest: async (algorithm: string, data: Uint8Array) => {
          const hash = crypto.createHash('sha256');
          hash.update(data);
          return hash.digest();
        },
      },
      randomUUID: () => crypto.randomUUID(),
    },
  });
}
