import { describe, expect, it } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import { apiErrorMessage, apiFieldErrors } from '../apiErrorMessage';

function axiosErrorWith(status: number, data: unknown): AxiosError {
  const headers = new AxiosHeaders();
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
    status,
    statusText: 'Error',
    data,
    headers,
    config: { headers },
  });
}

describe('apiErrorMessage', () => {
  it('prefers the first validation error message', () => {
    const error = axiosErrorWith(422, {
      message: 'The given data was invalid.',
      errors: { pin: ['The pin field is required.'], name: ['Name is required.'] },
    });
    expect(apiErrorMessage(error)).toBe('The pin field is required.');
  });

  it('falls back to the top-level message', () => {
    const error = axiosErrorWith(403, { message: 'Forbidden.' });
    expect(apiErrorMessage(error)).toBe('Forbidden.');
  });

  it('reports timeout errors', () => {
    const error = new AxiosError('timeout', 'ECONNABORTED');
    expect(apiErrorMessage(error)).toMatch(/timed out/i);
  });

  it('reports unreachable server when there is no response', () => {
    const error = new AxiosError('Network Error');
    expect(apiErrorMessage(error)).toMatch(/unable to reach the server/i);
  });

  it('uses the fallback for non-axios errors', () => {
    expect(apiErrorMessage(new Error('boom'))).toBe('Something went wrong. Please try again.');
    expect(apiErrorMessage(new Error('boom'), 'Custom')).toBe('Custom');
  });
});

describe('apiFieldErrors', () => {
  it('maps fields to their first message', () => {
    const error = axiosErrorWith(422, {
      errors: { pin: ['Required.'], name: ['Too long.', 'Extra.'] },
    });
    expect(apiFieldErrors(error)).toEqual({ pin: 'Required.', name: 'Too long.' });
  });

  it('returns an empty object when there are no field errors', () => {
    expect(apiFieldErrors(new Error('boom'))).toEqual({});
    expect(apiFieldErrors(axiosErrorWith(500, { message: 'Oops' }))).toEqual({});
  });
});
