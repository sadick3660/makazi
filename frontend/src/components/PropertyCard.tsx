/**
 * PropertyCard — compact listing card shown in the results sidebar.
 */
import clsx from "clsx";
import type { PropertySearchResult } from "../types";
import { useAppStore } from "../store/appStore";

interface Props {
  property: PropertySearchResult;
}

const WATER_LABELS: Record<string, string> = {
  none: "No water",
  intermittent: "Intermittent",
  daily: "Daily supply",
  continuous: "24/7 water",
};

const ELECTRICITY_LABELS: Record<string, string> = {
  none: "No power",
  luku: "LUKU token",
  fixed: "Fixed bill",
  solar: "Solar",
};

export default function PropertyCard({ property: p }: Props) {
  const { selectedPropertyId, setSelectedProperty, setMapCenter } =
    useAppStore();
  const isSelected = selectedPropertyId === p.property_id;

  const handleClick = () => {
    setSelectedProperty(p.property_id);
    setMapCenter([p.latitude, p.longitude], 17);
  };

  return (
    <button
      onClick={handleClick}
      aria-pressed={isSelected}
      className={clsx(
        "w-full text-left rounded-xl border p-4 transition-all",
        isSelected
          ? "bg-brand-700/20 border-brand-500"
          : "bg-slate-800/60 border-slate-700 hover:bg-slate-800 hover:border-slate-600"
      )}
    >
      {/* Title + flag */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold text-slate-100 leading-tight">
          {p.title}
        </h3>
        {p.is_price_flagged && (
          <span className="flex-shrink-0 text-xs bg-red-900/60 text-red-300 border border-red-700/50 rounded px-1.5 py-0.5">
            ⚠️ Inflated
          </span>
        )}
      </div>

      {/* Rent */}
      <p className="text-lg font-bold text-brand-400 mb-2">
        TZS {p.base_rent_amount.toLocaleString()}
        <span className="text-xs text-slate-500 font-normal"> / month</span>
      </p>

      {p.is_price_flagged && p.flagged_fair_value != null && (
        <p className="text-xs text-emerald-400 mb-2">
          Fair value: TZS {p.flagged_fair_value.toLocaleString()}
        </p>
      )}

      {/* Meta chips */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        <Chip icon="📍" label={p.ward} />
        <Chip icon="🛏️" label={`${p.structural_rooms} room${p.structural_rooms !== 1 ? "s" : ""}`} />
        <Chip icon="💧" label={WATER_LABELS[p.water_reliability ?? "none"] ?? (p.water_reliability ?? "Unknown")} />
        <Chip icon="⚡" label={ELECTRICITY_LABELS[p.electricity_config ?? "none"] ?? (p.electricity_config ?? "Unknown")} />
        {p.is_furnished && <Chip icon="🛋️" label="Furnished" />}
        {p.has_wifi && <Chip icon="📶" label="WiFi" />}
      </div>

      {/* Distance */}
      <p className="text-xs text-slate-500">
        {p.distance_metres < 1000
          ? `${Math.round(p.distance_metres)} m away`
          : `${(p.distance_metres / 1000).toFixed(1)} km away`}
      </p>

      {/* Amenities */}
      {p.amenities.length > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-700/50">
          <p className="text-[10px] text-slate-500 mb-1">Nearby</p>
          <div className="flex flex-wrap gap-1">
            {p.amenities.slice(0, 3).map((a) => (
              <span
                key={a.amenity_id}
                className="text-[10px] text-slate-400 bg-slate-700/60 rounded px-1.5 py-0.5"
              >
                {a.category === "cafeteria" ? "☕" : a.category === "hospital" ? "🏥" : "🚌"}
                {" "}
                {a.name.length > 20 ? a.name.slice(0, 18) + "…" : a.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </button>
  );
}

function Chip({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-700/50 rounded-md px-1.5 py-0.5">
      {icon} {label}
    </span>
  );
}
