import { describe, it, expect } from 'vitest';
import { addYears, parseDate, isDateInRange, round2, getTodayDateString } from '../utils';

describe('addYears', () => {
  it('adds years to a date without mutating the original', () => {
    const original = new Date('2024-01-01');
    const result = addYears(original, 5);
    expect(result.getFullYear()).toBe(2029);
    expect(original.getFullYear()).toBe(2024); // not mutated
  });

  it('handles adding 0 years', () => {
    const d = new Date('2025-06-15');
    expect(addYears(d, 0).getFullYear()).toBe(2025);
  });

  it('handles negative years', () => {
    const d = new Date('2025-01-01');
    expect(addYears(d, -3).getFullYear()).toBe(2022);
  });
});

describe('parseDate', () => {
  it('parses ISO date strings to midnight UTC', () => {
    const d = parseDate('2025-03-15');
    expect(d.getUTCFullYear()).toBe(2025);
    expect(d.getUTCMonth()).toBe(2); // 0-indexed
    expect(d.getUTCDate()).toBe(15);
  });
});

describe('isDateInRange', () => {
  const start = new Date('2024-01-01');
  const end = new Date('2026-01-01');

  it('returns true for date within range', () => {
    expect(isDateInRange(new Date('2025-06-01'), start, end)).toBe(true);
  });

  it('returns true for date equal to start (inclusive)', () => {
    expect(isDateInRange(start, start, end)).toBe(true);
  });

  it('returns false for date equal to end (exclusive)', () => {
    expect(isDateInRange(end, start, end)).toBe(false);
  });

  it('returns false for date before range', () => {
    expect(isDateInRange(new Date('2023-12-31'), start, end)).toBe(false);
  });
});

describe('round2', () => {
  it('rounds to 2 decimal places', () => {
    expect(round2(1.234)).toBe(1.23);
    expect(round2(1.235)).toBe(1.24);
    expect(round2(100.1)).toBe(100.1);
    expect(round2(100.009)).toBe(100.01);
  });

  it('handles whole numbers', () => {
    expect(round2(100)).toBe(100);
  });
});

describe('getTodayDateString', () => {
  it('returns a valid ISO date string', () => {
    const result = getTodayDateString();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
