import { useState } from 'react';
import {
  CalendarDays,
  Download,
  FileArchive,
  HandCoins,
  MessageSquareText,
  Paperclip,
  Unlock,
} from 'lucide-react';
import { AdminShell } from '../../shared/components/layout/AdminShell';
import { Card } from '../../shared/components/cards/Card';
import { Button } from '../../shared/components/buttons/Button';
import { Badge } from '../../shared/components/badges/Badge';
import { useAdminReport, useDashboardSummary, useDownloadReportExport } from './AdminQueries';
import { useSetReportEditPermission } from '../report/ReportQueries';
import { useToast } from '../../app/contexts/useToast';
import { formatCurrency } from '../../shared/utils/formatCurrency';
import { formatDate, formatDateTime, toISODate } from '../../shared/utils/formatDateTime';
import { formatFileSize } from '../../shared/utils/formatFileSize';
import {
  downloadReportAttachment,
  downloadReportAttachmentsZip,
  saveBlob,
} from '../report/ReportQueries';
import type { Report, ReportAttachment } from '../../shared/types/models';

function humanize(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function ReportDetail({ report }: { report: Report }) {
  const { showToast } = useToast();
  const [downloading, setDownloading] = useState<number | 'all' | null>(null);
  const receiptPhotos = report.receipt_photos ?? [];
  const expenseReceipts = report.expense_receipts ?? [];
  const isHostel =
    report.rooms_occupied !== null ||
    report.amount_expected_semester !== null ||
    report.collected_so_far !== null;

  const downloadOne = async (file: ReportAttachment) => {
    setDownloading(file.id);
    try {
      saveBlob(await downloadReportAttachment(report.id, file.id), file.original_name);
    } catch {
      showToast('error', 'Download failed. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  const downloadAll = async () => {
    setDownloading('all');
    try {
      saveBlob(await downloadReportAttachmentsZip(report.id), `report-${report.report_date}.zip`);
    } catch {
      showToast('error', 'Download failed. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  const renderFile = (file: ReportAttachment) => (
    <li key={file.id} className="flex items-center gap-3 py-2">
      {file.is_image ? (
        <img src={file.url} alt={file.original_name} className="h-9 w-9 rounded-lg object-cover" />
      ) : (
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
          {file.is_archive ? <FileArchive className="h-4 w-4" /> : <Paperclip className="h-4 w-4" />}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-800">{file.original_name}</p>
        <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => downloadOne(file)}
        loading={downloading === file.id}
      >
        <Download className="mr-1.5 h-4 w-4" /> Download
      </Button>
    </li>
  );

  const summaryRows: Array<[string, string]> = isHostel
    ? [
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
      ]
    : [
        ['Rooms', formatCurrency(report.rooms_rev)],
        ['Bar', formatCurrency(report.bar_rev)],
        ['Food', formatCurrency(report.food_rev)],
        ['Sauna', formatCurrency(report.sauna_rev)],
        ['Other', formatCurrency(report.other_rev)],
        ['Total', formatCurrency(report.total_rev)],
      ];

  const customValues = Object.entries(report.custom_values ?? {});

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="success">{report.status}</Badge>
        <span className="text-sm text-gray-500">
          {report.branch_name} &middot; {formatDate(report.report_date)}
        </span>
        <span className="ml-auto text-sm text-gray-500">
          Manager: <span className="font-medium text-gray-900">{report.manager_name ?? '—'}</span>
        </span>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            {isHostel ? 'Money Collected Today' : 'Total Revenue'}
          </span>
          <span className="text-xl font-bold text-blue-700">{formatCurrency(report.total_rev)}</span>
        </div>
        <div className="mt-2 divide-y divide-gray-100 border-t border-gray-100 pt-1">
          {summaryRows.map(([label, value]) => (
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
            <span className="font-medium text-gray-800">{formatCurrency(report.expenses)}</span>
          </div>
          <div className="flex items-center justify-between py-1.5 text-sm">
            <span className="text-gray-500">Cash Handed Over</span>
            <span className="font-medium text-gray-800">{formatCurrency(report.cash_handed_over)}</span>
          </div>
        </div>
      </div>

      {customValues.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm font-semibold text-gray-800">Custom fields</p>
          <div className="mt-2 divide-y divide-gray-100">
            {customValues.map(([key, value]) => (
              <div key={key} className="flex items-center justify-between gap-3 py-1.5 text-sm">
                <span className="text-gray-500">{humanize(key)}</span>
                <span className="max-w-[60%] truncate font-medium text-gray-800" title={String(value)}>
                  {String(value)}
                </span>
              </div>
            ))}
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

      {(receiptPhotos.length > 0 || expenseReceipts.length > 0) && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
              <Paperclip className="h-4 w-4 text-gray-500" /> Attachments
              <span className="text-xs font-normal text-gray-400">
                ({receiptPhotos.length + expenseReceipts.length})
              </span>
            </p>
            <Button variant="outline" size="sm" onClick={downloadAll} loading={downloading === 'all'}>
              <Download className="mr-1.5 h-4 w-4" /> Download all
            </Button>
          </div>
          {receiptPhotos.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Receipt photos ({receiptPhotos.length})
              </p>
              <ul className="divide-y divide-gray-100">{receiptPhotos.map(renderFile)}</ul>
            </div>
          )}
          {expenseReceipts.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Expense receipts ({expenseReceipts.length})
              </p>
              <ul className="divide-y divide-gray-100">{expenseReceipts.map(renderFile)}</ul>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400">
        Submitted {formatDateTime(report.submitted_at)} &middot;{' '}
        {report.business_types?.map((type) => type.name).join(', ') || '—'}
      </p>
    </div>
  );
}

export default function AdminReportsPage() {
  const { showToast } = useToast();
  const today = toISODate(new Date());
  const [date, setDate] = useState(today);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data, isLoading } = useDashboardSummary(date);
  const exportMutation = useDownloadReportExport({ from: date, to: date });
  const rows = data?.rows ?? [];
  const submitted = rows.filter((row) => row.report_id !== null);
  const pending = rows.filter((row) => row.report_id === null);

  const activeId = selectedId ?? submitted[0]?.report_id ?? null;
  const activeRow = submitted.find((row) => row.report_id === activeId) ?? null;
  const { data: report, isLoading: reportLoading } = useAdminReport(activeId);
  const editPermission = useSetReportEditPermission();

  const toggleEditPermission = async () => {
    if (!report) return;
    try {
      await editPermission.mutateAsync({ id: report.id, allow: !report.allow_edit });
      showToast(
        'success',
        report.allow_edit
          ? 'Editing revoked. The report is locked again.'
          : 'Editing allowed. The branch manager can now correct this report.',
      );
    } catch {
      showToast('error', 'Could not change edit access. Please try again.');
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportMutation.mutateAsync();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `frama-reports-${date}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('success', 'Export downloaded.');
    } catch {
      showToast('error', 'Export failed. Please try again.');
    }
  };

  return (
    <AdminShell>
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All Reports</h1>
            <p className="text-sm text-gray-500 mt-1">
              {submitted.length} of {rows.length} branches submitted &middot; {formatDate(date)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleExport}
              loading={exportMutation.isPending}
              disabled={!submitted.length}
            >
              <Download className="mr-1.5 h-4 w-4" /> Export Excel
            </Button>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <CalendarDays className="h-4 w-4 text-gray-400" />
              <input
                type="date"
                max={today}
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setSelectedId(null);
                }}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
          <div className="space-y-2 lg:col-span-2">
            {isLoading ? (
              <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-400">
                Loading reports…
              </div>
            ) : submitted.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
                <p className="text-sm font-medium text-gray-900">No reports submitted</p>
                <p className="mt-1 text-xs text-gray-500">Nothing has been submitted for this date yet.</p>
              </div>
            ) : (
              submitted.map((row) => (
                <button
                  key={row.report_id}
                  type="button"
                  onClick={() => setSelectedId(row.report_id)}
                  className={`w-full rounded-xl border bg-white p-4 text-left transition hover:border-blue-300 hover:shadow-sm ${
                    row.report_id === activeId ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{row.branch_name}</p>
                      <p className="mt-0.5 text-xs capitalize text-gray-400">
                        {row.business_type ?? '—'} &middot; {row.manager_name ?? '—'}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-blue-700">{formatCurrency(row.total_rev)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                    <span>Submitted {formatDateTime(row.submitted_at)}</span>
                    <span className="flex items-center gap-2">
                      {row.allow_edit && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700">
                          <Unlock className="h-3 w-3" /> Editable
                        </span>
                      )}
                      {row.receipt_count + row.expense_receipt_count} files
                    </span>
                  </div>
                </button>
              ))
            )}

            {pending.length > 0 && (
              <p className="px-1 pt-1 text-xs text-gray-400">
                Not submitted: {pending.map((row) => row.branch_name).join(', ')}
              </p>
            )}
          </div>

          <div className="lg:col-span-3">
            <Card>
              {activeRow === null ? (
                <div className="py-12 text-center">
                  <p className="text-sm font-medium text-gray-900">Select a report</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Choose a branch submission to see its full details.
                  </p>
                </div>
              ) : reportLoading || !report ? (
                <p className="py-12 text-center text-sm text-gray-400">Loading report…</p>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                    <div>
                      <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        {report.allow_edit ? (
                          <>
                            <Unlock className="h-4 w-4 text-amber-600" /> Editing allowed
                          </>
                        ) : (
                          <>Report locked</>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {report.allow_edit
                          ? 'The manager can correct this report. Access closes automatically after they save.'
                          : 'Allow the manager to correct mistakes on this submitted report.'}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={report.allow_edit ? 'outline' : 'primary'}
                      loading={editPermission.isPending}
                      onClick={toggleEditPermission}
                    >
                      {report.allow_edit ? 'Revoke Edit' : 'Allow Edit'}
                    </Button>
                  </div>
                  <ReportDetail report={report} />
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
