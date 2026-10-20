/** Environment-driven configuration helpers. */

/** Base URL of the backend API, e.g. http://localhost:8000/api/v1. */
export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
}
