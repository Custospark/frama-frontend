import { useRef, useState } from 'react';
import { CheckCircle2, Eye, FileText, Lock, Pencil, Unlock } from 'lucide-react';
import { AdminShell } from '../../shared/components/layout/AdminShell';
import { Card } from '../../shared/components/cards/Card';
import { Badge } from '../../shared/components/badges/Badge';
import { Button } from '../../shared/components/buttons/Button';
import { Modal } from '../../shared/components/modals/Modal';
import { useMyReports, useSubmitReport, useUpdateReport, type ReportFormValues } from './ReportQueries';
import { ReportForm } from './ReportForm';
import { ReportDetails } from './ReportDetails';
import { EmptyState } from '../../shared/components/cards/EmptyState';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../app/contexts/useAuth';
import { useToast } from '../../app/contexts/useToast';
import { apiErrorMessage } from '../../shared/utils/apiErrorMessage';
import { formatDate, formatDateTime, todayISO } from '../../shared/utils/formatDateTime';
import type { Report } from '../../shared/types/models';

export default function ReportPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const [date, setDate] = useState(searchParams.get('date') ?? todayISO());
  const { data: reports = [] } = useMyReports({ per_page: 100 });
  const submit = useSubmitReport();
  const update = useUpdateReport();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [viewing, setViewing] = useState<Report | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const existing = reports.find((r) => r.report_date.slice(0, 10) === date) ?? null;
  const canEdit = Boolean(existing?.allow_edit);
  const busy = submit.isPending || update.isPending;
  const progress = update.isPending ? update.progress : submit.progress;

  const editReport = (report: Report) => {
    setViewing(null);
    setDate(report.report_date.slice(0, 10));
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const handleSubmit = async (values: ReportFormValues) => {
    setErrorMessage(undefined);
    try {
      if (existing && canEdit) {
        const report = await update.mutateAsync({ id: existing.id, values });
        showToast('success', 'Report updated.');
        setViewing(report);
      } else {
        const report = await submit.mutateAsync(values);
        showToast('success', 'Report submitted.');
        setViewing(report);
      }
    } catch (err) {
      setErrorMessage(
        apiErrorMessage(
          err,
          existing && canEdit
            ? 'Could not update your report. Please try again.'
            : 'Could not submit your report. Please try again.',
        ),
      );
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user?.branch?.branch_name ?? 'Branch'} Report</h1>
            <p className="mt-0.5 text-sm text-gray-500">Daily Report &middot; {user?.name}</p>
          </div>
        </div>

        {existing && (
          <Card className={canEdit ? 'border-emerald-200 bg-emerald-50' : 'border-blue-200 bg-blue-50'}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600">
                  {canEdit ? <Unlock className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                </span>
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    {canEdit ? 'Edits allowed' : 'Report submitted'}
                    <Badge variant={canEdit ? 'warning' : 'success'}>
                      {canEdit ? (
                        <>
                          <Unlock className="mr-1 h-3 w-3" /> Editable
                        </>
                      ) : (
                        <>
                          <Lock className="mr-1 h-3 w-3" /> Locked
                        </>
                      )}
                    </Badge>
                  </p>
                  <p className="mt-0.5 text-xs text-gray-600">
                    {formatDate(existing.report_date)} &middot; submitted {formatDateTime(existing.submitted_at)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {canEdit
                      ? 'The office has enabled corrections for this report. Fix the details below and save — editing closes automatically after you save.'
                      : 'This date is locked. Choose a different date below to start a new report.'}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setViewing(existing)}>
                <Eye className="mr-1.5 h-4 w-4" /> View report
              </Button>
            </div>
          </Card>
        )}

        <div ref={formRef} className="scroll-mt-4">
          <ReportForm
            key={existing?.id ?? 'new'}
            date={date}
            onDateChange={setDate}
            onSubmit={handleSubmit}
            submitting={busy}
            uploadProgress={progress}
            errorMessage={errorMessage}
            locked={Boolean(existing) && !canEdit}
            editingReport={canEdit ? existing : null}
          />
        </div>

        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-gray-400">
          <CheckCircle2 className="h-3.5 w-3.5" /> Receipt photos and expense receipts are required for every submission.
        </p>

        {reports.length > 0 ? (
          <Card className="space-y-3">
            <p className="text-sm font-semibold text-gray-800">Recent submissions</p>
            <ul className="divide-y divide-gray-100">
              {reports.slice(0, 5).map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm sm:gap-3">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="flex items-center gap-1.5 text-gray-600">
                      {formatDate(r.report_date)}
                      {r.allow_edit && <Unlock className="h-3.5 w-3.5 text-amber-600" aria-label="Editable" />}
                    </span>
                    <span className="font-medium text-gray-900">
                      {new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(r.total_rev)}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {r.allow_edit && (
                      <Button size="sm" onClick={() => editReport(r)}>
                        <Pencil className="mr-1.5 h-4 w-4" /> Edit
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setViewing(r)}>
                      <Eye className="mr-1.5 h-4 w-4" /> View
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <EmptyState title="No reports yet" description="Your submitted reports will appear here." />
        )}

        <Modal
          isOpen={viewing !== null}
          onClose={() => setViewing(null)}
          title={viewing ? `Report · ${formatDate(viewing.report_date)}` : undefined}
          size="lg"
          footer={
            <Button variant="outline" size="sm" onClick={() => setViewing(null)}>
              Close
            </Button>
          }
        >
          {viewing && <ReportDetails report={viewing} />}
        </Modal>
      </div>
    </AdminShell>
  );
}
