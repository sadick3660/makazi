import { useEffect, useState } from "react";
import { Users, Home, DollarSign, AlertTriangle, TrendingUp, BarChart2, PieChart, ShieldAlert, Clock } from "lucide-react";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Tooltip, Legend, Filler,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import { adminApi } from "../../services/api";
import type { AdminStats } from "../../types";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler);

const CHART_OPTS = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { adminApi.stats().then(setStats).finally(() => setLoading(false)); }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50">
      <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!stats) return null;

  const kpis = [
    { icon: Users,       label: "Total Users",      value: stats.total_users.toLocaleString(),     change: "+12%",  color: "bg-primary-100 text-primary-600" },
    { icon: Home,        label: "Active Listings",   value: stats.active_listings.toString(),       change: "+5%",   color: "bg-emerald-100 text-emerald-600" },
    { icon: DollarSign,  label: "Revenue (TZS)",     value: `${(stats.total_revenue / 1e6).toFixed(1)}M`, change: "+18%", color: "bg-amber-100 text-amber-600" },
    { icon: AlertTriangle, label: "Fraud Reports",   value: stats.fraud_reports.toString(),         change: "-2",    color: "bg-maroon-100 text-maroon-600" },
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
