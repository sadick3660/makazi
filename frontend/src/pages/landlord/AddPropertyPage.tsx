import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Home, MapPin, Zap, Check, X } from "lucide-react";
import { propertiesApi } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import type { PropertyImage, PropertyType, Municipality, Ward, WaterReliability, ElectricityConfig } from "../../types";
import toast from "react-hot-toast";

const MUNICIPALITIES: Municipality[] = ["Ilala","Kinondoni","Ubungo","Temeke","Kigamboni"];
const WARDS: Ward[] = ["Mikocheni","Mwananyamala","Kijitonyama","Mwenge","Mabatini","Makumbusho","Sinza","Tandale","Ubungo","Ilala","Temeke","Kigamboni"];
const TYPES: PropertyType[] = ["room","house","hostel","apartment"];

const STEPS = ["Basic Info", "Location", "Amenities", "Photos"];

export default function AddPropertyPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<PropertyImage[]>([]);
  const [form, setForm] = useState({
    title: "", description: "", type: "room" as PropertyType,
    municipality: "Kinondoni" as Municipality, ward: "Mikocheni" as Ward,
    street_address: "", latitude: -6.774, longitude: 39.259,
    rooms: 1, bathrooms: 1, floor_area_sqm: 20, rent_amount: 150000, deposit_months: 1,
    water_reliability: "daily" as WaterReliability, electricity_config: "luku" as ElectricityConfig,
    is_furnished: false, has_wifi: false, has_parking: false,
  });

  const update = (key: string, val: string | number | boolean) => setForm(f => ({ ...f, [key]: val }));

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const maxBytes = 5 * 1024 * 1024;
    const oversized = files.filter(file => file.size > maxBytes);
    if (oversized.length) {
      toast.error("Each photo must be 5MB or smaller.");
      return;
    }

    try {
      const uploads = await Promise.all(files.map(file => new Promise<PropertyImage>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({
          id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          url: String(reader.result),
          is_primary: false,
        });
        reader.onerror = () => reject(new Error("Failed to read image"));
        reader.readAsDataURL(file);
      })));

      setPhotos(prev => [...prev, ...uploads].slice(0, 6));
      toast.success(`${uploads.length} photo${uploads.length > 1 ? "s" : ""} added.`);
    } catch {
      toast.error("Could not upload photos right now.");
    } finally {
      e.target.value = "";
    }
  };

  const removePhoto = (id: string) => {
    setPhotos(prev => prev.filter(photo => photo.id !== id));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await propertiesApi.create({
        ...form,
        images: photos.length ? photos : [{ id: "fallback", url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800", is_primary: true }],
        amenities: [],
        status: "pending",
        review_count: 0,
        is_price_flagged: false,
        landlord_id: user?.id ?? "me",
        landlord_name: user?.full_name ?? "Landlord",
        landlord_phone: user?.phone ?? "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      toast.success("Listing created successfully!");
      navigate("/landlord/dashboard");
    } catch { toast.error("Failed to create listing."); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="bg-hero-gradient text-white py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-5 flex items-center gap-2"><Home className="w-6 h-6" /> Add New Property</h1>
          {/* Stepper */}
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <button onClick={() => i < step && setStep(i)}
                  className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${i === step ? "text-white" : i < step ? "text-primary-200 hover:text-white" : "text-primary-400"}`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${i < step ? "bg-emerald-500 border-emerald-500 text-white" : i === step ? "bg-white border-white text-primary-700" : "border-white/30 text-white/50"}`}>
                    {i < step ? <Check className="w-3 h-3" /> : i + 1}
                  </span>
                  <span className="hidden sm:block">{s}</span>
                </button>
                {i < STEPS.length - 1 && <div className={`flex-1 h-px w-8 ${i < step ? "bg-emerald-400" : "bg-white/20"}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="card p-8">
          {step === 0 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="font-semibold text-lg text-surface-900 flex items-center gap-2"><Home className="w-5 h-5 text-primary-500" />Basic Information</h2>
              <div>
                <label className="label">Title *</label>
                <input className="input" placeholder="e.g. Spacious Room in Mikocheni B" value={form.title}
                  onChange={e => update("title", e.target.value)} required />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea rows={4} className="input resize-none" placeholder="Describe the property…" value={form.description}
                  onChange={e => update("description", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Property Type</label>
                  <select className="select" value={form.type} onChange={e => update("type", e.target.value)}>
                    {TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Monthly Rent (TZS) *</label>
                  <input type="number" className="input" value={form.rent_amount}
                    onChange={e => update("rent_amount", +e.target.value)} min={10000} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">Rooms</label>
                  <input type="number" className="input" value={form.rooms} min={1} max={20}
                    onChange={e => update("rooms", +e.target.value)} />
                </div>
                <div>
                  <label className="label">Bathrooms</label>
                  <input type="number" className="input" value={form.bathrooms} min={1} max={10}
                    onChange={e => update("bathrooms", +e.target.value)} />
                </div>
                <div>
                  <label className="label">Deposit (months)</label>
                  <input type="number" className="input" value={form.deposit_months} min={1} max={6}
                    onChange={e => update("deposit_months", +e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="font-semibold text-lg text-surface-900 flex items-center gap-2"><MapPin className="w-5 h-5 text-primary-500" />Location</h2>
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
                <input className="input" placeholder="e.g. Mikocheni B, off New Bagamoyo Road" value={form.street_address}
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
          )}

          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="font-semibold text-lg text-surface-900 flex items-center gap-2"><Zap className="w-5 h-5 text-primary-500" />Amenities & Utilities</h2>
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
                  { key: "has_wifi",     label: "📶 WiFi" },
                  { key: "has_parking",  label: "🚗 Parking" },
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
          )}

          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="font-semibold text-lg text-surface-900 flex items-center gap-2"><Upload className="w-5 h-5 text-primary-500" />Photos</h2>
              <label className="block border-2 border-dashed border-surface-300 rounded-2xl p-12 text-center hover:border-primary-400 transition-colors cursor-pointer">
                <Upload className="w-10 h-10 text-surface-400 mx-auto mb-3" />
                <p className="font-medium text-surface-700 mb-1">Upload property photos</p>
                <p className="text-sm text-surface-400">PNG, JPG up to 5MB each. First image will be the main photo.</p>
                <input type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
              {photos.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {photos.map((photo, index) => (
                    <div key={photo.id} className="relative rounded-xl overflow-hidden border border-surface-200 bg-surface-100">
                      <img src={photo.url} alt={`Property ${index + 1}`} className="h-24 w-full object-cover" />
                      <button type="button" onClick={() => removePhoto(photo.id)} className="absolute top-2 right-2 rounded-full bg-surface-900/80 text-white p-1 hover:bg-maroon-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                      {index === 0 && <span className="absolute left-2 top-2 rounded-full bg-primary-600 text-white text-[10px] font-semibold px-2 py-1">Main</span>}
                    </div>
                  ))}
                </div>
              )}
              <div className="bg-primary-50 border border-primary-100 rounded-xl p-4">
                <p className="text-sm text-primary-700 font-semibold mb-1">📸 Photo tips for more inquiries:</p>
                <ul className="text-xs text-primary-600 space-y-1">
                  <li>• Take photos in good natural light</li>
                  <li>• Include all rooms, kitchen, and bathroom</li>
                  <li>• Show the compound/exterior</li>
                </ul>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-surface-200">
            <button disabled={step === 0} onClick={() => setStep(s => s - 1)}
              className="btn-ghost disabled:opacity-30"
            >
              ← Previous
            </button>
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)} className="btn-primary">
                Continue →
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading} className="btn-maroon">
                {loading ? "Publishing…" : "Publish Listing"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
