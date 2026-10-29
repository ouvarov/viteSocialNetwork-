import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '@/test/render.tsx';
import { API, http, HttpResponse, server, session } from '@/test/server.ts';

import { Registration } from './index.tsx';

describe('Registration', () => {
  it('validates every field before calling the API', async () => {
    const { user } = renderWithProviders(<Registration />);

    await user.type(screen.getByLabelText('Your name'), '   ');
    await user.type(screen.getByLabelText('Your email'), 'not-an-email');
    await user.type(screen.getByLabelText('Your password'), 'short');
    await user.click(screen.getByRole('button', { name: 'Sign up' }));

    expect(screen.getByLabelText('Your name')).toHaveAccessibleDescription(
      'Enter your name',
    );
    expect(screen.getByLabelText('Your email')).toHaveAccessibleDescription(
      'Enter a valid email',
    );
    expect(screen.getByLabelText('Your password')).toHaveAccessibleDescription(
      'Use at least 8 characters',
    );
  });

  it.each([
    ['73 ascii characters', 'a'.repeat(73)],
    ['37 two-byte characters', 'ж'.repeat(37)],
  ])(
    'rejects a password bcrypt would cut short: %s',
    async (_case, password) => {
      const { user } = renderWithProviders(<Registration />);

      await user.click(screen.getByLabelText('Your password'));
      await user.paste(password);
      await user.tab();

      expect(
        screen.getByLabelText('Your password'),
      ).toHaveAccessibleDescription('Password is too long');
    },
  );

  it('accepts a password of exactly 72 bytes', async () => {
    const { user } = renderWithProviders(<Registration />);

    await user.click(screen.getByLabelText('Your password'));
    await user.paste('ж'.repeat(36));
    await user.tab();

    expect(
      screen.getByLabelText('Your password'),
    ).not.toHaveAccessibleDescription();
  });

  it('rejects a name longer than 50 characters', async () => {
    const { user } = renderWithProviders(<Registration />);

    await user.click(screen.getByLabelText('Your name'));
    await user.paste('a'.repeat(51));
    await user.tab();

    expect(screen.getByLabelText('Your name')).toHaveAccessibleDescription(
      'Use at most 50 characters',
    );
  });

  it('shows that the email is taken', async () => {
    server.use(
      http.post(`${API}/auth/register`, () =>
        HttpResponse.json(
          { message: 'Email is already registered' },
          { status: 409 },
        ),
      ),
    );
    const { user, auth } = renderWithProviders(<Registration />);

    await user.type(screen.getByLabelText('Your name'), 'Ada');
    await user.type(screen.getByLabelText('Your email'), 'ada@example.com');
    await user.type(screen.getByLabelText('Your password'), 'correct-horse');
    await user.click(screen.getByRole('button', { name: 'Sign up' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'An account with this email already exists.',
    );
    expect(
      within(alert).getByRole('link', { name: 'Sign in instead' }),
    ).toBeInTheDocument();
    expect(auth.login).not.toHaveBeenCalled();
  });

  it('signs the new user in', async () => {
    server.use(
      http.post(`${API}/auth/register`, () =>
        HttpResponse.json(session(), { status: 201 }),
      ),
    );
    const { user, auth } = renderWithProviders(<Registration />);

    await user.type(screen.getByLabelText('Your name'), 'Ada');
    await user.type(screen.getByLabelText('Your email'), 'ada@example.com');
    await user.type(screen.getByLabelText('Your password'), 'correct-horse');
    await user.click(screen.getByRole('button', { name: 'Sign up' }));

    expect(auth.login).toHaveBeenCalledWith(session());
  });
});
