import { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Bed, Droplets, Zap, Wifi, Heart, Star, AlertTriangle, ChevronRight, Navigation } from "lucide-react";
import clsx from "clsx";
import type { Property } from "../../types";
import { favoritesApi } from "../../services/api";
import toast from "react-hot-toast";

interface Props {
  property: Property;
  compact?: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  room: "badge-blue", house: "badge-green", hostel: "badge-amber", apartment: "badge-maroon",
};

export default function PropertyCard({ property: p, compact = false }: Props) {
  const [isFav, setIsFav] = useState(false);
  const img = p.images.find(i => i.is_primary) ?? p.images[0];

  const toggleFav = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      if (isFav) { await favoritesApi.remove(p.id); toast("Removed from favorites"); }
      else        { await favoritesApi.add(p.id);    toast.success("Added to favorites!"); }
      setIsFav(!isFav);
    } catch { toast.error("Please log in to save favorites"); }
  };

  return (
    <Link to={`/properties/${p.id}`} className="card block overflow-hidden group animate-fade-in">
      {/* Image */}
      <div className="relative overflow-hidden" style={{ height: compact ? 160 : 200 }}>
        <img
          src={img?.url ?? "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800"}
          alt={p.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className={clsx(TYPE_COLORS[p.type] ?? "badge-blue", "capitalize")}>{p.type}</span>
          {p.is_price_flagged && (
            <span className="badge-maroon gap-1"><AlertTriangle className="w-3 h-3" />Flagged</span>
          )}
        </div>

        <button onClick={toggleFav}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow hover:scale-110 transition-transform"
        >
          <Heart className={clsx("w-4 h-4 transition-colors", isFav ? "fill-maroon-500 text-maroon-500" : "text-surface-400")} />
        </button>

        <div className="absolute bottom-3 left-3">
          <p className="text-white font-bold text-lg leading-none drop-shadow">
            {p.type === "hostel" && p.price_range_max
              ? <>TZS {p.rent_amount.toLocaleString()}<span className="text-white/70 text-sm font-normal"> – {(p.price_range_max / 1000).toFixed(0)}K</span></>
              : <>TZS {p.rent_amount.toLocaleString()}<span className="text-white/80 text-xs font-normal"> /mo</span></>
            }
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="font-semibold text-surface-900 text-sm leading-tight mb-2 group-hover:text-primary-600 transition-colors line-clamp-1">
          {p.title}
        </h3>

        <div className="flex items-center gap-1.5 text-xs text-surface-500 mb-3">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-maroon-400" />
          <span className="truncate">{p.ward}, {p.municipality}</span>
        </div>

        {/* Chips */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {/* Hostel: gender policy badge */}
          {p.type === "hostel" && p.gender_policy && (
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold rounded-md px-2 py-0.5 ${
              p.gender_policy === "girls" ? "bg-pink-100 text-pink-700" :
              p.gender_policy === "boys"  ? "bg-blue-100 text-blue-700" :
              "bg-purple-100 text-purple-700"
            }`}>
              {p.gender_policy === "girls" ? "👩 Girls Only" :
               p.gender_policy === "boys"  ? "👨 Boys Only" : "👥 Mixed"}
            </span>
          )}
          {/* Hostel: capacity */}
          {p.type === "hostel" && p.capacity && (
            <span className="inline-flex items-center gap-1 text-[11px] text-surface-600 bg-surface-100 rounded-md px-2 py-0.5">
              🏠 {p.capacity} beds
            </span>
          )}
          {/* Hostel: distance */}
          {p.type === "hostel" && p.distance_to_udsm_km && (
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 rounded-md px-2 py-0.5">
              📍 {p.distance_to_udsm_km < 1
                  ? `${(p.distance_to_udsm_km * 1000).toFixed(0)}m`
                  : `${p.distance_to_udsm_km}km`}
            </span>
          )}
          {/* Non-hostel standard chips */}
          {p.type !== "hostel" && (
            <span className="inline-flex items-center gap-1 text-[11px] text-surface-600 bg-surface-100 rounded-md px-2 py-0.5">
              <Bed className="w-3 h-3" />{p.rooms} room{p.rooms !== 1 ? "s" : ""}
            </span>
          )}
          {p.water_reliability === "continuous" && (
            <span className="inline-flex items-center gap-1 text-[11px] text-blue-700 bg-blue-50 rounded-md px-2 py-0.5">
              <Droplets className="w-3 h-3" />24/7 Water
            </span>
          )}
          {p.electricity_config !== "none" && (
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 rounded-md px-2 py-0.5">
              <Zap className="w-3 h-3" />Power
            </span>
          )}
          {p.has_wifi && (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 rounded-md px-2 py-0.5">
              <Wifi className="w-3 h-3" />WiFi
            </span>
          )}
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between pt-3 border-t border-surface-100">
          <div className="flex items-center gap-3">
            {p.average_rating ? (
              <div className="flex items-center gap-1 text-xs text-surface-500">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-surface-700">{p.average_rating.toFixed(1)}</span>
                <span>({p.review_count})</span>
              </div>
            ) : null}
            {p.google_maps_url && (
              <a
                href={p.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-700 font-medium transition-colors"
                title="Open in Google Maps"
              >
                <Navigation className="w-3 h-3" />
                Map
              </a>
            )}
          </div>
          <span className="text-xs text-primary-600 font-semibold flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
            View <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
