import { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, Map as MapIcon, Grid, SlidersHorizontal, X, Building2, Star, Scale } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import clsx from "clsx";
import { propertiesApi } from "../services/api";
import PropertyCard from "../components/ui/PropertyCard";
import { useLang } from "../contexts/LanguageContext";
import type { Property, PropertyType, Municipality, Ward } from "../types";

const MUNICIPALITIES: Municipality[] = ["Ilala", "Kinondoni", "Ubungo", "Temeke", "Kigamboni"];
const WARDS: Ward[] = ["Mikocheni","Mwananyamala","Kijitonyama","Mwenge","Mabatini","Makumbusho","Sinza","Tandale","Ubungo","Ilala","Temeke","Kigamboni"];
const TYPES: PropertyType[] = ["room","house","hostel","apartment"];

function makeIcon(type: PropertyType, flagged: boolean) {
  const color = flagged ? "#800020" : type === "house" ? "#1B3A6B" : type === "hostel" ? "#92400e" : type === "apartment" ? "#065f46" : "#1B3A6B";
  return L.divIcon({
    html: `<div style="width:32px;height:32px;background:${color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid #fff">
      <span style="transform:rotate(45deg);font-size:13px">${type === "house" ? "🏠" : type === "hostel" ? "🏨" : type === "apartment" ? "🏢" : "🛏️"}</span></div>`,
    className: "", iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32],
  });
}

export default function SearchPage() {
  const { t } = useLang();
  const [params, setParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [results, setResults] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState({
    query: params.get("q") ?? "",
    municipality: (params.get("municipality") ?? "") as Municipality | "",
    ward: (params.get("ward") ?? "") as Ward | "",
    type: (params.get("type") ?? "") as PropertyType | "",
    max_rent: params.get("max_rent") ?? "",
    min_rooms: params.get("min_rooms") ?? "",
    is_furnished: false,
    gender_policy: "" as "" | "girls" | "boys" | "mixed",
  });
  const [compareList, setCompareList] = useState<Property[]>([]);

  const doSearch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await propertiesApi.search({
        query: filters.query || undefined,
        municipality: filters.municipality || undefined,
        ward: filters.ward || undefined,
        type: filters.type || undefined,
        max_rent: filters.max_rent ? Number(filters.max_rent) : undefined,
        min_rooms: filters.min_rooms ? Number(filters.min_rooms) : undefined,
        is_furnished: filters.is_furnished || undefined,
      });
      let list = res.results;
      // Client-side gender_policy filter (hostel specific)
      if (filters.gender_policy) {
        list = list.filter(p => (p as Property & { gender_policy?: string }).gender_policy === filters.gender_policy);
      }
      setResults(list);
      setTotal(list.length);
    } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { doSearch(); }, [doSearch]);

  const handleFilterChange = (key: string, val: string | boolean) =>
    setFilters(f => ({ ...f, [key]: val }));

  const clearFilters = () =>
    setFilters({ query: "", municipality: "", ward: "", type: "", max_rent: "", min_rooms: "", is_furnished: false, gender_policy: "" });

  const toggleCompare = (p: Property) => {
    setCompareList(prev =>
      prev.find(x => x.id === p.id)
        ? prev.filter(x => x.id !== p.id)
        : prev.length < 3 ? [...prev, p] : prev
    );
  };

  const activeFilterCount = [filters.municipality, filters.ward, filters.type, filters.max_rent, filters.min_rooms, filters.is_furnished, filters.gender_policy]
    .filter(Boolean).length;

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Search bar */}
      <div className="bg-white border-b border-surface-200 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2 bg-surface-100 rounded-xl px-4 py-2.5">
              <Search className="w-4 h-4 text-surface-400 flex-shrink-0" />
              <input
                value={filters.query}
                onChange={e => handleFilterChange("query", e.target.value)}
                placeholder={t("search.placeholder")}
                className="flex-1 bg-transparent text-sm text-surface-800 outline-none placeholder-surface-400"
              />
              {filters.query && (
                <button onClick={() => handleFilterChange("query", "")} className="text-surface-400 hover:text-surface-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button onClick={() => setShowFilters(!showFilters)}
              className={clsx("flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors",
                showFilters || activeFilterCount > 0
                  ? "bg-primary-500 text-white border-primary-500"
                  : "bg-white text-surface-700 border-surface-200 hover:bg-surface-50")}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters {activeFilterCount > 0 && <span className="bg-white/30 rounded-full w-5 h-5 flex items-center justify-center text-xs">{activeFilterCount}</span>}
            </button>

            <div className="hidden sm:flex items-center bg-surface-100 rounded-xl p-1 gap-1">
              {([["grid", Grid], ["map", MapIcon]] as const).map(([mode, Icon]) => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  className={clsx("p-2 rounded-lg transition-colors", viewMode === mode ? "bg-white shadow-sm text-primary-600" : "text-surface-500")}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="pt-3 pb-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 animate-slide-up border-t border-surface-100 mt-3">
              <select value={filters.municipality} onChange={e => handleFilterChange("municipality", e.target.value)} className="select text-sm">
                <option value="">All Municipalities</option>
                {MUNICIPALITIES.map(m => <option key={m}>{m}</option>)}
              </select>
              <select value={filters.ward} onChange={e => handleFilterChange("ward", e.target.value)} className="select text-sm">
                <option value="">All Wards</option>
                {WARDS.map(w => <option key={w}>{w}</option>)}
              </select>
              <select value={filters.type} onChange={e => handleFilterChange("type", e.target.value)} className="select text-sm">
                <option value="">All Types</option>
                {TYPES.map(tp => <option key={tp} value={tp} className="capitalize">{t(`type.${tp}`)}</option>)}
              </select>
              <input type="number" value={filters.max_rent} onChange={e => handleFilterChange("max_rent", e.target.value)}
                placeholder="Max Rent (TZS)" className="input text-sm" />
              <input type="number" value={filters.min_rooms} onChange={e => handleFilterChange("min_rooms", e.target.value)}
                placeholder="Min Rooms" className="input text-sm" min={1} max={10} />
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm text-surface-700 cursor-pointer">
                  <input type="checkbox" checked={filters.is_furnished} onChange={e => handleFilterChange("is_furnished", e.target.checked)}
                    className="accent-primary-500 w-4 h-4" />
                  Furnished
                </label>
                {filters.type === "hostel" && (
                  <select value={filters.gender_policy} onChange={e => handleFilterChange("gender_policy", e.target.value)}
                    className="select text-sm py-2"
                  >
                    <option value="">Any Gender</option>
                    <option value="girls">👩 Girls Only</option>
                    <option value="boys">👨 Boys Only</option>
                    <option value="mixed">👥 Mixed</option>
                  </select>
                )}
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="ml-auto text-xs text-maroon-600 hover:underline">Clear</button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-surface-600 font-medium">
            {loading ? t("common.loading") : `${total} ${t("search.results")}`}
          </p>
          {/* Hostel shortcut */}
          {!filters.type && (
            <Link to="/hostels"
              className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 border border-primary-200 rounded-lg px-3 py-1.5"
            >
              <Building2 className="w-3.5 h-3.5" /> Browse All Hostels →
            </Link>
          )}
        </div>

        {/* Compare bar */}
        {compareList.length > 0 && (
          <div className="mb-5 bg-primary-900 text-white rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Scale className="w-5 h-5 text-primary-300 flex-shrink-0" />
              <span className="text-sm font-semibold">Comparing {compareList.length} propert{compareList.length > 1 ? "ies" : "y"}</span>
              {compareList.map(p => (
                <span key={p.id} className="flex items-center gap-1.5 bg-primary-800 rounded-lg px-3 py-1 text-xs">
                  {p.title.slice(0, 20)}…
                  <button onClick={() => toggleCompare(p)} className="text-primary-300 hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <button onClick={() => setCompareList([])} className="text-xs text-primary-300 hover:text-white flex-shrink-0">
              Clear all
            </button>
          </div>
        )}

        {/* Compare grid */}
        {compareList.length >= 2 && (
          <div className="mb-8 card p-5 overflow-x-auto">
            <h3 className="font-semibold text-surface-900 mb-4 flex items-center gap-2">
              <Scale className="w-4 h-4 text-primary-500" /> Property Comparison
            </h3>
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-surface-200">
                  <th className="text-left text-xs font-semibold text-surface-500 pb-3 w-32">Feature</th>
                  {compareList.map(p => (
                    <th key={p.id} className="text-left text-xs font-semibold text-surface-800 pb-3 px-3">{p.title.slice(0, 25)}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {[
                  { label: "Price/mo", render: (p: Property) => `TZS ${p.rent_amount.toLocaleString()}` },
                  { label: "Type",     render: (p: Property) => p.type },
                  { label: "Ward",     render: (p: Property) => p.ward },
                  { label: "Rooms",    render: (p: Property) => p.rooms },
                  { label: "Bathrooms",render: (p: Property) => p.bathrooms },
                  { label: "Furnished",render: (p: Property) => p.is_furnished ? "✅" : "❌" },
                  { label: "WiFi",     render: (p: Property) => p.has_wifi ? "✅" : "❌" },
                  { label: "Water",    render: (p: Property) => p.water_reliability },
                  { label: "Electricity",render: (p: Property) => p.electricity_config },
                  { label: "Rating",   render: (p: Property) => p.average_rating ? `⭐ ${p.average_rating}` : "—" },
                ].map(row => (
                  <tr key={row.label}>
                    <td className="py-2.5 text-xs font-semibold text-surface-500 capitalize">{row.label}</td>
                    {compareList.map(p => (
                      <td key={p.id} className="py-2.5 px-3 text-surface-800 capitalize">{row.render(p)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {viewMode === "grid" ? (
          loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="card overflow-hidden animate-pulse">
                  <div className="h-48 bg-surface-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-surface-200 rounded w-3/4" />
                    <div className="h-3 bg-surface-100 rounded w-1/2" />
                    <div className="h-3 bg-surface-100 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🏘️</div>
              <h3 className="text-lg font-semibold text-surface-700 mb-2">No properties found</h3>
              <p className="text-surface-500 text-sm">Try adjusting your filters or search term.</p>
              <button onClick={clearFilters} className="btn-outline mt-4">Clear Filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {results.map(p => (
                <div key={p.id} className="relative">
                  <PropertyCard property={p} />
                  <button
                    onClick={() => toggleCompare(p)}
                    title="Add to comparison"
                    className={clsx(
                      "absolute top-2 left-2 z-10 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm transition-colors border",
                      compareList.find(x => x.id === p.id)
                        ? "bg-primary-500 text-white border-primary-400"
                        : "bg-white/90 text-surface-600 border-surface-200 hover:bg-primary-50 hover:text-primary-600"
                    )}
                  >
                    {compareList.find(x => x.id === p.id) ? "✓" : <Scale className="w-3 h-3" />}
                  </button>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="h-[70vh] rounded-2xl overflow-hidden border border-surface-200 shadow-card">
            <MapContainer center={[-6.792, 39.249]} zoom={13} className="h-full w-full" zoomControl={false}>
              <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {results.map(p => (
                <Marker key={p.id} position={[p.latitude, p.longitude]} icon={makeIcon(p.type, p.is_price_flagged)}>
                  <Popup>
                    <div className="text-xs min-w-40">
                      <p className="font-bold text-sm text-surface-900 mb-1">{p.title}</p>
                      <p className="font-semibold text-primary-600">TZS {p.rent_amount.toLocaleString()} /mo</p>
                      <p className="text-surface-500">{p.ward} · {p.rooms} rooms</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}
      </div>
    </div>
  );
}
