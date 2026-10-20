import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../../app/api/axiosConfig';
import { DOWNLOAD_TIMEOUT, UPLOAD_TIMEOUT } from '../../app/api/apiConfig';
import { ENDPOINTS } from '../../shared/api/endpoints/endpoints';
import type { Report } from '../../shared/types/models';

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
  collected_so_far?: number;
  total_rev?: number;
  expenses: number;
  cash_handed_over: number;
  comment: string | null;
  business_type_ids: number[];
  receipt_photos: File[];
  expense_receipts: File[];
  custom_values?: Record<string, unknown>;
}

/** Manager: list their branch's recent reports. */
export function useMyReports(params?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: reportKeys.list(params),
    queryFn: async (): Promise<Report[]> => {
      const { data } = await axiosInstance.get<{ data: Report[] }>(ENDPOINTS.REPORTS.INDEX, {
        params,
      });
      return data.data;
    },
  });
}

/** Manager: submit (or replace) today's report for their own branch.
 *  Exposes `progress` (0–100) while the multipart upload is in flight. */
export function useSubmitReport() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<number | null>(null);

  const mutation = useMutation({
    mutationFn: async (values: ReportFormValues): Promise<Report> => {
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
        ['collected_so_far', values.collected_so_far],
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

      setProgress(0);

      const { data } = await axiosInstance.post<{ data: Report }>(
        ENDPOINTS.REPORTS.SUBMIT,
        form,
        {
          timeout: UPLOAD_TIMEOUT,
          onUploadProgress: (event) => {
            if (event.total && event.total > 0) {
              setProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
            }
          },
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
