import { describe, expect, it } from 'vitest';

import { formatRelativeTime } from './relative-time.ts';

const NOW = new Date(2026, 9, 30, 15, 0, 0);
const at = (...parts: [number, number, number, number?, number?]) =>
  new Date(parts[0], parts[1], parts[2], parts[3] ?? 0, parts[4] ?? 0);

describe('formatRelativeTime', () => {
  it.each([
    ['a few seconds ago', new Date(NOW.getTime() - 20_000), 'now'],
    ['minutes ago', new Date(NOW.getTime() - 5 * 60_000), '5m'],
    ['hours ago today', at(2026, 9, 30, 9, 30), '5h'],
    ['late yesterday, under a day ago', at(2026, 9, 29, 23, 0), 'Yesterday'],
    ['early yesterday', at(2026, 9, 29, 1, 0), 'Yesterday'],
    ['earlier this year', at(2026, 9, 24, 12, 0), 'Oct 24'],
    ['last year', at(2025, 9, 24, 12, 0), 'Oct 24, 2025'],
  ])('shows %s as %j', (_case, date, expected) => {
    expect(formatRelativeTime(date, NOW, 'en-US')).toBe(expected);
  });
});
