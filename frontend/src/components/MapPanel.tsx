/**
 * MapPanel — right-side interactive Leaflet map.
 * Renders property pins, amenity markers, and distance rings.
 */
import { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { useAppStore } from "../store/appStore";
import type { MapPin } from "../types";

// ── Custom SVG icon factory ───────────────────────────────────────────────────

function makeSvgIcon(emoji: string, bg: string, size = 36): L.DivIcon {
  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${bg};
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 2px 8px rgba(0,0,0,0.45);
      border:2px solid rgba(255,255,255,0.25);
    "><span style="transform:rotate(45deg);font-size:${size * 0.45}px">${emoji}</span></div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

const ICONS: Record<string, L.DivIcon> = {
  property:     makeSvgIcon("🏠", "#0284c7"),
  flagged:      makeSvgIcon("⚠️", "#dc2626"),
  cafeteria:    makeSvgIcon("☕", "#92400e"),
  transit_node: makeSvgIcon("🚌", "#1d4ed8"),
  hospital:     makeSvgIcon("🏥", "#065f46"),
};

function getIcon(pin: MapPin): L.DivIcon {
  if (pin.type === "property") {
    return pin.isFlagged ? ICONS.flagged : ICONS.property;
  }
  return ICONS[pin.type] ?? ICONS.property;
}

// ── Map re-centre controller ──────────────────────────────────────────────────

function MapController() {
  const { mapCenter, mapZoom } = useAppStore();
  const map = useMap();

  useEffect(() => {
    map.flyTo(mapCenter, mapZoom, { duration: 1.2 });
  }, [map, mapCenter, mapZoom]);

  return null;
}

// ── Property popup content ────────────────────────────────────────────────────

function PropertyPopupContent({ pin }: { pin: MapPin }) {
  return (
    <div className="text-slate-800 text-xs min-w-[160px]">
      <p className="font-semibold text-sm text-slate-900 mb-1">{pin.label}</p>
      {pin.rent != null && (
        <p className="text-slate-700">
          <span className="font-medium">TZS </span>
          {pin.rent.toLocaleString()}
          <span className="text-slate-500"> / mo</span>
        </p>
      )}
      {pin.isFlagged && (
        <p className="mt-1 text-red-600 font-medium">
          ⚠️ Price may be inflated
        </p>
      )}
    </div>
  );
}

// ── Search origin ring ────────────────────────────────────────────────────────

function SearchRadius() {
  const { mapCenter, searchResults } = useAppStore();
  if (searchResults.length === 0) return null;
  return (
    <Circle
      center={mapCenter}
      radius={2000}
      pathOptions={{
        color: "#0ea5e9",
        fillColor: "#0ea5e9",
        fillOpacity: 0.04,
        weight: 1.5,
        dashArray: "6 4",
      }}
    />
  );
}

// ── Marker cluster ────────────────────────────────────────────────────────────

function Pins() {
  const { mapPins, setSelectedProperty } = useAppStore();

  return (
    <>
      {mapPins.map((pin) => (
        <Marker
          key={pin.id}
          position={[pin.lat, pin.lng]}
          icon={getIcon(pin)}
          eventHandlers={{
            click: () => {
              if (pin.type === "property") setSelectedProperty(pin.id);
            },
          }}
        >
          <Popup>
            {pin.type === "property" ? (
              <PropertyPopupContent pin={pin} />
            ) : (
              <div className="text-xs text-slate-800">
                <p className="font-semibold">{pin.label}</p>
                <p className="text-slate-500 capitalize">
                  {pin.type.replace("_", " ")}
                </p>
              </div>
            )}
          </Popup>
        </Marker>
      ))}
    </>
  );
}

// ── Main MapPanel ─────────────────────────────────────────────────────────────

export default function MapPanel() {
  const { mapCenter, isSearching, searchResults } = useAppStore();

  return (
    <div className="relative h-full w-full rounded-xl overflow-hidden border border-slate-700/50">
      {/* Loading overlay */}
      {isSearching && (
        <div className="absolute inset-0 z-[9999] bg-slate-950/60 flex flex-col items-center justify-center gap-2">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-300 text-sm font-medium">
            Searching Kinondoni…
          </p>
        </div>
      )}

      {/* Result count badge */}
      {searchResults.length > 0 && (
        <div className="absolute top-3 left-3 z-[999] bg-slate-900/90 text-slate-100 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-700 backdrop-blur-sm">
          {searchResults.length} listings found
        </div>
      )}

      <MapContainer
        center={mapCenter}
        zoom={14}
        className="h-full w-full"
        zoomControl={false}
        attributionControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController />
        <SearchRadius />
        <Pins />
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-[999] bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-xl p-3 text-xs text-slate-300 space-y-1.5">
        <p className="font-semibold text-slate-200 mb-1">Legend</p>
        {[
          { icon: "🏠", label: "Property" },
          { icon: "⚠️", label: "Inflated price" },
          { icon: "☕", label: "Cafeteria" },
          { icon: "🚌", label: "Transit node" },
          { icon: "🏥", label: "Hospital" },
        ].map(({ icon, label }) => (
          <div key={label} className="flex items-center gap-2">
            <span>{icon}</span>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
