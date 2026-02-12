/**
 * Unit tests for Result type helpers
 *
 * Tests the Result<T, E> type system for type-safe error handling
 */

import { describe, expect, it } from 'vitest';
import { Err, Ok, tryCatch, tryCatchAsync } from './types';

describe('Result type system', () => {
  describe('Ok', () => {
    it('should create a successful result', () => {
      const result = Ok(42);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(42);
      }
    });

    it('should create Ok with string value', () => {
      const result = Ok('success');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('success');
      }
    });

    it('should create Ok with object value', () => {
      const obj = { foo: 'bar', count: 42 };
      const result = Ok(obj);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(obj);
        expect(result.value.foo).toBe('bar');
      }
    });

    it('should create Ok with null value', () => {
      const result = Ok(null);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(null);
      }
    });
  });

  describe('Err', () => {
    it('should create an error result', () => {
      const result = Err('Something went wrong');

      expect(result.ok).toBe(false);
      if (result.ok === false) {
        expect(result.error).toBe('Something went wrong');
      }
    });

    it('should create Err with detailed error message', () => {
      const errorMsg = 'Failed to parse certificate: Invalid PEM format';
      const result = Err(errorMsg);

      expect(result.ok).toBe(false);
      if (result.ok === false) {
        expect(result.error).toBe(errorMsg);
        expect(result.error).toContain('certificate');
      }
    });
  });

  describe('Type narrowing', () => {
    it('should narrow type with result.ok === true', () => {
      const result = Ok(42);

      if (result.ok === true) {
        // TypeScript should know result.value exists and is number
        const value: number = result.value;
        expect(value).toBe(42);
      } else {
        throw new Error('Should not reach here');
      }
    });

    it('should narrow type with result.ok === false', () => {
      const result = Err('error message');

      if (result.ok === false) {
        // TypeScript should know result.error exists and is string
        const error: string = result.error;
        expect(error).toBe('error message');
      } else {
        throw new Error('Should not reach here');
      }
    });

    it('should work with explicit boolean check', () => {
      const result = Ok('success');

      // This pattern requires === for type narrowing
      if (result.ok === true) {
        expect(result.value).toBe('success');
      }
    });
  });

  describe('tryCatch', () => {
    it('should return Ok for successful function', () => {
      const result = tryCatch(() => {
        return 2 + 2;
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(4);
      }
    });

    it('should return Err for throwing function', () => {
      const result = tryCatch(() => {
        throw new Error('Calculation failed');
      });

      expect(result.ok).toBe(false);
      if (result.ok === false) {
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error.message).toBe('Calculation failed');
      }
    });

    it('should handle string throws', () => {
      const result = tryCatch(() => {
        throw 'String error';
      });

      expect(result.ok).toBe(false);
      if (result.ok === false) {
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error.message).toBe('String error');
      }
    });

    it('should handle object throws', () => {
      const result = tryCatch(() => {
        throw { code: 'ERR_CUSTOM', message: 'Custom error' };
      });

      expect(result.ok).toBe(false);
      if (result.ok === false) {
        expect(result.error).toBeInstanceOf(Error);
      }
    });

    it('should preserve function return value', () => {
      const result = tryCatch(() => {
        const data = { id: 1, name: 'test' };
        return data;
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual({ id: 1, name: 'test' });
      }
    });
  });

  describe('tryCatchAsync', () => {
    it('should return Ok for successful async function', async () => {
      const result = await tryCatchAsync(async () => {
        return await Promise.resolve('async success');
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('async success');
      }
    });

    it('should return Err for rejected promise', async () => {
      const result = await tryCatchAsync(async () => {
        throw new Error('Async operation failed');
      });

      expect(result.ok).toBe(false);
      if (result.ok === false) {
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error.message).toBe('Async operation failed');
      }
    });

    it('should handle async computation', async () => {
      const result = await tryCatchAsync(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'delayed result';
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('delayed result');
      }
    });

    it('should handle promise rejection', async () => {
      const result = await tryCatchAsync(async () => {
        return await Promise.reject(new Error('Rejected'));
      });

      expect(result.ok).toBe(false);
      if (result.ok === false) {
        expect(result.error.message).toBe('Rejected');
      }
    });

    it('should handle async string throws', async () => {
      const result = await tryCatchAsync(async () => {
        throw 'Async string error';
      });

      expect(result.ok).toBe(false);
      if (result.ok === false) {
        expect(result.error.message).toBe('Async string error');
      }
    });
  });

  describe('Pattern matching', () => {
    it('should work with if-else pattern', () => {
      const divide = (a: number, b: number) => {
        if (b === 0) {
          return Err('Division by zero');
        }
        return Ok(a / b);
      };

      const result1 = divide(10, 2);
      expect(result1.ok).toBe(true);
      if (result1.ok) {
        expect(result1.value).toBe(5);
      }

      const result2 = divide(10, 0);
      expect(result2.ok).toBe(false);
      if (result2.ok === false) {
        expect(result2.error).toBe('Division by zero');
      }
    });

    it('should work with early return pattern', () => {
      const processData = (input: string) => {
        if (!input) {
          return Err('Input is required');
        }

        const trimmed = input.trim();
        if (trimmed.length < 3) {
          return Err('Input too short');
        }

        return Ok(trimmed.toUpperCase());
      };

      expect(processData('').ok).toBe(false);
      expect(processData('ab').ok).toBe(false);

      const result = processData('hello');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('HELLO');
      }
    });

    it('should work with chained operations', () => {
      const parseNumber = (str: string) => {
        const num = parseInt(str, 10);
        if (isNaN(num)) {
          return Err('Not a number');
        }
        return Ok(num);
      };

      const doubleIfEven = (num: number) => {
        if (num % 2 !== 0) {
          return Err('Number is odd');
        }
        return Ok(num * 2);
      };

      const process = (str: string) => {
        const numResult = parseNumber(str);
        if (numResult.ok === false) {
          return Err(`Parse failed: ${numResult.error}`);
        }

        const doubledResult = doubleIfEven(numResult.value);
        if (doubledResult.ok === false) {
          return Err(`Double failed: ${doubledResult.error}`);
        }

        return Ok(doubledResult.value);
      };

      const result1 = process('8');
      expect(result1.ok).toBe(true);
      if (result1.ok) {
        expect(result1.value).toBe(16);
      }

      const result2 = process('7');
      expect(result2.ok).toBe(false);

      const result3 = process('abc');
      expect(result3.ok).toBe(false);
    });
  });
});
