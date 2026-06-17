/**
 * PricePredictor — modal panel for the hedonic price estimation engine.
 */
import { useState } from "react";
import { predictPrice } from "../services/api";
import { useAppStore } from "../store/appStore";
import type { PricePredictionRequest, WardName, WaterReliability, ElectricityConfig } from "../types";

const WARDS: WardName[] = [
  "Mikocheni", "Mwananyamala", "Kijitonyama",
  "Mwenge", "Mabatini", "Makumbusho", "Sinza",
];

const DEFAULT_FORM: PricePredictionRequest = {
  ward: "Mwenge",
  structural_rooms: 1,
  water_reliability: "daily",
  electricity_config: "luku",
  distance_to_transit_m: 400,
  floor_area_sqm: 25,
  is_furnished: false,
  has_wifi: false,
};

interface Props {
  onClose: () => void;
}

export default function PricePredictor({ onClose }: Props) {
  const { predictionResult, setPredictionResult } = useAppStore();
  const [form, setForm] = useState<PricePredictionRequest>(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof PricePredictionRequest>(
    key: K,
    value: PricePredictionRequest[K]
  ) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await predictPrice(form);
      setPredictionResult(result);
    } catch {
      setError("Prediction failed. Please check your API connection.");
    } finally {
      setLoading(false);
    }
  };

  // Resolve display values from either backend or convenience alias fields
  const fairValue = predictionResult?.estimated_fair_market_value ?? predictionResult?.estimated_fair_value ?? 0;
  const minBound = predictionResult?.calculated_variance_range?.minimum_fair_boundary ?? predictionResult?.min_range ?? 0;
  const maxBound = predictionResult?.calculated_variance_range?.maximum_fair_boundary ?? predictionResult?.max_range ?? 0;
  const confidence = predictionResult?.confidence_score_metric ?? predictionResult?.confidence ?? 0;
  const overpriced = predictionResult?.is_overpriced ?? false;
  const overpricedPct = predictionResult?.overpriced_by_percent ?? predictionResult?.overpriced_by_pct ?? 0;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-slate-950/80 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Price Prediction Tool"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              Fair Price Estimator
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Detects dalali price inflation · Powered by XGBoost
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 grid grid-cols-2 gap-4">
          <FormField label="Ward">
            <select
              value={form.ward}
              onChange={(e) => update("ward", e.target.value as WardName)}
              className="form-select"
            >
              {WARDS.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Rooms">
            <input
              type="number"
              min={1} max={10}
              value={form.structural_rooms}
              onChange={(e) => update("structural_rooms", +e.target.value)}
              className="form-input"
            />
          </FormField>

          <FormField label="Water Supply">
            <select
              value={form.water_reliability}
              onChange={(e) => update("water_reliability", e.target.value as WaterReliability)}
              className="form-select"
            >
              <option value="none">None</option>
              <option value="intermittent">Intermittent</option>
              <option value="daily">Daily</option>
              <option value="continuous">Continuous 24/7</option>
            </select>
          </FormField>

          <FormField label="Electricity">
            <select
              value={form.electricity_config}
              onChange={(e) => update("electricity_config", e.target.value as ElectricityConfig)}
              className="form-select"
            >
              <option value="none">None</option>
              <option value="luku">LUKU Token</option>
              <option value="fixed">Fixed Bill</option>
              <option value="solar">Solar</option>
            </select>
          </FormField>

          <FormField label="Distance to Transit (m)">
            <input
              type="number"
              min={0}
              value={form.distance_to_transit_m}
              onChange={(e) => update("distance_to_transit_m", +e.target.value)}
              className="form-input"
            />
          </FormField>

          <FormField label="Floor Area (m²)">
            <input
              type="number"
              min={5}
              value={form.floor_area_sqm}
              onChange={(e) => update("floor_area_sqm", +e.target.value)}
              className="form-input"
            />
          </FormField>

          <div className="col-span-2 flex gap-6">
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.is_furnished}
                onChange={(e) => update("is_furnished", e.target.checked)}
                className="accent-brand-500 w-4 h-4"
              />
              Furnished
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.has_wifi}
                onChange={(e) => update("has_wifi", e.target.checked)}
                className="accent-brand-500 w-4 h-4"
              />
              WiFi included
            </label>
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="mx-6 mb-2 text-sm text-red-400 bg-red-900/30 border border-red-700/40 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* Result */}
        {predictionResult && !loading && (
          <div className="mx-6 mb-4 bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">
                Fair Market Value
              </p>
              <span className="text-xs bg-emerald-900/50 text-emerald-300 border border-emerald-700/40 rounded px-2 py-0.5">
                {(confidence * 100).toFixed(0)}% confidence
              </span>
            </div>
            <p className="text-2xl font-bold text-emerald-400">
              TZS {fairValue.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Range: TZS {minBound.toLocaleString()} – {maxBound.toLocaleString()}
            </p>
            {overpriced && (
              <p className="mt-2 text-sm text-red-400 font-semibold">
                ⚠️ Listed price is {overpricedPct.toFixed(1)}% above fair value
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl py-2.5 transition-colors"
          >
            {loading ? "Calculating…" : "Get Fair Price Estimate"}
          </button>
          <button
            onClick={() => { setPredictionResult(null); onClose(); }}
            className="px-4 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1 font-medium">{label}</label>
      {children}
    </div>
  );
}
