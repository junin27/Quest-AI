import '@testing-library/jest-dom';

// Mock Web Crypto API if needed in happy-dom, but happy-dom has subtle crypto mock or window.crypto
if (typeof window !== 'undefined' && !window.crypto) {
  Object.defineProperty(window, 'crypto', {
    value: {
      subtle: {
        digest: async () => {
          return new ArrayBuffer(32);
        }
      }
    }
  });
}
