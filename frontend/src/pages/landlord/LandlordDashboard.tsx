import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Home, Eye, Edit, Trash2, TrendingUp, Users, DollarSign, ChevronRight, CheckCircle, AlertTriangle } from "lucide-react";
import { propertiesApi } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import type { Property } from "../../types";
import toast from "react-hot-toast";
import clsx from "clsx";

const STATUS_STYLES: Record<string, string> = {
  available: "badge-green", rented: "badge-blue", pending: "badge-amber", suspended: "badge-maroon",
};

export default function LandlordDashboard() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    propertiesApi.search({}).then(r => setListings(r.results)).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this listing?")) return;
    await propertiesApi.delete(id);
    setListings(prev => prev.filter(p => p.id !== id));
    toast.success("Listing deleted.");
  };

  const stats = {
    total: listings.length,
    available: listings.filter(p => p.status === "available").length,
    rented: listings.filter(p => p.status === "rented").length,
    revenue: listings.filter(p => p.status === "rented").reduce((s, p) => s + p.rent_amount, 0),
  };

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <div className="bg-hero-gradient text-white px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-primary-200 text-sm mb-1">Landlord Dashboard</p>
              <h1 className="text-2xl sm:text-3xl font-bold">{user?.full_name}</h1>
            </div>
            <Link to="/landlord/add-property" className="btn-maroon flex-shrink-0">
              <Plus className="w-4 h-4" /> Add Listing
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
            {[
              { icon: Home,       label: "Total Listings",  value: stats.total,     color: "text-white" },
              { icon: CheckCircle,label: "Available",        value: stats.available, color: "text-emerald-300" },
              { icon: Users,      label: "Rented",           value: stats.rented,    color: "text-amber-300" },
              { icon: DollarSign, label: "Monthly Revenue",  value: `TZS ${(stats.revenue / 1000).toFixed(0)}k`, color: "text-primary-200" },
            ].map(s => (
              <div key={s.label} className="bg-white/10 border border-white/20 rounded-xl p-4">
                <s.icon className="w-5 h-5 text-white/60 mb-2" />
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-primary-200 text-xs">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-surface-900 text-lg">My Listings</h2>
          <Link to="/landlord/add-property" className="btn-outline text-sm">
            <Plus className="w-3.5 h-3.5" /> New Listing
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="card h-20 animate-pulse" />)}</div>
        ) : listings.length === 0 ? (
          <div className="card p-12 text-center">
            <Home className="w-12 h-12 text-surface-300 mx-auto mb-3" />
            <h3 className="font-semibold text-surface-700 mb-1">No listings yet</h3>
            <p className="text-surface-500 text-sm mb-5">Add your first property to start receiving inquiries.</p>
            <Link to="/landlord/add-property" className="btn-primary">
              <Plus className="w-4 h-4" /> Add First Listing
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map(p => (
              <div key={p.id} className="card p-4 flex items-center gap-4">
                <img src={p.images[0]?.url ?? "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200"}
                  alt={p.title} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-surface-900 text-sm truncate">{p.title}</h3>
                    <span className={clsx(STATUS_STYLES[p.status] ?? "badge-blue", "capitalize flex-shrink-0")}>{p.status}</span>
                    {p.is_price_flagged && (
                      <span className="badge-maroon gap-1 flex-shrink-0"><AlertTriangle className="w-2.5 h-2.5" />Flagged</span>
                    )}
                  </div>
                  <p className="text-xs text-surface-500">{p.ward} · {p.rooms} rooms · TZS {p.rent_amount.toLocaleString()}/mo</p>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <Link to={`/properties/${p.id}`}
                    className="p-2 text-surface-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <button className="p-2 text-surface-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(p.id)}
                    className="p-2 text-surface-400 hover:text-maroon-600 hover:bg-maroon-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
