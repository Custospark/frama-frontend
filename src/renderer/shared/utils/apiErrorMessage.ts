import { isAxiosError } from 'axios';

/** Extract a user-facing message from an API error, preferring Laravel's
 *  `message` and the first validation error when present. */
export function apiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; errors?: Record<string, string[]> }
      | undefined;

    if (data?.errors) {
      const first = Object.values(data.errors)[0];
      if (Array.isArray(first) && first.length > 0) return first[0];
    }

    if (data?.message) return data.message;
    if (error.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
    if (!error.response) return 'Unable to reach the server. Check your connection.';
  }

  return fallback;
}

/** Map of field => first error message, for inline form validation display. */
export function apiFieldErrors(error: unknown): Record<string, string> {
  if (isAxiosError(error)) {
    const data = error.response?.data as { errors?: Record<string, string[]> } | undefined;
    if (data?.errors) {
      return Object.fromEntries(
        Object.entries(data.errors).map(([field, messages]) => [field, messages[0] ?? '']),
      );
    }
  }
  return {};
}
