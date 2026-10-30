import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AVATAR_COLOR_COUNT, getAvatarColor, getInitials } from './avatar.ts';
import { Avatar } from './index.tsx';

const USER_ID = '11111111-1111-4111-8111-111111111111';

describe('Avatar', () => {
  it('shows the photo when there is one', () => {
    const { container } = render(
      <Avatar
        userId={USER_ID}
        userName="Ada Lovelace"
        imageUrl="https://cdn.test/ada.webp"
      />,
    );

    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      'https://cdn.test/ada.webp',
    );
  });

  it('shows the initials without a photo', () => {
    render(<Avatar userId={USER_ID} userName="Ada Lovelace" imageUrl={null} />);

    expect(screen.getByText('AL')).toBeInTheDocument();
  });

  it('falls back to the initials when the photo fails to load', () => {
    const { container } = render(
      <Avatar
        userId={USER_ID}
        userName="Ada Lovelace"
        imageUrl="https://cdn.test/gone.webp"
      />,
    );

    fireEvent.error(container.querySelector('img') as HTMLImageElement);

    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('AL')).toBeInTheDocument();
  });
});

describe('getInitials', () => {
  it.each([
    ['Ada Lovelace', 'AL'],
    ['ada', 'A'],
    ['  Grace   Brewster Hopper ', 'GB'],
    ['олександр уваров', 'ОУ'],
    ['🦊 Fox', '🦊F'],
    ['   ', '?'],
  ])('turns %j into %j', (name, initials) => {
    expect(getInitials(name)).toBe(initials);
  });
});

describe('getAvatarColor', () => {
  it('gives the same user the same color', () => {
    const userId = '11111111-1111-4111-8111-111111111111';

    expect(getAvatarColor(userId)).toBe(getAvatarColor(userId));
  });

  it('stays within the palette', () => {
    const colors = Array.from({ length: 50 }, (_, index) =>
      getAvatarColor(`user-${index}`),
    );

    expect(Math.min(...colors)).toBeGreaterThanOrEqual(1);
    expect(Math.max(...colors)).toBeLessThanOrEqual(AVATAR_COLOR_COUNT);
    expect(new Set(colors).size).toBeGreaterThan(1);
  });
});
