import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save, Home, MapPin, Zap, ArrowLeft } from "lucide-react";
import { propertiesApi } from "../../services/api";
import type { PropertyType, Municipality, Ward, WaterReliability, ElectricityConfig, PropertyStatus } from "../../types";
import toast from "react-hot-toast";

const MUNICIPALITIES: Municipality[] = ["Ilala","Kinondoni","Ubungo","Temeke","Kigamboni"];
const WARDS: Ward[] = ["Mikocheni","Mwananyamala","Kijitonyama","Mwenge","Mabatini","Makumbusho","Sinza","Tandale","Ubungo","Ilala","Temeke","Kigamboni"];
const TYPES: PropertyType[] = ["room","house","hostel","apartment"];
const STATUSES: PropertyStatus[] = ["available","rented","pending","suspended"];

export default function EditPropertyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", type: "room" as PropertyType,
    municipality: "Kinondoni" as Municipality, ward: "Mikocheni" as Ward,
    street_address: "", latitude: -6.774, longitude: 39.259,
    rooms: 1, bathrooms: 1, floor_area_sqm: 20, rent_amount: 150000, deposit_months: 1,
    water_reliability: "daily" as WaterReliability, electricity_config: "luku" as ElectricityConfig,
    is_furnished: false, has_wifi: false, has_parking: false,
    status: "available" as PropertyStatus,
  });

  useEffect(() => {
    if (!id) return;
    propertiesApi.getById(id)
      .then(p => {
        setForm({
          title: p.title, description: p.description ?? "",
          type: p.type, municipality: p.municipality, ward: p.ward,
          street_address: p.street_address ?? "", latitude: p.latitude, longitude: p.longitude,
          rooms: p.rooms, bathrooms: p.bathrooms, floor_area_sqm: p.floor_area_sqm ?? 20,
          rent_amount: p.rent_amount, deposit_months: p.deposit_months,
          water_reliability: p.water_reliability, electricity_config: p.electricity_config,
          is_furnished: p.is_furnished, has_wifi: p.has_wifi, has_parking: p.has_parking,
          status: p.status,
        });
      })
      .catch(() => toast.error("Property not found."))
      .finally(() => setLoading(false));
  }, [id]);

  const update = (key: string, val: string | number | boolean) =>
    setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await propertiesApi.update(id, form as never);
      toast.success("Listing updated successfully!");
      navigate("/landlord/dashboard");
    } catch {
      toast.error("Failed to update listing.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <div className="bg-hero-gradient text-white py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <button onClick={() => navigate("/landlord/dashboard")}
            className="flex items-center gap-2 text-white/70 hover:text-white text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Home className="w-6 h-6" /> Edit Listing
          </h1>
          <p className="text-white/70 text-sm mt-1">{form.title}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Basic Info */}
        <div className="card p-6 space-y-5">
          <h2 className="font-semibold text-surface-900 flex items-center gap-2">
            <Home className="w-5 h-5 text-primary-500" /> Basic Information
          </h2>
          <div>
            <label className="label">Title *</label>
            <input className="input" value={form.title} onChange={e => update("title", e.target.value)} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea rows={4} className="input resize-none" value={form.description}
              onChange={e => update("description", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Type</label>
              <select className="select" value={form.type} onChange={e => update("type", e.target.value)}>
                {TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="select" value={form.status} onChange={e => update("status", e.target.value)}>
                {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Monthly Rent (TZS)</label>
              <input type="number" className="input" value={form.rent_amount}
                onChange={e => update("rent_amount", +e.target.value)} min={10000} />
            </div>
            <div>
              <label className="label">Deposit (months)</label>
              <input type="number" className="input" value={form.deposit_months} min={1} max={6}
                onChange={e => update("deposit_months", +e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Rooms</label>
              <input type="number" className="input" value={form.rooms} min={1}
                onChange={e => update("rooms", +e.target.value)} />
            </div>
            <div>
              <label className="label">Bathrooms</label>
              <input type="number" className="input" value={form.bathrooms} min={1}
                onChange={e => update("bathrooms", +e.target.value)} />
            </div>
            <div>
              <label className="label">Floor Area (m²)</label>
              <input type="number" className="input" value={form.floor_area_sqm} min={5}
                onChange={e => update("floor_area_sqm", +e.target.value)} />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="card p-6 space-y-5">
          <h2 className="font-semibold text-surface-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary-500" /> Location
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Municipality</label>
              <select className="select" value={form.municipality} onChange={e => update("municipality", e.target.value)}>
                {MUNICIPALITIES.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Ward</label>
              <select className="select" value={form.ward} onChange={e => update("ward", e.target.value)}>
                {WARDS.map(w => <option key={w}>{w}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Street Address</label>
            <input className="input" value={form.street_address}
              onChange={e => update("street_address", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Latitude</label>
              <input type="number" step="0.0001" className="input" value={form.latitude}
                onChange={e => update("latitude", +e.target.value)} />
            </div>
            <div>
              <label className="label">Longitude</label>
              <input type="number" step="0.0001" className="input" value={form.longitude}
                onChange={e => update("longitude", +e.target.value)} />
            </div>
          </div>
        </div>

        {/* Utilities */}
        <div className="card p-6 space-y-5">
          <h2 className="font-semibold text-surface-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary-500" /> Utilities & Amenities
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Water Supply</label>
              <select className="select" value={form.water_reliability} onChange={e => update("water_reliability", e.target.value)}>
                <option value="none">None</option>
                <option value="intermittent">Intermittent</option>
                <option value="daily">Daily</option>
                <option value="continuous">24/7 Continuous</option>
              </select>
            </div>
            <div>
              <label className="label">Electricity</label>
              <select className="select" value={form.electricity_config} onChange={e => update("electricity_config", e.target.value)}>
                <option value="none">None</option>
                <option value="luku">LUKU Token</option>
                <option value="fixed">Fixed Bill</option>
                <option value="solar">Solar</option>
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            {[
              { key: "is_furnished", label: "🛋️ Furnished" },
              { key: "has_wifi", label: "📶 WiFi" },
              { key: "has_parking", label: "🚗 Parking" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer text-sm text-surface-700 select-none">
                <input type="checkbox" className="accent-primary-500 w-4 h-4"
                  checked={Boolean(form[key as keyof typeof form])}
                  onChange={e => update(key, e.target.checked)} />
                {label}
              </label>
            ))}
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-between">
          <button onClick={() => navigate("/landlord/dashboard")} className="btn-ghost">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-primary gap-2">
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
