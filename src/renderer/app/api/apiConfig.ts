/** API base URL driven by VITE_API_BASE_URL from .env / .env.[mode].
 *  Dev uses .env.development      → http://localhost:8000/api/v1.
 *  Staging uses .env.staging      → https://staging-api.framainvestments.com/api/v1.
 *  Production uses .env (base)    → https://api.framainvestments.com/api/v1.
 *  Fallback: http://localhost:8000/api/v1 (bare local dev without .env). */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const API_TIMEOUT = 60000;

/** Multipart uploads (report attachments, asset files) can be many megabytes on
 *  slow mobile connections — give them a much longer budget than normal calls. */
export const UPLOAD_TIMEOUT = 15 * 60 * 1000; // 15 minutes

/** Zip bundles of every attachment for a report can also be large. */
export const DOWNLOAD_TIMEOUT = 10 * 60 * 1000; // 10 minutes
