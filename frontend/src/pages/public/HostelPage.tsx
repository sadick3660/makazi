/**
 * HostelPage — Dedicated hostel browser with advanced filters.
 * Shows all 9 NyumbaLink partner hostels with capacity, gender, distance, and map.
 */
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Building2, MapPin, Users, Navigation, Phone, Wifi, Car,
  Filter, X, ChevronRight, Star, ExternalLink, Droplets, Zap,
} from "lucide-react";
import clsx from "clsx";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { MOCK_HOSTELS } from "../../data/hostels";

type GenderFilter = "all" | "girls" | "boys" | "mixed";
type SortKey = "price_asc" | "price_desc" | "distance" | "capacity";

const GENDER_BADGE = {
  girls:  { label: "Girls Only",   icon: "👩", cls: "bg-pink-100 text-pink-700 border-pink-200" },
  boys:   { label: "Boys Only",    icon: "👨", cls: "bg-blue-100 text-blue-700 border-blue-200" },
  mixed:  { label: "Girls & Boys", icon: "👥", cls: "bg-purple-100 text-purple-700 border-purple-200" },
};

function HostelCard({ hostel }: { hostel: typeof MOCK_HOSTELS[0] }) {
  const badge = GENDER_BADGE[hostel.gender_policy ?? "mixed"];
  return (
    <Link to={`/properties/${hostel.id}`}
      className="card overflow-hidden group hover:scale-[1.015] transition-transform duration-200 flex flex-col"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img src={hostel.images[0]?.url} alt={hostel.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent" />

        {/* Gender badge */}
        <span className={clsx("absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1", badge.cls)}>
          {badge.icon} {badge.label}
        </span>

        {/* Price */}
        <div className="absolute bottom-3 left-3 text-white">
          <p className="font-bold text-lg leading-none drop-shadow">
            TZS {hostel.rent_amount.toLocaleString()}
            {hostel.price_range_max && (
              <span className="text-sm text-white/80"> – {(hostel.price_range_max / 1000).toFixed(0)}K</span>
            )}
          </p>
          <p className="text-xs text-white/80">/month</p>
        </div>

        {/* Google Maps button */}
        {hostel.google_maps_url && (
          <a href={hostel.google_maps_url} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow hover:bg-white transition-colors"
            title="Open in Google Maps"
          >
            <Navigation className="w-3.5 h-3.5 text-primary-600" />
          </a>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-surface-900 text-sm leading-tight mb-1 group-hover:text-primary-600 transition-colors line-clamp-2">
          {hostel.title}
        </h3>

        <div className="flex items-center gap-1.5 text-xs text-surface-500 mb-3">
          <MapPin className="w-3.5 h-3.5 text-maroon-400 flex-shrink-0" />
          <span className="truncate">{hostel.street_address}</span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-surface-50 rounded-lg p-2 text-center">
            <p className="font-bold text-sm text-surface-900">{hostel.capacity}</p>
            <p className="text-[10px] text-surface-500">Beds</p>
          </div>
          <div className="bg-surface-50 rounded-lg p-2 text-center">
            <p className="font-bold text-sm text-surface-900">
              {hostel.distance_to_udsm_km && hostel.distance_to_udsm_km < 1
                ? `${(hostel.distance_to_udsm_km * 1000).toFixed(0)}m`
                : `${hostel.distance_to_udsm_km}km`}
            </p>
            <p className="text-[10px] text-surface-500">Distance</p>
          </div>
          <div className="bg-surface-50 rounded-lg p-2 text-center">
            <p className="font-bold text-sm text-surface-900">{hostel.bathrooms}</p>
            <p className="text-[10px] text-surface-500">Baths</p>
          </div>
        </div>

        {/* Amenity chips */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {hostel.has_wifi && (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 rounded-md px-2 py-0.5">
              <Wifi className="w-3 h-3" />WiFi
            </span>
          )}
          {hostel.has_parking && (
            <span className="inline-flex items-center gap-1 text-[11px] text-surface-600 bg-surface-100 rounded-md px-2 py-0.5">
              <Car className="w-3 h-3" />Parking
            </span>
          )}
          {hostel.water_reliability === "continuous" && (
            <span className="inline-flex items-center gap-1 text-[11px] text-blue-700 bg-blue-50 rounded-md px-2 py-0.5">
              <Droplets className="w-3 h-3" />24/7 Water
            </span>
          )}
          {hostel.electricity_config !== "none" && (
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 rounded-md px-2 py-0.5">
              <Zap className="w-3 h-3" />Power
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-surface-100">
          <a href={`tel:${hostel.landlord_phone}`} onClick={e => e.stopPropagation()}
            className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
          >
            <Phone className="w-3.5 h-3.5" />
            Call
          </a>
          <span className="text-xs text-primary-600 font-semibold flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
            View Details <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function HostelPage() {
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("distance");
  const [maxPrice, setMaxPrice] = useState("");
  const [showMap, setShowMap] = useState(false);

  const filtered = useMemo(() => {
    let list = [...MOCK_HOSTELS];
    if (genderFilter !== "all") list = list.filter(h => h.gender_policy === genderFilter);
    if (maxPrice) list = list.filter(h => h.rent_amount <= Number(maxPrice));
    switch (sortKey) {
      case "price_asc":  list.sort((a, b) => a.rent_amount - b.rent_amount); break;
      case "price_desc": list.sort((a, b) => b.rent_amount - a.rent_amount); break;
      case "distance":   list.sort((a, b) => (a.distance_to_udsm_km ?? 99) - (b.distance_to_udsm_km ?? 99)); break;
      case "capacity":   list.sort((a, b) => (b.capacity ?? 0) - (a.capacity ?? 0)); break;
    }
    return list;
  }, [genderFilter, sortKey, maxPrice]);

  const totalBeds   = MOCK_HOSTELS.reduce((s, h) => s + (h.capacity ?? 0), 0);
  const minPrice    = Math.min(...MOCK_HOSTELS.map(h => h.rent_amount));
  const maxPriceAll = Math.max(...MOCK_HOSTELS.map(h => h.price_range_max ?? h.rent_amount));

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Hero */}
      <div className="bg-hero-gradient text-white py-14 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-primary-200 text-sm mb-3">
            <Building2 className="w-4 h-4" />
            <span>Student Hostels · Dar es Salaam</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            Partner Hostels
          </h1>
          <p className="text-white/80 text-lg mb-8 max-w-2xl">
            9 verified hostels near IAA, UDSM, and MUST. Fair prices, clear gender policies, real availability.
          </p>

          {/* Stats bar */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 max-w-lg">
            {[
              { value: MOCK_HOSTELS.length, label: "Partner Hostels" },
              { value: totalBeds,           label: "Total Beds" },
              { value: `TZS ${(minPrice/1000).toFixed(0)}K+`, label: "Starting From" },
              { value: "All Areas",         label: "Coverage" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-white/60 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white border-b border-surface-200 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Gender filter */}
            <div className="flex items-center gap-1 bg-surface-100 rounded-xl p-1">
              {(["all", "girls", "boys", "mixed"] as GenderFilter[]).map(g => (
                <button key={g} onClick={() => setGenderFilter(g)}
                  className={clsx(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize",
                    genderFilter === g ? "bg-white shadow-sm text-primary-600" : "text-surface-500 hover:text-surface-700"
                  )}
                >
                  {g === "all" ? "All" : g === "girls" ? "👩 Girls" : g === "boys" ? "👨 Boys" : "👥 Mixed"}
                </button>
              ))}
            </div>

            {/* Max price */}
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Max price (TZS)"
                value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)}
                className="input text-xs w-40 py-2"
              />
              {maxPrice && (
                <button onClick={() => setMaxPrice("")} className="text-surface-400 hover:text-surface-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sort */}
            <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)}
              className="select text-xs py-2 w-40"
            >
              <option value="distance">Nearest First</option>
              <option value="price_asc">Cheapest First</option>
              <option value="price_desc">Most Expensive</option>
              <option value="capacity">Largest Capacity</option>
            </select>

            {/* Map toggle */}
            <button onClick={() => setShowMap(v => !v)}
              className={clsx(
                "ml-auto flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-medium transition-colors",
                showMap ? "bg-primary-500 text-white border-primary-500" : "bg-white text-surface-700 border-surface-200 hover:bg-surface-50"
              )}
            >
              <MapPin className="w-3.5 h-3.5" />
              {showMap ? "Hide Map" : "Show Map"}
            </button>

            <span className="text-xs text-surface-500 font-medium">{filtered.length} hostel{filtered.length !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Map view */}
        {showMap && (
          <div className="mb-8 h-80 rounded-2xl overflow-hidden border border-surface-200 shadow-card">
            <MapContainer center={[-6.785, 39.257]} zoom={14} className="h-full w-full" zoomControl>
              <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {filtered.map(h => (
                <Marker key={h.id} position={[h.latitude, h.longitude]}
                  icon={L.divIcon({
                    html: `<div style="background:${h.gender_policy === 'girls' ? '#ec4899' : h.gender_policy === 'boys' ? '#3b82f6' : '#8b5cf6'};width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"><span style="transform:rotate(45deg);font-size:14px">🏨</span></div>`,
                    className: "", iconSize: [34, 34], iconAnchor: [17, 34], popupAnchor: [0, -34],
                  })}
                >
                  <Popup>
                    <div className="text-xs min-w-44">
                      <p className="font-bold text-sm text-surface-900 mb-1">{h.title}</p>
                      <p className="font-semibold text-primary-600 mb-0.5">TZS {h.rent_amount.toLocaleString()}/mo</p>
                      <p className="text-surface-500 mb-1">{h.capacity} beds · {h.gender_policy === 'girls' ? '👩 Girls only' : h.gender_policy === 'boys' ? '👨 Boys only' : '👥 Mixed'}</p>
                      {h.google_maps_url && (
                        <a href={h.google_maps_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary-600 hover:underline text-[11px] font-medium"
                        >
                          <ExternalLink className="w-3 h-3" /> Open in Google Maps
                        </a>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🏨</div>
            <h3 className="text-lg font-semibold text-surface-700 mb-2">No hostels match your filters</h3>
            <p className="text-surface-500 text-sm">Try adjusting the gender filter or price range.</p>
            <button onClick={() => { setGenderFilter("all"); setMaxPrice(""); }}
              className="btn-outline mt-4"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(h => <HostelCard key={h.id} hostel={h} />)}
          </div>
        )}

        {/* Info banner */}
        <div className="mt-10 bg-primary-50 border border-primary-100 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Phone className="w-6 h-6 text-primary-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-primary-900 mb-1">All hostel inquiries</h3>
            <p className="text-sm text-primary-700">Contact all partner hostels on the same number:</p>
            <a href="tel:+255653870753" className="text-lg font-bold text-primary-600 hover:text-primary-700">
              +255 653 870 753
            </a>
          </div>
          <a href="tel:+255653870753" className="btn-primary flex-shrink-0">
            <Phone className="w-4 h-4" /> Call Now
          </a>
        </div>
      </div>
    </div>
  );
}
