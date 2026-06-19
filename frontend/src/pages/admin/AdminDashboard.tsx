import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, Home, DollarSign, AlertTriangle, TrendingUp, BarChart2, PieChart, ShieldAlert, Clock, CheckCircle2, Eye, UserCheck } from "lucide-react";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Tooltip, Legend, Filler,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import { adminApi } from "../../services/api";
import type { AdminStats, LandlordUser, Property } from "../../types";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler);

const CHART_OPTS = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingLandlords, setPendingLandlords] = useState<LandlordUser[]>([]);
  const [pendingProperties, setPendingProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      adminApi.stats().then(setStats),
      adminApi.landlords().then(setPendingLandlords),
      adminApi.properties().then(setPendingProperties),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50">
      <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!stats) return null;

  const pendingLandlordCount = pendingLandlords.filter((landlord) => landlord.verification_status === "PENDING").length;

  const handleVerifyLandlord = async (landlordId: string) => {
    setActionLoading(landlordId);
    await adminApi.verifyLandlord(landlordId);
    setPendingLandlords((current) => current.filter((landlord) => landlord.id !== landlordId));
    setStats((prev) => prev ? { ...prev, pending_landlord_verifications: Math.max(prev.pending_landlord_verifications - 1, 0) } : prev);
    setActionLoading(null);
  };

  const handleApproveProperty = async (propertyId: string) => {
    setActionLoading(propertyId);
    await adminApi.approveProperty(propertyId);
    setPendingProperties((current) => current.filter((property) => property.id !== propertyId));
    setStats((prev) => prev ? { ...prev, pending_approvals: Math.max(prev.pending_approvals - 1, 0) } : prev);
    setActionLoading(null);
  };

  const kpis = [
    { icon: Users,       label: "Total Users",      value: stats.total_users.toLocaleString(),     change: "+12%",  color: "bg-primary-100 text-primary-600" },
    { icon: Home,        label: "Active Listings",   value: stats.active_listings.toString(),       change: "+5%",   color: "bg-emerald-100 text-emerald-600" },
    { icon: DollarSign,  label: "Revenue (TZS)",     value: `${(stats.total_revenue / 1e6).toFixed(1)}M`, change: "+18%", color: "bg-amber-100 text-amber-600" },
    { icon: AlertTriangle, label: "Fraud Reports",   value: stats.fraud_reports.toString(),         change: "-2",    color: "bg-maroon-100 text-maroon-600" },
    { icon: UserCheck,   label: "Landlord Verifications", value: stats.pending_landlord_verifications?.toString() ?? "0", change: "",      color: "bg-surface-100 text-surface-600" },
    { icon: Clock,       label: "Pending Approvals", value: stats.pending_approvals.toString(),     change: "",      color: "bg-surface-100 text-surface-600" },
  ];

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <div className="bg-hero-gradient text-white px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <ShieldAlert className="w-6 h-6 text-white/80" />
            <span className="text-primary-200 text-sm font-medium">Administrator</span>
          </div>
          <h1 className="text-3xl font-bold">Platform Analytics</h1>
          <p className="text-primary-200 mt-1">NyumbaLink system overview</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {kpis.map(k => (
            <div key={k.label} className="card p-5">
              <div className={`w-10 h-10 ${k.color} rounded-xl flex items-center justify-center mb-3`}>
                <k.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-surface-900">{k.value}</p>
              <p className="text-xs text-surface-500 mt-0.5">{k.label}</p>
              {k.change && <p className={`text-xs font-semibold mt-1 ${k.change.startsWith("+") ? "text-emerald-600" : "text-maroon-600"}`}>{k.change}</p>}
            </div>
          ))}
        </div>

        {/* Charts row 1 */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="font-semibold text-surface-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary-500" /> User Growth
            </h3>
            <div className="h-56">
              <Line data={{
                labels: stats.users_by_month.map(d => d.month),
                datasets: [{
                  label: "Users",
                  data: stats.users_by_month.map(d => d.count),
                  borderColor: "#1B3A6B", backgroundColor: "rgba(27,58,107,0.1)",
                  fill: true, tension: 0.4, pointBackgroundColor: "#1B3A6B",
                }],
              }} options={CHART_OPTS} />
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-surface-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-500" /> Monthly Revenue (TZS)
            </h3>
            <div className="h-56">
              <Bar data={{
                labels: stats.revenue_by_month.map(d => d.month),
                datasets: [{
                  label: "Revenue",
                  data: stats.revenue_by_month.map(d => d.amount),
                  backgroundColor: "rgba(128,0,32,0.8)",
                  borderRadius: 6,
                }],
              }} options={CHART_OPTS} />
            </div>
          </div>
        </div>

        {/* Charts row 2 */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="card p-6">
            <h3 className="font-semibold text-surface-900 mb-4 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-500" /> Listings by Municipality
            </h3>
            <div className="h-52">
              <Doughnut data={{
                labels: stats.listings_by_municipality.map(d => d.municipality),
                datasets: [{
                  data: stats.listings_by_municipality.map(d => d.count),
                  backgroundColor: ["#1B3A6B","#800020","#059669","#d97706","#6366f1"],
                  borderWidth: 0,
                }],
              }} options={{ ...CHART_OPTS, plugins: { legend: { display: true, position: "bottom", labels: { boxWidth: 10, font: { size: 10 } } } } }} />
            </div>
          </div>

          <div className="card p-6 md:col-span-2">
            <h3 className="font-semibold text-surface-900 mb-4 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-primary-500" /> Top Wards by Listings
            </h3>
            <div className="h-52">
              <Bar data={{
                labels: stats.popular_wards.map(d => d.ward),
                datasets: [{
                  label: "Listings",
                  data: stats.popular_wards.map(d => d.count),
                  backgroundColor: "rgba(27,58,107,0.7)",
                  borderRadius: 6,
                }],
              }} options={{ ...CHART_OPTS, plugins: { legend: { display: false } }, indexAxis: "y" } as never} />
            </div>
          </div>
        </div>

        <div className="grid xl:grid-cols-[1.3fr_0.7fr] gap-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-surface-900">Admin Control Center</h3>
                <p className="text-sm text-surface-500">Quick links to the most important admin workflows.</p>
              </div>
              <div className="flex items-center gap-2">
                <Link to="/admin/reports" className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 transition-colors">
                  <BarChart2 className="w-4 h-4" /> Reports
                </Link>
                <Link to="/admin/settings" className="inline-flex items-center gap-2 rounded-full border border-surface-200 bg-white px-4 py-2 text-sm font-semibold text-surface-900 hover:bg-surface-50 transition-colors">
                  <ShieldAlert className="w-4 h-4" /> Settings
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-surface-200 bg-surface-50 p-4">
                <p className="text-xs uppercase tracking-wide text-surface-500">Pending Verifications</p>
                <p className="mt-2 text-3xl font-semibold text-surface-900">{pendingLandlordCount}</p>
              </div>
              <div className="rounded-2xl border border-surface-200 bg-surface-50 p-4">
                <p className="text-xs uppercase tracking-wide text-surface-500">Pending Property Approvals</p>
                <p className="mt-2 text-3xl font-semibold text-surface-900">{pendingProperties.length}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-surface-900">Pending Landlord Verifications</h3>
                <span className="text-sm text-surface-500">{pendingLandlordCount} awaiting review</span>
              </div>
              {pendingLandlords.length === 0 ? (
                <div className="py-8 text-center text-surface-500">No landlord accounts pending verification.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-200">
                        {['Landlord','Email','Status','Actions'].map(h => (
                          <th key={h} className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wide pb-3 pr-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100">
                      {pendingLandlords.map((landlord) => (
                        <tr key={landlord.id}>
                          <td className="py-3 pr-4 font-medium text-surface-900">{landlord.full_name}</td>
                          <td className="py-3 pr-4 text-surface-600">{landlord.email}</td>
                          <td className="py-3 pr-4 text-surface-600">{landlord.verification_status ?? 'PENDING'}</td>
                          <td className="py-3">
                            <button
                              type="button"
                              disabled={actionLoading === landlord.id}
                              onClick={() => handleVerifyLandlord(landlord.id)}
                              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-surface-200 disabled:text-surface-500"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Verify
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-surface-900">Pending Property Listings</h3>
                <span className="text-sm text-surface-500">{pendingProperties.length} awaiting approval</span>
              </div>
              {pendingProperties.length === 0 ? (
                <div className="py-8 text-center text-surface-500">No properties need approval right now.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-200">
                        {['Title','Landlord','Ward','Actions'].map(h => (
                          <th key={h} className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wide pb-3 pr-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100">
                      {pendingProperties.map((property) => (
                        <tr key={property.id}>
                          <td className="py-3 pr-4 font-medium text-surface-900">{property.title}</td>
                          <td className="py-3 pr-4 text-surface-600">{property.landlord_name ?? 'Unknown'}</td>
                          <td className="py-3 pr-4 text-surface-600">{property.ward}</td>
                          <td className="py-3">
                            <button
                              type="button"
                              disabled={actionLoading === property.id}
                              onClick={() => handleApproveProperty(property.id)}
                              className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-surface-200 disabled:text-surface-500"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Approve
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent actions table */}
        <div className="card p-6">
          <h3 className="font-semibold text-surface-900 mb-4">Recent Admin Actions</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200">
                  {["Action","User","Date","Status"].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wide pb-3 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {[
                  { action: "Approved Listing", user: "John M.", date: "Jun 13, 2025", status: "approved" },
                  { action: "Flagged Fraud Report", user: "System", date: "Jun 13, 2025", status: "flagged" },
                  { action: "Suspended User", user: "Admin", date: "Jun 12, 2025", status: "suspended" },
                  { action: "Verified Landlord", user: "Admin", date: "Jun 12, 2025", status: "verified" },
                ].map((row, i) => (
                  <tr key={i}>
                    <td className="py-3 pr-4 font-medium text-surface-900">{row.action}</td>
                    <td className="py-3 pr-4 text-surface-600">{row.user}</td>
                    <td className="py-3 pr-4 text-surface-500">{row.date}</td>
                    <td className="py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        row.status === "approved" || row.status === "verified" ? "bg-emerald-100 text-emerald-700"
                        : row.status === "flagged" ? "bg-amber-100 text-amber-700"
                        : "bg-maroon-100 text-maroon-700"
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
