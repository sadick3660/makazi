/**
 * App header — branding, quick-action buttons.
 */
import { useState } from "react";
import PricePredictor from "./PricePredictor";

export default function Header() {
  const [showPredictor, setShowPredictor] = useState(false);

  return (
    <>
      <header className="flex items-center justify-between px-5 py-3 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/60 z-50">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-lg">
            🏘️
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-100 leading-none">
              Kinondoni Housing
            </h1>
            <p className="text-[10px] text-slate-500 leading-none mt-0.5">
              Dar es Salaam · Intelligence Platform
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800 rounded-full px-3 py-1.5 border border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Kinondoni Municipality
          </span>
          <button
            onClick={() => setShowPredictor(true)}
            className="text-xs font-semibold bg-accent-500 hover:bg-accent-400 text-white rounded-lg px-4 py-2 transition-colors"
          >
            Price Check
          </button>
        </div>
      </header>

      {showPredictor && (
        <PricePredictor onClose={() => setShowPredictor(false)} />
      )}
    </>
  );
}
