/** Central API endpoint constants - keep all paths here so they stay in sync
 *  with the backend `routes/api/v1/*.php` files. */
export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    CHANGE_PIN: '/auth/change-pin',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    UPDATE_PIN: '/auth/pin',
  },
  BRANCHES: {
    INDEX: '/branches',
    SHOW: (id: number) => `/branches/${id}`,
    REGENERATE_CODE: (id: number) => `/branches/${id}/regenerate-code`,
  },
  SHARE: {
    BRANCH: (slug: string) => `/share/branch/${slug}`,
  },
  BUSINESS_TYPES: {
    INDEX: '/business-types',
    SHOW: (id: number) => `/business-types/${id}`,
  },
  ASSETS: {
    INDEX: '/assets',
    SHOW: (id: number) => `/assets/${id}`,
  },
  CUSTOM_FIELDS: {
    INDEX: '/custom-fields',
    SHOW: (id: number) => `/custom-fields/${id}`,
  },
  REPORTS: {
    INDEX: '/reports',
    SHOW: (id: number) => `/reports/${id}`,
    SUBMIT: '/reports',
    EXPORT: '/reports/export',
    DOWNLOAD_ATTACHMENT: (reportId: number, attachmentId: number) =>
      `/reports/${reportId}/attachments/${attachmentId}/download`,
    DOWNLOAD_ALL: (reportId: number) => `/reports/${reportId}/attachments/download-all`,
  },
  DASHBOARD: {
    SUMMARY: '/dashboard/summary',
    TREND: '/dashboard/trend',
  },
  USERS: {
    INDEX: '/users',
    SHOW: (id: number) => `/users/${id}`,
    RESET_PIN: (id: number) => `/users/${id}/reset-pin`,
  },
} as const;
