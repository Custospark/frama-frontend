import { useState } from 'react';
import {
  Download,
  FileArchive,
  HandCoins,
  Layers,
  MessageSquareText,
  Paperclip,
} from 'lucide-react';
import { Badge } from '../../shared/components/badges/Badge';
import { Button } from '../../shared/components/buttons/Button';
import { useToast } from '../../app/contexts/useToast';
import { formatCurrency } from '../../shared/utils/formatCurrency';
import { formatDate, formatDateTime } from '../../shared/utils/formatDateTime';
import { formatFileSize } from '../../shared/utils/formatFileSize';
import {
  downloadReportAttachment,
  downloadReportAttachmentsZip,
  saveBlob,
} from './ReportQueries';
import type { Report, ReportAttachment } from '../../shared/types/models';

interface ReportDetailsProps {
  report: Report;
  showMeta?: boolean;
}

function humanize(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ReportDetails({ report, showMeta = false }: ReportDetailsProps) {
  const { showToast } = useToast();
  const [downloadingId, setDownloadingId] = useState<number | 'all' | null>(null);
  const receiptPhotos = report.receipt_photos ?? [];
  const expenseReceipts = report.expense_receipts ?? [];
  const totalAttachments = receiptPhotos.length + expenseReceipts.length;
  const isHostel =
    report.rooms_occupied !== null ||
    report.amount_expected_semester !== null ||
    report.collected_so_far !== null;
  const breakdown: Array<[string, number]> = [
    ['Rooms', report.rooms_rev],
    ['Bar', report.bar_rev],
    ['Food', report.food_rev],
    ['Sauna', report.sauna_rev],
    ['Other', report.other_rev],
  ];
  const hostelSummary: Array<[string, string]> = [
    ['Rooms Occupied', report.rooms_occupied !== null ? String(report.rooms_occupied) : '—'],
    [
      'Amount Expected This Semester',
      report.amount_expected_semester !== null ? formatCurrency(report.amount_expected_semester) : '—',
    ],
    ['Money Collected Today', formatCurrency(report.total_rev)],
    [
      'Money Collected So Far',
      report.collected_so_far !== null ? formatCurrency(report.collected_so_far) : '—',
    ],
    [
      'Balance Remaining',
      report.balance_remaining !== null ? formatCurrency(report.balance_remaining) : '—',
    ],
  ];
  const customValues = Object.entries(report.custom_values ?? {});

  const handleDownloadOne = async (file: ReportAttachment) => {
    setDownloadingId(file.id);
    try {
      saveBlob(await downloadReportAttachment(report.id, file.id), file.original_name);
    } catch {
      showToast('error', 'Download failed. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadAll = async () => {
    setDownloadingId('all');
    try {
      saveBlob(await downloadReportAttachmentsZip(report.id), `report-${report.report_date}.zip`);
    } catch {
      showToast('error', 'Download failed. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const renderAttachment = (file: ReportAttachment) => (
    <li key={file.id} className="flex items-center gap-3 py-2">
      {file.is_image ? (
        <img src={file.url} alt={file.original_name} className="h-10 w-10 rounded-lg object-cover" />
      ) : (
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
          {file.is_archive ? <FileArchive className="h-5 w-5" /> : <Paperclip className="h-5 w-5" />}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-800">{file.original_name}</p>
        <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleDownloadOne(file)}
        loading={downloadingId === file.id}
      >
        <Download className="mr-1.5 h-4 w-4" /> Download
      </Button>
    </li>
  );

  return (
    <div className="space-y-4">
      {showMeta && (
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={report.status === 'Submitted' ? 'success' : 'warning'}>{report.status}</Badge>
          <span className="text-sm text-gray-500">
            {report.branch_name ?? 'Your branch'} &middot; {formatDate(report.report_date)}
          </span>
          <span className="ml-auto text-sm text-gray-500">
            Manager: <span className="font-medium text-gray-900">{report.manager_name ?? '—'}</span>
          </span>
        </div>
      )}

      {report.business_types && report.business_types.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
            <Layers className="h-4 w-4 text-gray-500" /> Business types
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {report.business_types.map((type) => (
              <span
                key={type.id}
                className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
              >
                {type.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            {isHostel ? 'Total Collected Today' : 'Total Revenue'}
          </span>
          <span className="text-2xl font-bold text-blue-700">{formatCurrency(report.total_rev)}</span>
        </div>
        <div className="mt-2 divide-y divide-gray-100 border-t border-gray-100 pt-1">
          {(isHostel
            ? hostelSummary
            : breakdown.map(([label, value]) => [label, formatCurrency(value)] as [string, string])
          ).map(([label, value]) => (
            <div key={label} className="flex items-center justify-between py-1.5 text-sm">
              <span className="text-gray-500">{label}</span>
              <span className="font-medium text-gray-800">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
          <HandCoins className="h-4 w-4 text-gray-500" /> Handover
        </p>
        <div className="mt-2 divide-y divide-gray-100">
          <div className="flex items-center justify-between py-1.5 text-sm">
            <span className="text-gray-500">Expenses</span>
            <span className="font-medium text-gray-800">{formatCurrency(report.expenses ?? 0)}</span>
          </div>
          <div className="flex items-center justify-between py-1.5 text-sm">
            <span className="text-gray-500">Cash Handed Over</span>
            <span className="font-semibold text-gray-900">{formatCurrency(report.cash_handed_over ?? 0)}</span>
          </div>
          <div className="flex items-center justify-between py-1.5 text-sm">
            <span className="text-gray-500">Expected Cash (Amount Collected Today − Expenses)</span>
            <span className="font-medium text-emerald-700">
              {formatCurrency((report.total_rev ?? 0) - (report.expenses ?? 0))}
            </span>
          </div>
        </div>
      </div>

      {customValues.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm font-semibold text-gray-800">Additional fields</p>
          <div className="mt-2 divide-y divide-gray-100">
            {customValues.map(([key, value]) => {
              const text = String(value);
              const isLink = /^https?:\/\//.test(text);
              return (
                <div key={key} className="flex items-center justify-between gap-3 py-1.5 text-sm">
                  <span className="text-gray-500">{humanize(key)}</span>
                  {isLink ? (
                    <a
                      href={text}
                      target="_blank"
                      rel="noreferrer"
                      className="max-w-[60%] truncate font-medium text-blue-600 hover:underline"
                    >
                      View file
                    </a>
                  ) : (
                    <span className="max-w-[60%] truncate font-medium text-gray-800" title={text}>
                      {text}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {report.comment && (
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
            <MessageSquareText className="h-4 w-4 text-gray-500" /> Comment / Problem Faced
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{report.comment}</p>
        </div>
      )}

      {totalAttachments > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
              <Paperclip className="h-4 w-4 text-gray-500" /> Attachments
              <span className="text-xs font-normal text-gray-400">({totalAttachments})</span>
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadAll}
              loading={downloadingId === 'all'}
            >
              <Download className="mr-1.5 h-4 w-4" /> Download all
            </Button>
          </div>
          {receiptPhotos.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Receipt photos ({receiptPhotos.length})
              </p>
              <ul className="divide-y divide-gray-100">{receiptPhotos.map(renderAttachment)}</ul>
            </div>
          )}
          {expenseReceipts.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Expense receipts ({expenseReceipts.length})
              </p>
              <ul className="divide-y divide-gray-100">{expenseReceipts.map(renderAttachment)}</ul>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400">
        Submitted {formatDateTime(report.submitted_at)}
      </p>
    </div>
  );
}
