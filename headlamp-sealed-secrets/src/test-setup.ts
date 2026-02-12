/**
 * Test setup for Vitest
 *
 * Provides global mocks and utilities for testing
 */

import { beforeAll } from 'vitest';

// Mock localStorage for tests
const localStorageMock = {
  getItem: (key: string) => {
    return null;
  },
  setItem: (key: string, value: string) => {
    //noop
  },
  removeItem: (key: string) => {
    // noop
  },
  clear: () => {
    // noop
  },
};

beforeAll(() => {
  global.localStorage = localStorageMock as any;
});
