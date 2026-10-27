import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '@/test/render.tsx';
import { API, http, HttpResponse, server, session } from '@/test/server.ts';

import { Login } from './index.tsx';

const loginAnswering = (status: number, body: object) => {
  const requests: unknown[] = [];
  server.use(
    http.post(`${API}/auth/login`, async ({ request }) => {
      requests.push(await request.json());
      return HttpResponse.json(body, { status });
    }),
  );

  return requests;
};

const signIn = async (
  user: ReturnType<typeof renderWithProviders>['user'],
  email: string,
  password: string,
) => {
  if (email) await user.type(screen.getByLabelText('Your email'), email);
  if (password) {
    await user.type(screen.getByLabelText('Your password'), password);
  }
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
};

describe('Login', () => {
  it('asks for both fields without calling the API', async () => {
    const requests = loginAnswering(200, session());
    const { user } = renderWithProviders(<Login />);

    await signIn(user, '', '');

    expect(screen.getByLabelText('Your email')).toHaveAccessibleDescription(
      'Enter your email',
    );
    expect(screen.getByLabelText('Your password')).toHaveAccessibleDescription(
      'Enter your password',
    );
    expect(screen.getByLabelText('Your email')).toHaveFocus();
    expect(requests).toEqual([]);
  });

  it('checks the email format once the field is left', async () => {
    const { user } = renderWithProviders(<Login />);

    await user.type(screen.getByLabelText('Your email'), 'ada@');
    await user.tab();

    expect(screen.getByLabelText('Your email')).toBeInvalid();
    expect(screen.getByLabelText('Your email')).toHaveAccessibleDescription(
      'Enter a valid email',
    );
  });

  it('signs in and hands the session to the auth context', async () => {
    const requests = loginAnswering(200, session('access-1'));
    const { user, auth } = renderWithProviders(<Login />);

    await signIn(user, 'ada@example.com', 'correct-horse');

    expect(requests).toEqual([
      { email: 'ada@example.com', password: 'correct-horse' },
    ]);
    expect(auth.login).toHaveBeenCalledWith(session('access-1'));
  });

  it.each([
    [401, { message: 'Invalid credentials' }, 'Invalid credentials'],
    [
      429,
      { message: 'ThrottlerException: Too Many Requests' },
      'Too many attempts. Try again in a minute.',
    ],
  ])('shows the API answer to a %i', async (status, body, message) => {
    loginAnswering(status, body);
    const { user, auth } = renderWithProviders(<Login />);

    await signIn(user, 'ada@example.com', 'wrong-password');

    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(auth.login).not.toHaveBeenCalled();
  });

  it('explains a network failure', async () => {
    server.use(http.post(`${API}/auth/login`, () => HttpResponse.error()));
    const { user } = renderWithProviders(<Login />);

    await signIn(user, 'ada@example.com', 'correct-horse');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not log in',
    );
  });
});
