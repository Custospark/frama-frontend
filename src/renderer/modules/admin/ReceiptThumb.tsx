import { useState } from 'react';
import { Download, FileArchive, ImageOff, Paperclip } from 'lucide-react';
import { Modal } from '../../shared/components/modals/Modal';
import { Button } from '../../shared/components/buttons/Button';
import { useToast } from '../../app/contexts/useToast';
import { formatFileSize } from '../../shared/utils/formatFileSize';
import {
  downloadReportAttachment,
  downloadReportAttachmentsZip,
  saveBlob,
} from '../report/ReportQueries';
import type { ReportAttachment } from '../../shared/types/models';

interface AttachmentCellProps {
  reportId: number | null;
  url: string | null;
  isImage?: boolean;
  count?: number;
  attachments?: ReportAttachment[];
}

/** Compact dashboard cell: image thumbnail or "N files" badge; opens a download list. */
export function ReceiptThumb({ reportId, url, isImage = false, count = 0, attachments = [] }: AttachmentCellProps) {
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<number | 'all' | null>(null);

  if (!url) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-400">
        <ImageOff className="h-3.5 w-3.5" /> None
      </span>
    );
  }

  const handleOne = async (file: ReportAttachment) => {
    if (!reportId) return;
    setBusy(file.id);
    try {
      saveBlob(await downloadReportAttachment(reportId, file.id), file.original_name);
    } catch {
      showToast('error', 'Download failed. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  const handleAll = async () => {
    if (!reportId) return;
    setBusy('all');
    try {
      saveBlob(await downloadReportAttachmentsZip(reportId), `report-${reportId}.zip`);
    } catch {
      showToast('error', 'Download failed. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 transition-colors hover:border-blue-300 hover:text-blue-600"
        aria-label="View attachments"
      >
        {isImage ? (
          <img src={url} alt="Attachment thumbnail" className="h-8 w-8 rounded object-cover" />
        ) : (
          <Paperclip className="h-3.5 w-3.5" />
        )}
        {count > 1 && <span>{count} files</span>}
      </button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Attachments" size="lg">
        {attachments.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-gray-500">
            <FileArchive className="h-8 w-8 text-gray-400" />
            <p className="text-sm">This report has {count} attachment{count === 1 ? '' : 's'}.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={handleAll} loading={busy === 'all'}>
                <Download className="mr-1.5 h-4 w-4" /> Download all
              </Button>
            </div>
            <ul className="divide-y divide-gray-100">
              {attachments.map((file) => (
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
                  <Button variant="ghost" size="sm" onClick={() => handleOne(file)} loading={busy === file.id}>
                    <Download className="mr-1.5 h-4 w-4" /> Download
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Modal>
    </>
  );
}
