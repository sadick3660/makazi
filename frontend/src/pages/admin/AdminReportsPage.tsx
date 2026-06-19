import { useState } from "react";
import { ShieldAlert, BarChart2, Database, Clock, ArrowUpRight } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "../../services/api";
import type { ReportSummary } from "../../types";

function formatCurrency(amount: number) {
  return amount.toLocaleString("en-US", { style: "currency", currency: "TZS", maximumFractionDigits: 0 });
}

export default function AdminReportsPage() {
  const [report, setReport] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const [backupLoading, setBackupLoading] = useState(false);

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const summary = await adminApi.generateReport();
      setReport(summary);
      toast.success("Report generated successfully.");
    } catch {
      toast.error("Unable to generate report.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      const result = await adminApi.backupSystem();
      setBackupStatus(result.status === "COMPLETED"
        ? `Backup completed at ${new Date(result.timestamp).toLocaleString()}`
        : `Backup status: ${result.status}`);
      toast.success("System backup completed.");
    } catch {
      toast.error("Backup failed.");
    } finally {
      setBackupLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="bg-hero-gradient text-white px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <ShieldAlert className="w-6 h-6 text-white/80" />
            <span className="text-primary-200 text-sm font-medium">Administrator</span>
          </div>
          <h1 className="text-3xl font-bold">Admin Reports</h1>
          <p className="text-primary-200 mt-1">Run analytics reports and manage system backups.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4 text-surface-900">
              <BarChart2 className="w-5 h-5 text-primary-500" />
              <div>
                <h2 className="text-lg font-semibold">Platform Report</h2>
                <p className="text-sm text-surface-500">Generate a fresh metric summary for the marketplace.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleGenerateReport}
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? "Generating…" : "Generate Report"}
            </button>
            {report && (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-surface-200 bg-surface-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-surface-500">Total Users</p>
                  <p className="mt-2 text-2xl font-semibold text-surface-900">{report.total_users.toLocaleString()}</p>
                </div>
                <div className="rounded-2xl border border-surface-200 bg-surface-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-surface-500">Total Properties</p>
                  <p className="mt-2 text-2xl font-semibold text-surface-900">{report.total_properties.toLocaleString()}</p>
                </div>
                <div className="rounded-2xl border border-surface-200 bg-surface-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-surface-500">Total Revenue</p>
                  <p className="mt-2 text-2xl font-semibold text-surface-900">{formatCurrency(report.total_revenue)}</p>
                </div>
                <div className="rounded-2xl border border-surface-200 bg-surface-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-surface-500">Pending Reviews</p>
                  <p className="mt-2 text-2xl font-semibold text-surface-900">{report.pending_reviews}</p>
                </div>
                <div className="rounded-2xl border border-surface-200 bg-surface-50 p-4 sm:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-surface-500">Open Complaints</p>
                  <p className="mt-2 text-2xl font-semibold text-surface-900">{report.open_complaints}</p>
                </div>
                <div className="rounded-2xl border border-surface-200 bg-surface-50 p-4 sm:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-surface-500">Generated At</p>
                  <p className="mt-2 text-base font-medium text-surface-700">{new Date(report.generated_at).toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4 text-surface-900">
              <Database className="w-5 h-5 text-amber-500" />
              <div>
                <h2 className="text-lg font-semibold">System Backup</h2>
                <p className="text-sm text-surface-500">Create an on-demand backup snapshot for system data protection.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleBackup}
              disabled={backupLoading}
              className="btn-outline w-full border-surface-300"
            >
              {backupLoading ? "Backing up…" : "Trigger Backup"}
            </button>
            {backupStatus && (
              <div className="mt-6 rounded-2xl border border-surface-200 bg-surface-50 p-4 text-sm text-surface-700">
                <ArrowUpRight className="inline-block w-4 h-4 mr-2 text-primary-500 align-text-bottom" />
                {backupStatus}
              </div>
            )}
            <div className="mt-6 rounded-2xl border border-surface-200 bg-surface-50 p-4">
              <p className="text-sm text-surface-700">Use this page to review key platform totals and make sure your marketplace data can be restored after incidents.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
