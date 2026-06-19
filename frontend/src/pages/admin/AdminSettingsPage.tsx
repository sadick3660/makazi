import { useEffect, useState } from "react";
import {
  ShieldAlert, SlidersHorizontal, ClipboardList, Check, ChevronDown,
  ShieldCheck, Bell, AlertTriangle, Users, Sparkles, Database,
} from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "../../services/api";
import type {
  AuditLog, SystemSetting, Complaint, Announcement,
  SubscriptionPlan, ReportSummary, Review, User,
} from "../../types";

function formatSettingKey(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [pendingReviews, setPendingReviews] = useState<Review[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [reportSummary, setReportSummary] = useState<ReportSummary | null>(null);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const [suspiciousAccounts, setSuspiciousAccounts] = useState<User[]>([]);
  const [announceForm, setAnnounceForm] = useState({ title: "", message: "" });
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);
  const [moderatingReview, setModeratingReview] = useState<string | null>(null);
  const [resolvingComplaint, setResolvingComplaint] = useState<string | null>(null);
  const [planSaving, setPlanSaving] = useState<number | null>(null);
  const [accountActionLoading, setAccountActionLoading] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [settingsResponse, auditResponse, complaintsResponse, reviewsResponse, announcementsResponse, plansResponse, suspiciousResponse] = await Promise.all([
          adminApi.settings(),
          adminApi.auditLogs(),
          adminApi.complaints(),
          adminApi.pendingReviews(),
          adminApi.announcements(),
          adminApi.subscriptionPlans(),
          adminApi.suspiciousAccounts(),
        ]);

        setSettings(settingsResponse);
        setAuditLogs(auditResponse);
        setComplaints(complaintsResponse);
        setPendingReviews(reviewsResponse);
        setAnnouncements(announcementsResponse);
        setPlans(plansResponse);
        setSuspiciousAccounts(suspiciousResponse);
        setValues(settingsResponse.reduce((acc, setting) => {
          acc[setting.setting_key] = setting.setting_value;
          return acc;
        }, {} as Record<string, string>));
      } catch (error) {
        toast.error("Unable to load admin settings.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleValueChange = (key: string, nextValue: string) => {
    setValues((current) => ({ ...current, [key]: nextValue }));
  };

  const handleToggle = (key: string) => {
    setValues((current) => ({ ...current, [key]: current[key] === "true" ? "false" : "true" }));
  };

  const handleSave = async (key: string) => {
    setSavingKey(key);
    try {
      const updated = await adminApi.updateSetting(key, values[key]);
      setSettings((current) => current.map((setting) => setting.setting_key === key ? updated : setting));
      toast.success(`${formatSettingKey(key)} updated successfully.`);
    } catch {
      toast.error("Failed to save setting.");
    } finally {
      setSavingKey(null);
    }
  };

  const handleResolveComplaint = async (id: string) => {
    setResolvingComplaint(id);
    try {
      const updated = await adminApi.resolveComplaint(id);
      setComplaints((current) => current.map((complaint) => complaint.id === id ? updated : complaint));
      toast.success("Complaint marked resolved.");
    } catch {
      toast.error("Unable to resolve complaint.");
    } finally {
      setResolvingComplaint(null);
    }
  };

  const handleModerateReview = async (id: string, status: string) => {
    setModeratingReview(id);
    try {
      const updated = await adminApi.moderateReview(id, status);
      setPendingReviews((current) => current.filter((review) => review.id !== id));
      toast.success(`Review ${status.toLowerCase()} successfully.`);
    } catch {
      toast.error("Unable to moderate review.");
    } finally {
      setModeratingReview(null);
    }
  };

  const handleSendAnnouncement = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!announceForm.title || !announceForm.message) {
      toast.error("Please provide title and message.");
      return;
    }
    setSavingAnnouncement(true);
    try {
      const announcement = await adminApi.sendAnnouncement(announceForm.title, announceForm.message);
      setAnnouncements((current) => [announcement, ...current]);
      setAnnounceForm({ title: "", message: "" });
      toast.success("Announcement sent.");
    } catch {
      toast.error("Failed to send announcement.");
    } finally {
      setSavingAnnouncement(false);
    }
  };

  const handleTogglePlanActive = async (plan: SubscriptionPlan) => {
    setPlanSaving(plan.id);
    try {
      const updated = await adminApi.updateSubscriptionPlan(plan.id, { ...plan, is_active: !plan.is_active });
      setPlans((current) => current.map((p) => p.id === plan.id ? updated : p));
      toast.success("Subscription plan updated.");
    } catch {
      toast.error("Unable to update plan.");
    } finally {
      setPlanSaving(null);
    }
  };

  const handlePlanPriceChange = (id: number, amount: number) => {
    setPlans((current) => current.map((plan) => plan.id === id ? { ...plan, price_tzs: amount } : plan));
  };

  const handleGenerateReport = async () => {
    try {
      const report = await adminApi.generateReport();
      setReportSummary(report);
      toast.success("Report generated.");
    } catch {
      toast.error("Unable to generate report.");
    }
  };

  const handleBackupSystem = async () => {
    try {
      const result = await adminApi.backupSystem();
      setBackupStatus(`${result.status} at ${new Date(result.timestamp).toLocaleString()}`);
      toast.success("Backup completed.");
    } catch {
      toast.error("Backup failed.");
    }
  };

  const handleAccountAction = async (user: User, activate: boolean) => {
    setAccountActionLoading(user.id);
    try {
      if (activate) await adminApi.activateUser(user.id);
      else await adminApi.suspendUser(user.id);
      setSuspiciousAccounts((current) => current.filter((item) => item.id !== user.id));
      toast.success(`Account ${activate ? "activated" : "suspended"}.`);
    } catch {
      toast.error("Unable to update account status.");
    } finally {
      setAccountActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="bg-hero-gradient text-white px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <ShieldAlert className="w-6 h-6 text-white/80" />
            <span className="text-primary-200 text-sm font-medium">Administrator</span>
          </div>
          <h1 className="text-3xl font-bold">Admin Settings</h1>
          <p className="text-primary-200 mt-1">Manage system configuration, complaints, reviews, subscriptions, and audit records.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
          <div className="space-y-6">
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <SlidersHorizontal className="w-5 h-5 text-primary-500" />
                <h2 className="text-lg font-semibold text-surface-900">System Configuration</h2>
              </div>
              <div className="space-y-4">
                {settings.map((setting) => {
                  const currentValue = values[setting.setting_key] ?? setting.setting_value;
                  const isBoolean = currentValue === "true" || currentValue === "false";

                  return (
                    <div key={setting.setting_key} className="rounded-2xl border border-surface-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div>
                          <p className="font-semibold text-surface-900">{formatSettingKey(setting.setting_key)}</p>
                          <p className="text-sm text-surface-500">Last updated {new Date(setting.updated_at).toLocaleString()}</p>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          {isBoolean ? (
                            <button
                              type="button"
                              onClick={() => handleToggle(setting.setting_key)}
                              className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition ${currentValue === "true" ? "bg-emerald-600 text-white" : "bg-surface-100 text-surface-700 hover:bg-surface-200"}`}
                            >
                              {currentValue === "true" ? "Enabled" : "Disabled"}
                            </button>
                          ) : (
                            <input
                              value={currentValue}
                              onChange={(e) => handleValueChange(setting.setting_key, e.target.value)}
                              className="input w-full max-w-xs"
                            />
                          )}
                          <button
                            type="button"
                            disabled={savingKey === setting.setting_key}
                            onClick={() => handleSave(setting.setting_key)}
                            className="btn-primary px-4 py-2 text-sm"
                          >
                            {savingKey === setting.setting_key ? "Saving…" : "Save"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary-500" />
                <h2 className="text-lg font-semibold text-surface-900">Announcements</h2>
              </div>
              <form onSubmit={handleSendAnnouncement} className="space-y-4">
                <div>
                  <label className="label">Title</label>
                  <input
                    value={announceForm.title}
                    onChange={(e) => setAnnounceForm((current) => ({ ...current, title: e.target.value }))}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="label">Message</label>
                  <textarea
                    value={announceForm.message}
                    onChange={(e) => setAnnounceForm((current) => ({ ...current, message: e.target.value }))}
                    rows={4}
                    className="input w-full min-h-[120px] resize-none"
                  />
                </div>
                <button type="submit" disabled={savingAnnouncement} className="btn-primary">
                  {savingAnnouncement ? "Sending…" : "Send Announcement"}
                </button>
              </form>
              <div className="mt-6 space-y-3">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="rounded-2xl border border-surface-200 bg-surface-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-surface-900">{announcement.title}</p>
                      <p className="text-xs text-surface-500">{new Date(announcement.created_at).toLocaleDateString()}</p>
                    </div>
                    <p className="text-sm text-surface-600 mt-2">{announcement.message}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-maroon-500" />
                  <h2 className="text-lg font-semibold text-surface-900">Complaints</h2>
                </div>
                <div className="space-y-3">
                  {complaints.length === 0 ? (
                    <div className="text-surface-500">No open complaints to review.</div>
                  ) : complaints.map((complaint) => (
                    <div key={complaint.id} className="rounded-2xl border border-surface-200 bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-surface-900">Complaint by {complaint.complainant_id}</p>
                        <span className="text-xs text-surface-500">{complaint.status}</span>
                      </div>
                      <p className="text-sm text-surface-600 mt-2">{complaint.complaint_text}</p>
                      <p className="text-xs text-surface-500 mt-3">Created {new Date(complaint.created_at).toLocaleString()}</p>
                      <button
                        type="button"
                        onClick={() => handleResolveComplaint(complaint.id)}
                        disabled={resolvingComplaint === complaint.id}
                        className="btn-primary mt-4"
                      >
                        {resolvingComplaint === complaint.id ? "Resolving…" : "Resolve"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Bell className="w-5 h-5 text-primary-500" />
                  <h2 className="text-lg font-semibold text-surface-900">Review Moderation</h2>
                </div>
                <div className="space-y-3">
                  {pendingReviews.length === 0 ? (
                    <div className="text-surface-500">No pending reviews to moderate.</div>
                  ) : pendingReviews.map((review) => (
                    <div key={review.id} className="rounded-2xl border border-surface-200 bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-surface-900">{review.user_name}</p>
                        <span className="text-xs text-surface-500">Rating {review.rating}</span>
                      </div>
                      <p className="text-sm text-surface-600 mt-2">{review.comment}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn-ghost bg-emerald-50 text-emerald-700"
                          disabled={moderatingReview === review.id}
                          onClick={() => handleModerateReview(review.id, "APPROVED")}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="btn-ghost bg-maroon-50 text-maroon-700"
                          disabled={moderatingReview === review.id}
                          onClick={() => handleModerateReview(review.id, "REJECTED")}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-primary-500" />
                <h2 className="text-lg font-semibold text-surface-900">Suspicious Accounts</h2>
              </div>
              <div className="space-y-3">
                {suspiciousAccounts.length === 0 ? (
                  <div className="text-surface-500">No suspicious accounts flagged.</div>
                ) : suspiciousAccounts.map((user) => (
                  <div key={user.id} className="rounded-2xl border border-surface-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-surface-900">{user.full_name}</p>
                        <p className="text-xs text-surface-500">{user.email}</p>
                      </div>
                      <button
                        type="button"
                        disabled={accountActionLoading === user.id}
                        onClick={() => handleAccountAction(user, user.account_status === "SUSPENDED")}
                        className="btn-primary"
                      >
                        {accountActionLoading === user.id ? "Processing…" : user.account_status === "SUSPENDED" ? "Activate" : "Suspend"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary-500" />
                <h2 className="text-lg font-semibold text-surface-900">Subscription Plans</h2>
              </div>
              <div className="space-y-3">
                {plans.map((plan) => (
                  <div key={plan.id} className="rounded-2xl border border-surface-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-surface-900">{plan.name}</p>
                        <p className="text-sm text-surface-500">{plan.description}</p>
                      </div>
                      <button
                        type="button"
                        disabled={planSaving === plan.id}
                        onClick={() => handleTogglePlanActive(plan)}
                        className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ${plan.is_active ? "bg-emerald-100 text-emerald-700" : "bg-surface-100 text-surface-600"}`}
                      >
                        {plan.is_active ? "Active" : "Paused"}
                      </button>
                    </div>
                    <div className="mt-4 flex flex-col gap-3">
                      <label className="text-xs uppercase tracking-wide text-surface-500">Monthly Price (TZS)</label>
                      <input
                        type="number"
                        value={plan.price_tzs}
                        onChange={(event) => handlePlanPriceChange(plan.id, Number(event.target.value))}
                        className="input w-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Database className="w-5 h-5 text-primary-500" />
                <h2 className="text-lg font-semibold text-surface-900">Reports & Backup</h2>
              </div>
              <div className="space-y-4">
                <button type="button" onClick={handleGenerateReport} className="btn-primary w-full">
                  Generate Report
                </button>
                <button type="button" onClick={handleBackupSystem} className="btn-outline border-surface-300 w-full">
                  Backup System
                </button>
                {reportSummary && (
                  <div className="rounded-2xl border border-surface-200 bg-surface-50 p-4">
                    <p className="text-sm text-surface-500">Report generated {new Date(reportSummary.generated_at).toLocaleString()}</p>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-surface-700">
                      <div>Total Users: {reportSummary.total_users}</div>
                      <div>Properties: {reportSummary.total_properties}</div>
                      <div>Revenue: TZS {reportSummary.total_revenue.toLocaleString()}</div>
                      <div>Open Complaints: {reportSummary.open_complaints}</div>
                      <div>Pending Reviews: {reportSummary.pending_reviews}</div>
                    </div>
                  </div>
                )}
                {backupStatus && (
                  <p className="text-sm text-surface-600">Last backup: {backupStatus}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList className="w-5 h-5 text-primary-500" />
            <h2 className="text-lg font-semibold text-surface-900">Audit Log</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200 text-left text-xs uppercase tracking-wide text-surface-500">
                  <th className="py-3 pr-4">When</th>
                  <th className="py-3 pr-4">Action</th>
                  <th className="py-3 pr-4">Entity</th>
                  <th className="py-3 pr-4">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="py-3 pr-4 text-surface-600">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="py-3 pr-4 font-medium text-surface-900">{log.action.replace(/_/g, " ")}</td>
                    <td className="py-3 pr-4 text-surface-600">{log.entity_name ?? "System"}</td>
                    <td className="py-3 pr-4 text-surface-600">{log.user_id ?? "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {auditLogs.length === 0 && (
            <div className="py-8 text-center text-surface-500">No recent audit entries available.</div>
          )}
        </div>
      </div>
    </div>
  );
}
