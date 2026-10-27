import { screen } from '@testing-library/react';
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

  it('rejects a password bcrypt would cut short', async () => {
    const { user } = renderWithProviders(<Registration />);

    await user.click(screen.getByLabelText('Your password'));
    await user.paste('a'.repeat(73));
    await user.tab();

    expect(screen.getByLabelText('Your password')).toHaveAccessibleDescription(
      'Use at most 72 characters',
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

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Email is already registered',
    );
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
