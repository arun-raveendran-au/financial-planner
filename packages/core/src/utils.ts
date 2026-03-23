/**
 * Returns today's date as an ISO date string (YYYY-MM-DD).
 */
export const getTodayDateString = (): string =>
  new Date().toISOString().split('T')[0]!;

/**
 * Adds `years` to a Date and returns a new Date (does not mutate).
 */
export const addYears = (date: Date, years: number): Date => {
  const newDate = new Date(date);
  newDate.setFullYear(newDate.getFullYear() + years);
  return newDate;
};

/**
 * Parses an ISO date string into a Date at midnight UTC.
 */
export const parseDate = (isoString: string): Date =>
  new Date(isoString + 'T00:00:00Z');

/**
 * Returns true if `date` is within [start, end).
 */
export const isDateInRange = (date: Date, start: Date, end: Date): boolean =>
  date >= start && date < end;

/**
 * Rounds to 2 decimal places to avoid floating-point accumulation.
 */
export const round2 = (n: number): number => Math.round(n * 100) / 100;
