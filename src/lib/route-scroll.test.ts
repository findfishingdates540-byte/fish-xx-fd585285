import { describe, expect, it } from 'vitest';
import { getRestoredScrollPosition } from './route-scroll';

describe('getRestoredScrollPosition', () => {
  it('restores the previous list position when returning with Back', () => {
    expect(getRestoredScrollPosition('POP', 640)).toBe(640);
  });

  it('starts a newly opened profile at the top', () => {
    expect(getRestoredScrollPosition('PUSH', 640)).toBeNull();
  });

  it('starts at the top when no saved position exists', () => {
    expect(getRestoredScrollPosition('POP', undefined)).toBeNull();
  });
});