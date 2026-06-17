import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin, Bed, Bath, Wifi, Zap, Droplets, Car, Star, Phone, Heart, Share2, ChevronLeft, AlertTriangle, CheckCircle, Coffee, Bus, Hospital } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import { propertiesApi } from "../services/api";
import type { Property, Review } from "../types";

const AMENITY_ICONS: Record<string, { icon: typeof Coffee; color: string }> = {
  cafeteria:    { icon: Coffee,   color: "text-amber-600 bg-amber-50" },
  transit_node: { icon: Bus,      color: "text-blue-600 bg-blue-50" },
  hospital:     { icon: Hospital, color: "text-emerald-600 bg-emerald-50" },
};

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([propertiesApi.getById(id), propertiesApi.getReviews(id)])
      .then(([p, r]) => { setProperty(p); setReviews(r); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!property) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-lg font-semibold text-surface-700">Property not found</p>
      <button onClick={() => navigate("/search")} className="btn-primary">Back to Search</button>
    </div>
  );

  const p = property;
  const markerIcon = L.divIcon({
    html: `<div style="width:36px;height:36px;background:#1B3A6B;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,0.3);border:2px solid #fff"><span style="transform:rotate(45deg);font-size:16px">🏠</span></div>`,
    className: "", iconSize: [36, 36], iconAnchor: [18, 36], popupAnchor: [0, -36],
  });

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-surface-200 py-3">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-2 text-sm text-surface-500">
          <button onClick={() => navigate("/search")} className="flex items-center gap-1 hover:text-primary-600 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to Search
          </button>
          <span>/</span>
          <span className="text-surface-800 font-medium truncate">{p.title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Left: Images + Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Images */}
            <div className="card overflow-hidden">
              <div className="relative h-80 sm:h-96">
                <img src={p.images[activeImg]?.url ?? "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200"}
                  alt={p.title} className="w-full h-full object-cover" />
                {p.is_price_flagged && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-maroon-500 text-white text-xs font-semibold rounded-full px-3 py-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Price Flagged
                  </div>
                )}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <button onClick={() => setIsFav(!isFav)}
                    className="w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow hover:scale-110 transition-transform"
                  >
                    <Heart className={isFav ? "w-4 h-4 fill-maroon-500 text-maroon-500" : "w-4 h-4 text-surface-400"} />
                  </button>
                  <button className="w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow">
                    <Share2 className="w-4 h-4 text-surface-400" />
                  </button>
                </div>
              </div>
              {p.images.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto">
                  {p.images.map((img, i) => (
                    <button key={img.id} onClick={() => setActiveImg(i)}
                      className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-colors ${i === activeImg ? "border-primary-500" : "border-transparent"}`}
                    >
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title + meta */}
            <div className="card p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="badge-blue capitalize">{p.type}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.status === "available" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      {p.status === "available" ? "✓ Available" : p.status}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-surface-900">{p.title}</h1>
                  <div className="flex items-center gap-1.5 text-surface-500 text-sm mt-1.5">
                    <MapPin className="w-4 h-4 text-maroon-400 flex-shrink-0" />
                    {p.street_address && `${p.street_address}, `}{p.ward}, {p.municipality}
                  </div>
                </div>
                {p.average_rating && (
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="w-5 h-5 fill-current" />
                      <span className="text-lg font-bold text-surface-900">{p.average_rating}</span>
                    </div>
                    <span className="text-xs text-surface-400">{p.review_count} reviews</span>
                  </div>
                )}
              </div>

              {/* Price */}
              <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 mb-5">
                <div className="flex items-end gap-3 flex-wrap">
                  <div>
                    <p className="text-xs text-surface-500 mb-0.5">Monthly Rent</p>
                    {p.type === "hostel" && p.price_range_max ? (
                      <p className="text-3xl font-bold text-primary-600">
                        TZS {p.rent_amount.toLocaleString()}
                        <span className="text-lg text-surface-500"> – {p.price_range_max.toLocaleString()}</span>
                      </p>
                    ) : (
                      <p className="text-3xl font-bold text-primary-600">
                        TZS {p.rent_amount.toLocaleString()}
                      </p>
                    )}
                  </div>
                  {p.is_price_flagged && p.fair_price_estimate && (
                    <div className="flex items-center gap-2 bg-maroon-50 border border-maroon-200 rounded-lg px-3 py-2">
                      <AlertTriangle className="w-4 h-4 text-maroon-500" />
                      <div>
                        <p className="text-xs text-maroon-600 font-semibold">Price may be inflated</p>
                        <p className="text-xs text-maroon-500">Fair value: TZS {p.fair_price_estimate.toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-surface-500 mt-2">{p.deposit_months} month deposit required</p>
              </div>

              {/* Specs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {[
                  { icon: Bed,      label: `${p.rooms} Room${p.rooms > 1 ? "s" : ""}` },
                  { icon: Bath,     label: `${p.bathrooms} Bathroom${p.bathrooms > 1 ? "s" : ""}` },
                  { icon: Droplets, label: p.water_reliability.replace("_", " ") + " water" },
                  { icon: Zap,      label: p.electricity_config.toUpperCase() },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 text-sm text-surface-700 bg-surface-50 rounded-lg p-3">
                    <Icon className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span className="capitalize">{label}</span>
                  </div>
                ))}
              </div>

              {/* Hostel-specific badges */}
              {p.type === "hostel" && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {p.gender_policy && (
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${
                      p.gender_policy === "girls" ? "bg-pink-50 text-pink-700 border-pink-200" :
                      p.gender_policy === "boys"  ? "bg-blue-50 text-blue-700 border-blue-200" :
                      "bg-purple-50 text-purple-700 border-purple-200"
                    }`}>
                      {p.gender_policy === "girls" ? "👩" : p.gender_policy === "boys" ? "👨" : "👥"}
                      {p.gender_policy === "girls" ? "Girls Only" : p.gender_policy === "boys" ? "Boys Only" : "Girls & Boys"}
                    </span>
                  )}
                  {p.capacity && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-surface-100 text-surface-700 border border-surface-200">
                      🏠 Capacity: {p.capacity} beds
                    </span>
                  )}
                  {p.distance_to_udsm_km && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      📍 {p.distance_to_udsm_km < 1
                          ? `${(p.distance_to_udsm_km * 1000).toFixed(0)}m from campus`
                          : `${p.distance_to_udsm_km}km from campus`}
                    </span>
                  )}
                  {p.price_range_max && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      💰 Up to TZS {p.price_range_max.toLocaleString()}
                    </span>
                  )}
                </div>
              )}

              {/* Features */}
              <div className="flex flex-wrap gap-2 mb-5">
                {p.is_furnished && <span className="badge-blue">🛋️ Furnished</span>}
                {p.has_wifi && <span className="badge-green"><Wifi className="w-3 h-3" />WiFi</span>}
                {p.has_parking && <span className="badge-blue"><Car className="w-3 h-3" />Parking</span>}
              </div>

              {/* Description */}
              {p.description && (
                <div>
                  <h3 className="font-semibold text-surface-900 mb-2">Description</h3>
                  <p className="text-sm text-surface-600 leading-relaxed">{p.description}</p>
                </div>
              )}
            </div>

            {/* Amenities */}
            {p.amenities.length > 0 && (
              <div className="card p-6">
                <h3 className="font-semibold text-surface-900 mb-4">Nearby Amenities</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {p.amenities.map(a => {
                    const meta = AMENITY_ICONS[a.category] ?? AMENITY_ICONS.cafeteria;
                    return (
                      <div key={a.id} className={`flex items-center gap-3 rounded-xl p-3 ${meta.color.split(" ")[1]}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${meta.color}`}>
                          <meta.icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-surface-800">{a.name}</p>
                          {a.distance_m && <p className="text-xs text-surface-500">{a.distance_m < 1000 ? `${a.distance_m}m` : `${(a.distance_m / 1000).toFixed(1)}km`} away</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Map */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-surface-900">Location</h3>
                {p.google_maps_url ? (
                  <a
                    href={p.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 border border-primary-200 hover:border-primary-400 bg-primary-50 hover:bg-primary-100 rounded-lg px-3 py-1.5 transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 flex-shrink-0">
                      <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.079 3.43-4.797 3.43-8.333 0-4.62-3.735-8.36-8.36-8.36-4.626 0-8.36 3.74-8.36 8.36 0 3.536 1.487 6.254 3.43 8.333a19.58 19.58 0 002.683 2.282c.373.248.744.474 1.144.742zM12 13.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
                    </svg>
                    Open in Google Maps
                  </a>
                ) : null}
              </div>
              <div className="h-64 rounded-xl overflow-hidden">
                <MapContainer center={[p.latitude, p.longitude]} zoom={15} className="h-full" zoomControl={false}>
                  <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[p.latitude, p.longitude]} icon={markerIcon}>
                    <Popup>
                      <b>{p.title}</b><br />TZS {p.rent_amount.toLocaleString()}/mo
                      {p.google_maps_url && (
                        <><br /><a href={p.google_maps_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-xs">Open in Google Maps</a></>
                      )}
                    </Popup>
                  </Marker>
                  <Circle center={[p.latitude, p.longitude]} radius={500} pathOptions={{ color: "#1B3A6B", fillOpacity: 0.05 }} />
                  {p.amenities.map(a => (
                    <Marker key={a.id} position={[a.latitude, a.longitude]}
                      icon={L.divIcon({ html: `<div style="font-size:20px">${a.category === "cafeteria" ? "☕" : a.category === "hospital" ? "🏥" : "🚌"}</div>`, className: "", iconSize: [24, 24] })}>
                      <Popup>{a.name}</Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
              {/* Google Maps fallback link shown below map on mobile */}
              {p.google_maps_url && (
                <a
                  href={p.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex items-center justify-center gap-2 text-sm text-surface-500 hover:text-primary-600 transition-colors"
                >
                  <MapPin className="w-4 h-4" />
                  View exact location on Google Maps →
                </a>
              )}
            </div>

            {/* Reviews */}
            {reviews.length > 0 && (
              <div className="card p-6">
                <h3 className="font-semibold text-surface-900 mb-4">Reviews ({reviews.length})</h3>
                <div className="space-y-4">
                  {reviews.map(r => (
                    <div key={r.id} className="border-b border-surface-100 last:border-0 pb-4 last:pb-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-600">
                            {r.user_name[0]}
                          </div>
                          <span className="font-medium text-sm text-surface-900">{r.user_name}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                        </div>
                      </div>
                      <p className="text-sm text-surface-600">{r.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Booking card */}
          <div className="space-y-4">
            <div className="card p-6 sticky top-24">
              <h3 className="font-semibold text-surface-900 mb-1">Contact Landlord</h3>
              <p className="text-xs text-surface-500 mb-5">Verified property owner</p>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-primary-100 flex items-center justify-center text-xl font-bold text-primary-600">
                  {p.landlord_name?.[0] ?? "L"}
                </div>
                <div>
                  <p className="font-semibold text-surface-900 text-sm">{p.landlord_name}</p>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-xs text-emerald-600">Verified Landlord</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <a href={`tel:${p.landlord_phone}`}
                  className="btn-primary w-full justify-center gap-2"
                >
                  <Phone className="w-4 h-4" /> Call Landlord
                </a>
                <button className="btn-maroon w-full justify-center">
                  Book via M-Pesa
                </button>
                <button className="btn-outline w-full justify-center text-sm">
                  Send Message
                </button>
                {p.google_maps_url && (
                  <a
                    href={p.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full border border-surface-200 hover:border-primary-300 hover:bg-primary-50 text-surface-600 hover:text-primary-600 text-sm font-medium rounded-xl py-2.5 transition-all"
                  >
                    <MapPin className="w-4 h-4" />
                    Get Directions
                  </a>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-surface-100 space-y-2.5">
                {[
                  { icon: CheckCircle, text: "Verified listing" },
                  { icon: CheckCircle, text: "No broker fees" },
                  { icon: CheckCircle, text: "Secure M-Pesa payment" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-xs text-surface-600">
                    <Icon className="w-3.5 h-3.5 text-emerald-500" />{text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
