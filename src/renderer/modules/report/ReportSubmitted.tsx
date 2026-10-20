import { useState } from 'react';
import {
  CheckCircle2,
  Download,
  FileArchive,
  HandCoins,
  Layers,
  MessageSquareText,
  Paperclip,
  ReceiptText,
  Wallet,
} from 'lucide-react';
import { Card } from '../../shared/components/cards/Card';
import { Badge } from '../../shared/components/badges/Badge';
import { Button } from '../../shared/components/buttons/Button';
import { ShareBranchLinkButton } from '../share/ShareBranchLinkButton';
import { useAuth } from '../../app/contexts/useAuth';
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

interface ReportSubmittedProps {
  report: Report;
  date: string;
  onNewDate: (date: string) => void;
  hideNewDate?: boolean;
}

export function ReportSubmitted({ report, date, onNewDate, hideNewDate = true }: ReportSubmittedProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [downloadingId, setDownloadingId] = useState<number | 'all' | null>(null);
  const receiptPhotos = report.receipt_photos ?? [];
  const expenseReceipts = report.expense_receipts ?? [];
  const totalAttachments = receiptPhotos.length + expenseReceipts.length;
  const isHostel = user?.branch?.business_type?.slug === 'hostel';
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
    [
      'Money Collected So Far',
      report.collected_so_far !== null ? formatCurrency(report.collected_so_far) : '—',
    ],
    [
      'Balance Remaining',
      report.balance_remaining !== null ? formatCurrency(report.balance_remaining) : '—',
    ],
  ];

  const handleDownloadOne = async (id: number, name: string) => {
    setDownloadingId(id);
    try {
      const blob = await downloadReportAttachment(report.id, id);
      saveBlob(blob, name);
    } catch {
      showToast('error', 'Download failed. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadAll = async () => {
    setDownloadingId('all');
    try {
      const blob = await downloadReportAttachmentsZip(report.id);
      saveBlob(blob, `report-${report.report_date}.zip`);
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
        onClick={() => handleDownloadOne(file.id, file.original_name)}
        loading={downloadingId === file.id}
      >
        <Download className="mr-1.5 h-4 w-4" /> Download
      </Button>
    </li>
  );

  return (
    <div className="space-y-4">
      <Card className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">Report submitted</h2>
        <p className="mt-1 text-sm text-gray-500">
          {formatDate(report.report_date)} &middot; submitted {formatDateTime(report.submitted_at)}
        </p>
        <Badge variant="success" className="mt-3">Locked</Badge>
      </Card>

      {report.business_types && report.business_types.length > 0 && (
        <Card className="space-y-2">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
            <Layers className="h-4 w-4 text-gray-500" /> Business types
          </p>
          <div className="flex flex-wrap gap-2">
            {report.business_types.map((type) => (
              <span
                key={type.id}
                className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
              >
                {type.name}
              </span>
            ))}
          </div>
        </Card>
      )}

      <Card accent="blue" className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            {isHostel ? 'Total Collected Today' : 'Total Revenue'}
          </span>
          <span className="text-2xl font-bold text-blue-700">{formatCurrency(report.total_rev)}</span>
        </div>
        <div className="divide-y divide-gray-100 border-t border-gray-100 pt-2">
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
      </Card>

      <Card className="space-y-3">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
          <HandCoins className="h-4 w-4 text-gray-500" /> Handover
        </p>
        <div className="divide-y divide-gray-100">
          <div className="flex items-center justify-between py-1.5 text-sm">
            <span className="text-gray-500">Expenses</span>
            <span className="font-medium text-gray-800">{formatCurrency(report.expenses ?? 0)}</span>
          </div>
          <div className="flex items-center justify-between py-1.5 text-sm">
            <span className="flex items-center gap-1.5 text-gray-500">
              <Wallet className="h-3.5 w-3.5" /> Cash Handed Over
            </span>
            <span className="font-semibold text-gray-900">{formatCurrency(report.cash_handed_over ?? 0)}</span>
          </div>
          <div className="flex items-center justify-between py-1.5 text-sm">
            <span className="text-gray-500">Net (Revenue − Expenses)</span>
            <span className="font-medium text-emerald-700">
              {formatCurrency((report.total_rev ?? 0) - (report.expenses ?? 0))}
            </span>
          </div>
        </div>
      </Card>

      {report.comment && (
        <Card className="space-y-2">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
            <MessageSquareText className="h-4 w-4 text-gray-500" /> Comment / Problem Faced Today
          </p>
          <p className="whitespace-pre-wrap rounded-lg bg-amber-50 p-3 text-sm text-gray-700">{report.comment}</p>
        </Card>
      )}

      {totalAttachments > 0 && (
        <Card className="space-y-3">
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
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Receipt photos ({receiptPhotos.length})
              </p>
              <ul className="divide-y divide-gray-100">{receiptPhotos.map(renderAttachment)}</ul>
            </div>
          )}

          {expenseReceipts.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Expense receipts ({expenseReceipts.length})
              </p>
              <ul className="divide-y divide-gray-100">{expenseReceipts.map(renderAttachment)}</ul>
            </div>
          )}
        </Card>
      )}

      <Card className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-gray-800">Share this branch summary</p>
          <p className="text-xs text-gray-500">Post the read-only link in your WhatsApp group. Viewers sign in to see it.</p>
        </div>
        <ShareBranchLinkButton branch={user?.branch} />
      </Card>

      {!hideNewDate && (
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-gray-700">View another date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => onNewDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
      )}

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-gray-400">
        <ReceiptText className="h-3.5 w-3.5" /> This report is locked and cannot be edited.
      </p>
    </div>
  );
}
