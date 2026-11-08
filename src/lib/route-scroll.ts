export function getRestoredScrollPosition(
  navigationType: string,
  savedPosition: number | undefined,
): number | null {
  if (navigationType !== 'POP' || savedPosition === undefined) return null;
  return savedPosition;
}