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

export interface ReportFormValues {
  report_date: string;
  rooms_rev: number;
  bar_rev: number;
  food_rev: number;
  sauna_rev: number;
  expenses: number;
  cash_handed_over: number;
  comment: string | null;
  business_type_ids: number[];
  attachments: File[];
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
      form.append('rooms_rev', String(values.rooms_rev));
      form.append('bar_rev', String(values.bar_rev));
      form.append('food_rev', String(values.food_rev));
      form.append('sauna_rev', String(values.sauna_rev));
      form.append('expenses', String(values.expenses));
      form.append('cash_handed_over', String(values.cash_handed_over));
      if (values.comment !== null && values.comment !== undefined && values.comment !== '') {
        form.append('comment', values.comment);
      }
      values.business_type_ids.forEach((id) => {
        form.append('business_type_ids[]', String(id));
      });
      values.attachments.forEach((file) => {
        form.append('attachments[]', file);
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
