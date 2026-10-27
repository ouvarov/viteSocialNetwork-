import { describe, expect, it } from 'vitest';

import { ApiError, getApiErrorMessage, unwrap } from './errors.ts';

describe('getApiErrorMessage', () => {
  it('uses the message from the API', () => {
    const error = new ApiError(409, { message: 'Email is already registered' });

    expect(getApiErrorMessage(error, 'Fallback')).toBe(
      'Email is already registered',
    );
  });

  it('joins validation messages', () => {
    const error = new ApiError(400, {
      message: ['email must be an email', 'password is too short'],
    });

    expect(getApiErrorMessage(error, 'Fallback')).toBe(
      'email must be an email. password is too short',
    );
  });

  it('explains rate limiting in plain words', () => {
    expect(
      getApiErrorMessage(
        new ApiError(429, { message: 'ThrottlerException' }),
        'x',
      ),
    ).toBe('Too many attempts. Try again in a minute.');
  });

  it.each([
    ['a network error', new TypeError('Failed to fetch')],
    ['an API error without a message', new ApiError(500, undefined)],
  ])('falls back for %s', (_case, error) => {
    expect(getApiErrorMessage(error, 'Could not log in')).toBe(
      'Could not log in',
    );
  });
});

describe('unwrap', () => {
  it('returns the data of a successful response', async () => {
    const result = unwrap(
      Promise.resolve({ data: { id: 1 }, response: new Response(null) }),
    );

    await expect(result).resolves.toEqual({ id: 1 });
  });

  it('throws an ApiError with the status and body', async () => {
    const result = unwrap(
      Promise.resolve({
        error: { message: 'Post not found' },
        response: new Response(null, { status: 404 }),
      }),
    );

    await expect(result).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
      message: 'Post not found',
    });
  });
});
