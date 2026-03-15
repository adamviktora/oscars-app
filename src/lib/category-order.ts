export const CATEGORY_ORDER = [
  'best-picture',
  'director',
  'actor',
  'actress',
  'supporting-actor',
  'supporting-actress',
  'casting',
  'original-screenplay',
  'adapted-screenplay',
  'camera',
  'film-editing',
  'music',
  'song',
  'production-design',
  'costume-design',
  'makeup',
  'sound',
  'visual-effects',
  'international',
  'animated-feature',
  'documentary',
  'short-live-action',
  'short-animated',
  'short-documentary',
];

export function sortByCategory<T extends { slug: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aIndex = CATEGORY_ORDER.indexOf(a.slug);
    const bIndex = CATEGORY_ORDER.indexOf(b.slug);
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
}
