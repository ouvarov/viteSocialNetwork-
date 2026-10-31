import type { FeedItemTypes } from '@/features/posts/types.ts';

const uniqueById = (items: FeedItemTypes[]): FeedItemTypes[] => {
  const seenIds = new Set<string>();

  return items.filter(({ id }) => {
    if (seenIds.has(id)) return false;

    seenIds.add(id);
    return true;
  });
};

const firstFromEveryone = (items: FeedItemTypes[]): number =>
  items.findIndex(({ fromFollowing }) => !fromFollowing);

export { firstFromEveryone, uniqueById };
