import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../../app/api/axiosConfig';
import { DOWNLOAD_TIMEOUT, UPLOAD_TIMEOUT } from '../../app/api/apiConfig';
import { ENDPOINTS } from '../../shared/api/endpoints/endpoints';
import type { Paginated, Report } from '../../shared/types/models';

export const reportKeys = {
  all: ['reports'] as const,
  list: (params?: Record<string, unknown>) => [...reportKeys.all, 'list', params] as const,
  mine: (date?: string) => [...reportKeys.all, 'mine', date] as const,
};

/** Hostel branches submit a single collected total; motel branches the five
 *  revenue categories. The server derives the total for motel reports. */
export interface ReportFormValues {
  report_date: string;
  rooms_rev?: number;
  bar_rev?: number;
  food_rev?: number;
  sauna_rev?: number;
  other_rev?: number;
  rooms_occupied?: number;
  amount_expected_semester?: number;
  total_rev?: number;
  expenses: number;
  cash_handed_over: number;
  comment: string | null;
  business_type_ids: number[];
  receipt_photos: File[];
  expense_receipts: File[];
  custom_values?: Record<string, unknown>;
}

/** Manager: list their branch's reports. `data` is the current page and
 *  `meta` describes the pagination returned by the API. */
export function useMyReports(params?: {
  from?: string;
  to?: string;
  per_page?: number;
  page?: number;
}) {
  const query = useQuery({
    queryKey: reportKeys.list(params),
    queryFn: async (): Promise<Paginated<Report>> => {
      const { data } = await axiosInstance.get<Paginated<Report>>(ENDPOINTS.REPORTS.INDEX, {
        params,
      });
      return data;
    },
    placeholderData: (previousData) => previousData,
  });

  return { ...query, data: query.data?.data ?? [], meta: query.data?.meta };
}

function buildReportForm(values: ReportFormValues): FormData {
  const form = new FormData();
  form.append('report_date', values.report_date);

  const financials: Array<[string, number | undefined]> = [
    ['rooms_rev', values.rooms_rev],
    ['bar_rev', values.bar_rev],
    ['food_rev', values.food_rev],
    ['sauna_rev', values.sauna_rev],
    ['other_rev', values.other_rev],
    ['rooms_occupied', values.rooms_occupied],
    ['amount_expected_semester', values.amount_expected_semester],
    ['total_rev', values.total_rev],
  ];
  financials.forEach(([key, value]) => {
    if (value !== undefined) form.append(key, String(value));
  });

  form.append('expenses', String(values.expenses));
  form.append('cash_handed_over', String(values.cash_handed_over));
  if (values.comment !== null && values.comment !== undefined && values.comment !== '') {
    form.append('comment', values.comment);
  }
  values.business_type_ids.forEach((id) => {
    form.append('business_type_ids[]', String(id));
  });
  values.receipt_photos.forEach((file) => {
    form.append('receipt_photos[]', file);
  });
  values.expense_receipts.forEach((file) => {
    form.append('expense_receipts[]', file);
  });

  Object.entries(values.custom_values ?? {}).forEach(([key, value]) => {
    if (value instanceof File) {
      form.append(`custom_values[${key}]`, value);
    } else if (value !== null && value !== undefined && value !== '') {
      form.append(`custom_values[${key}]`, String(value));
    }
  });

  return form;
}

function uploadProgressHandler(setProgress: (value: number) => void) {
  return (event: { total?: number; loaded: number }) => {
    if (event.total && event.total > 0) {
      setProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
    }
  };
}

/** Manager: submit today's report for their own branch. Exposes `progress`
 *  (0–100) while the multipart upload is in flight. */
export function useSubmitReport() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<number | null>(null);

  const mutation = useMutation({
    mutationFn: async (values: ReportFormValues): Promise<Report> => {
      const form = buildReportForm(values);
      setProgress(0);

      const { data } = await axiosInstance.post<{ data: Report }>(
        ENDPOINTS.REPORTS.SUBMIT,
        form,
        {
          timeout: UPLOAD_TIMEOUT,
          onUploadProgress: uploadProgressHandler(setProgress),
        },
      );
      setProgress(100);
      return data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reportKeys.all });
    },
    onSettled: () => {
      setProgress(null);
    },
  });

  return { ...mutation, progress };
}

/** Manager: save corrections to a report while the office has enabled edits. */
export function useUpdateReport() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<number | null>(null);

  const mutation = useMutation({
    mutationFn: async ({ id, values }: { id: number; values: ReportFormValues }): Promise<Report> => {
      const form = buildReportForm(values);
      setProgress(0);

      const { data } = await axiosInstance.post<{ data: Report }>(
        ENDPOINTS.REPORTS.UPDATE(id),
        form,
        {
          timeout: UPLOAD_TIMEOUT,
          onUploadProgress: uploadProgressHandler(setProgress),
        },
      );
      setProgress(100);
      return data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reportKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
    onSettled: () => {
      setProgress(null);
    },
  });

  return { ...mutation, progress };
}

/** Executive/platform admin: grant or revoke a manager's edit access. */
export function useSetReportEditPermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, allow }: { id: number; allow: boolean }): Promise<Report> => {
      const { data } = await axiosInstance.post<{ data: Report }>(
        ENDPOINTS.REPORTS.ALLOW_EDIT(id),
        { allow_edit: allow },
      );
      return data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reportKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}

/** Download a single attachment as a blob. */
export async function downloadReportAttachment(reportId: number, attachmentId: number): Promise<Blob> {
  const { data } = await axiosInstance.get(ENDPOINTS.REPORTS.DOWNLOAD_ATTACHMENT(reportId, attachmentId), {
    responseType: 'blob',
    timeout: DOWNLOAD_TIMEOUT,
  });
  return data as Blob;
}

/** Download every attachment for a report as a single zip blob. */
export async function downloadReportAttachmentsZip(reportId: number): Promise<Blob> {
  const { data } = await axiosInstance.get(ENDPOINTS.REPORTS.DOWNLOAD_ALL(reportId), {
    responseType: 'blob',
    timeout: DOWNLOAD_TIMEOUT,
  });
  return data as Blob;
}

/** Trigger a browser download for an already-fetched blob. */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
