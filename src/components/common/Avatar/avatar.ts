const AVATAR_COLOR_COUNT = 6;
const MAX_INITIALS = 2;
const FALLBACK_INITIAL = '?';

const getInitials = (name: string): string => {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, MAX_INITIALS)
    .map((word) => Array.from(word)[0]?.toLocaleUpperCase() ?? '')
    .join('');

  return initials || FALLBACK_INITIAL;
};

const getAvatarColor = (userId: string): number => {
  const hash = Array.from(userId).reduce(
    (sum, char) => (sum * 31 + (char.codePointAt(0) ?? 0)) >>> 0,
    0,
  );

  return (hash % AVATAR_COLOR_COUNT) + 1;
};

export { AVATAR_COLOR_COUNT, getAvatarColor, getInitials };
