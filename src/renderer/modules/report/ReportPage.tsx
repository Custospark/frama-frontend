import { useState } from 'react';
import { CheckCircle2, FileText } from 'lucide-react';
import { AdminShell } from '../../shared/components/layout/AdminShell';
import { Card } from '../../shared/components/cards/Card';
import { useMyReports, useSubmitReport, type ReportFormValues } from './ReportQueries';
import { ReportForm } from './ReportForm';
import { ReportSubmitted } from './ReportSubmitted';
import { EmptyState } from '../../shared/components/cards/EmptyState';
import { useAuth } from '../../app/contexts/useAuth';
import { useToast } from '../../app/contexts/useToast';
import { apiErrorMessage } from '../../shared/utils/apiErrorMessage';
import { todayISO } from '../../shared/utils/formatDateTime';
import type { Report } from '../../shared/types/models';

export default function ReportPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [date, setDate] = useState(todayISO());
  const { data: reports = [] } = useMyReports();
  const submit = useSubmitReport();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const existing = reports.find((r) => r.report_date.slice(0, 10) === date) ?? null;

  const handleSubmit = async (values: ReportFormValues) => {
    setErrorMessage(undefined);
    try {
      await submit.mutateAsync(values);
      showToast('success', 'Report submitted.');
      setDate(values.report_date);
    } catch (err) {
      setErrorMessage(apiErrorMessage(err, 'Could not submit your report. Please try again.'));
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
            <p className="mt-0.5 text-sm text-gray-500">Daily revenue report &middot; {user?.name}</p>
          </div>
        </div>

        {existing ? (
          <ReportSubmitted report={existing as Report} date={date} onNewDate={setDate} hideNewDate={false} />
        ) : (
          <>
            <ReportForm
              date={date}
              onDateChange={setDate}
              onSubmit={handleSubmit}
              submitting={submit.isPending}
              uploadProgress={submit.progress}
              errorMessage={errorMessage}
            />
            <p className="flex items-center justify-center gap-1.5 text-center text-xs text-gray-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> Receipt photos and expense receipts are required for every submission.
            </p>
          </>
        )}

        {reports.length > 0 && (
          <Card className="space-y-3">
            <p className="text-sm font-semibold text-gray-800">Recent submissions</p>
            <ul className="divide-y divide-gray-100">
              {reports.slice(0, 5).map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-gray-600">{r.report_date.slice(0, 10)}</span>
                  <span className="font-medium text-gray-900">
                    {new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(r.total_rev)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {reports.length === 0 && (
          <EmptyState title="No reports yet" description="Your submitted reports will appear here." />
        )}
      </div>
    </AdminShell>
  );
}
