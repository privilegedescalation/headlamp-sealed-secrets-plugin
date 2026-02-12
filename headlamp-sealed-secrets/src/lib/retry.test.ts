/**
 * Unit tests for retry logic
 *
 * Tests exponential backoff with jitter
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { retryWithBackoff } from './retry';

describe('retry logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('retryWithBackoff', () => {
    it('should return result on first success', async () => {
      const successFn = vi.fn().mockResolvedValue({ ok: true, value: 'success' });

      const promise = retryWithBackoff(successFn, { maxAttempts: 3, initialDelayMs: 100 });
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('success');
      }
      expect(successFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      const failTwiceThenSucceed = vi
        .fn()
        .mockResolvedValueOnce({ ok: false, error: 'error1' })
        .mockResolvedValueOnce({ ok: false, error: 'error2' })
        .mockResolvedValueOnce({ ok: true, value: 'success' });

      const promise = retryWithBackoff(failTwiceThenSucceed, { maxAttempts: 3, initialDelayMs: 100 });
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('success');
      }
      expect(failTwiceThenSucceed).toHaveBeenCalledTimes(3);
    });

    it('should return aggregated error after max attempts', async () => {
      const alwaysFail = vi.fn().mockResolvedValue({ ok: false, error: 'persistent error' });

      const promise = retryWithBackoff(alwaysFail, { maxAttempts: 3, initialDelayMs: 100 });
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result.ok).toBe(false);
      if (result.ok === false) {
        expect(result.error).toContain('Operation failed after 3 attempts');
        expect(result.error).toContain('persistent error');
      }
      expect(alwaysFail).toHaveBeenCalledTimes(3);
    });

    it('should apply exponential backoff', async () => {
      const failTwiceThenSucceed = vi
        .fn()
        .mockResolvedValueOnce({ ok: false, error: 'error1' })
        .mockResolvedValueOnce({ ok: false, error: 'error2' })
        .mockResolvedValueOnce({ ok: true, value: 'success' });

      const promise = retryWithBackoff(failTwiceThenSucceed, { maxAttempts: 3, initialDelayMs: 1000 });

      // Fast-forward through retries
      await vi.runAllTimersAsync();
      await promise;

      // Should have been called 3 times (initial + 2 retries)
      expect(failTwiceThenSucceed).toHaveBeenCalledTimes(3);
    });

    it('should handle function that throws', async () => {
      const throwingFn = vi.fn().mockRejectedValue(new Error('Network error'));

      const promise = retryWithBackoff(throwingFn, { maxAttempts: 3, initialDelayMs: 100 });
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result.ok).toBe(false);
      if (result.ok === false) {
        expect(result.error).toContain('Network error');
      }
      expect(throwingFn).toHaveBeenCalledTimes(3);
    });

    it('should retry exactly maxAttempts times', async () => {
      const alwaysFail = vi.fn().mockResolvedValue({ ok: false, error: 'error' });

      const promise = retryWithBackoff(alwaysFail, { maxAttempts: 5, initialDelayMs: 100 });
      await vi.runAllTimersAsync();
      await promise;

      expect(alwaysFail).toHaveBeenCalledTimes(5);
    });

    it('should handle single attempt', async () => {
      const failOnce = vi.fn().mockResolvedValue({ ok: false, error: 'error' });

      const promise = retryWithBackoff(failOnce, { maxAttempts: 1, initialDelayMs: 100 });
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result.ok).toBe(false);
      expect(failOnce).toHaveBeenCalledTimes(1);
    });

    it('should apply jitter to delay', async () => {
      // Mock Math.random to return predictable values
      const originalRandom = Math.random;
      let callCount = 0;
      Math.random = () => {
        callCount++;
        return callCount === 1 ? 0.5 : 0.8; // Different jitter values
      };

      const failTwice = vi
        .fn()
        .mockResolvedValueOnce({ ok: false, error: 'error1' })
        .mockResolvedValueOnce({ ok: false, error: 'error2' })
        .mockResolvedValueOnce({ ok: true, value: 'success' });

      const promise = retryWithBackoff(failTwice, { maxAttempts: 3, initialDelayMs: 1000 });
      await vi.runAllTimersAsync();
      await promise;

      Math.random = originalRandom;
      expect(failTwice).toHaveBeenCalledTimes(3);
    });

    it('should work with different base delays', async () => {
      const failOnce = vi
        .fn()
        .mockResolvedValueOnce({ ok: false, error: 'error' })
        .mockResolvedValueOnce({ ok: true, value: 'success' });

      // Test with 500ms base delay
      const promise = retryWithBackoff(failOnce, { maxAttempts: 2, initialDelayMs: 500 });
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result.ok).toBe(true);
      expect(failOnce).toHaveBeenCalledTimes(2);
    });

    it('should preserve error messages in aggregate', async () => {
      const specificError = vi.fn().mockResolvedValue({
        ok: false,
        error: 'Certificate expired on 2024-01-01',
      });

      const promise = retryWithBackoff(specificError, { maxAttempts: 2, initialDelayMs: 100 });
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result.ok).toBe(false);
      if (result.ok === false) {
        expect(result.error).toContain('Certificate expired on 2024-01-01');
        expect(result.error).toContain('2024-01-01');
      }
    });
  });

  describe('edge cases', () => {
    it('should handle immediate success', async () => {
      const immediate = vi.fn().mockResolvedValue({ ok: true, value: 42 });

      const result = await retryWithBackoff(immediate, { maxAttempts: 1, initialDelayMs: 100 });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(42);
      }
      expect(immediate).toHaveBeenCalledTimes(1);
    });

    it('should handle null values', async () => {
      const nullValue = vi.fn().mockResolvedValue({ ok: true, value: null });

      const result = await retryWithBackoff(nullValue, { maxAttempts: 3, initialDelayMs: 100 });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(null);
      }
    });

    it('should handle empty error messages', async () => {
      const emptyError = vi.fn().mockResolvedValue({ ok: false, error: '' });

      const promise = retryWithBackoff(emptyError, { maxAttempts: 2, initialDelayMs: 100 });
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result.ok).toBe(false);
      if (result.ok === false) {
        expect(result.error).toContain('Operation failed');
      }
    });

    it('should use default options when not provided', async () => {
      const successFn = vi.fn().mockResolvedValue({ ok: true, value: 'default success' });

      const result = await retryWithBackoff(successFn);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('default success');
      }
    });
  });
});
