import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Shield, TrendingUp, MessageSquare, Star, ArrowRight, CheckCircle, Zap, Users, Building2 } from "lucide-react";
import { useLang } from "../../contexts/LanguageContext";
import PropertyCard from "../../components/ui/PropertyCard";
import { propertiesApi } from "../../services/api";
import { useEffect } from "react";
import type { Property } from "../../types";

const MUNICIPALITIES = ["Ilala", "Kinondoni", "Ubungo", "Temeke", "Kigamboni"];

export default function HomePage() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [searchQ, setSearchQ] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [featured, setFeatured] = useState<Property[]>([]);

  useEffect(() => {
    propertiesApi.getFeatured().then(setFeatured);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQ) params.set("q", searchQ);
    if (municipality) params.set("municipality", municipality);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative bg-hero-gradient text-white overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-maroon-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-primary-300/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-1.5 text-sm text-white/90 mb-6">
              <Zap className="w-4 h-4 text-amber-300" />
              <span>AI-Powered · Fair Prices · Zero Brokers</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              {t("hero.title")}
            </h1>
            <p className="text-lg sm:text-xl text-white/80 mb-10 leading-relaxed max-w-xl">
              {t("hero.subtitle")}
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="bg-white rounded-2xl p-2 flex flex-col sm:flex-row gap-2 shadow-2xl max-w-2xl">
              <div className="flex-1 flex items-center gap-2 px-3">
                <Search className="w-5 h-5 text-surface-400 flex-shrink-0" />
                <input
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                  placeholder={t("search.placeholder")}
                  className="flex-1 text-surface-900 text-sm outline-none placeholder-surface-400 bg-transparent"
                />
              </div>
              <select value={municipality} onChange={e => setMunicipality(e.target.value)}
                className="border-t sm:border-t-0 sm:border-l border-surface-200 text-surface-700 text-sm px-3 py-2 bg-transparent outline-none cursor-pointer"
              >
                <option value="">{t("search.all")} Municipalities</option>
                {MUNICIPALITIES.map(m => <option key={m}>{m}</option>)}
              </select>
              <button type="submit" className="btn-maroon rounded-xl px-6">
                {t("hero.cta")}
              </button>
            </form>

            {/* Quick links */}
            <div className="flex flex-wrap gap-2 mt-5">
              {["Mikocheni", "Sinza", "Mwenge", "Kijitonyama"].map(w => (
                <button key={w} onClick={() => navigate(`/search?ward=${w}`)}
                  className="text-xs text-white/70 hover:text-white border border-white/20 hover:border-white/40 rounded-full px-3 py-1 transition-colors"
                >
                  📍 {w}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-14 max-w-lg">
            {[
              { label: t("hero.stats.listings"), value: "287+" },
              { label: t("hero.stats.wards"), value: "12" },
              { label: t("hero.stats.users"), value: "1.2k" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-white/60 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="section bg-white">
        <div className="container-xl text-center">
          <h2 className="section-title">Why NyumbaLink?</h2>
          <p className="section-subtitle mx-auto">Everything you need to find a fair, verified home in Dar es Salaam.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
            {[
              { icon: MessageSquare, color: "bg-primary-100 text-primary-600", title: "AI Chatbot", desc: "Chat in Swahili or English to find accommodation instantly." },
              { icon: Shield, color: "bg-maroon-100 text-maroon-600", title: "Anti-Fraud", desc: "ML-powered price detection flags inflated dalali listings." },
              { icon: MapPin, color: "bg-emerald-100 text-emerald-600", title: "Location Intelligence", desc: "Find nearby cafeterias, transport, hospitals for every listing." },
              { icon: TrendingUp, color: "bg-amber-100 text-amber-600", title: "Fair Price AI", desc: "Random Forest model predicts fair rental values in real-time." },
            ].map(f => (
              <div key={f.title} className="card p-6 text-center hover:scale-105 transition-transform">
                <div className={`w-12 h-12 ${f.color} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-surface-900 mb-2">{f.title}</h3>
                <p className="text-sm text-surface-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Listings ─────────────────────────────────────────────── */}
      <section className="section bg-surface-50">
        <div className="container-xl">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-surface-900">Featured Listings</h2>
              <p className="text-surface-500 text-sm mt-1">Verified properties across Dar es Salaam</p>
            </div>
            <button onClick={() => navigate("/search")}
              className="btn-outline text-sm hidden sm:flex"
            >
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map(p => <PropertyCard key={p.id} property={p} />)}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="section bg-white">
        <div className="container-xl">
          <div className="text-center mb-12">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle mx-auto">Find your home in 3 simple steps</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "01", icon: MessageSquare, title: "Chat with AI", desc: "Tell our AI what you need in English or Swahili — location, budget, type." },
              { step: "02", icon: Building2, title: "Browse Listings", desc: "Get matched listings on an interactive map with full details and fair-price analysis." },
              { step: "03", icon: CheckCircle, title: "Book Securely", desc: "Pay via M-Pesa, get a receipt, and move in. No broker middlemen." },
            ].map(s => (
              <div key={s.step} className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-primary-500 flex items-center justify-center shadow-lg">
                    <s.icon className="w-8 h-8 text-white" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-maroon-500 text-white text-xs font-bold flex items-center justify-center">
                    {s.step}
                  </span>
                </div>
                <h3 className="font-semibold text-surface-900 text-lg mb-2">{s.title}</h3>
                <p className="text-surface-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section className="section bg-primary-950 text-white">
        <div className="container-xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">What Our Users Say</h2>
            <p className="text-surface-400">Trusted by thousands across Dar es Salaam</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Grace M.", ward: "Mikocheni", rating: 5, text: "Nilipata chumba kizuri Mikocheni kwa bei halisi. AI ilinikuambia bei ya soko kabla ya kukodisha!" },
              { name: "Joseph K.", ward: "Sinza", rating: 5, text: "Found my apartment in 10 minutes. The price flagging feature saved me from an overpriced listing." },
              { name: "Amina H.", ward: "Mwenge", rating: 5, text: "Best platform in DSM. The map shows hospitals, daladala stops, everything near the property!" },
            ].map(r => (
              <div key={r.name} className="bg-primary-900/60 border border-primary-800 rounded-2xl p-6">
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-surface-300 text-sm leading-relaxed mb-4">"{r.text}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center text-sm font-bold">{r.name[0]}</div>
                  <div>
                    <p className="text-sm font-semibold text-white">{r.name}</p>
                    <p className="text-xs text-surface-500">{r.ward}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────────────── */}
      <section className="section bg-maroon-500 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-3xl font-bold mb-4">Ready to Find Your Home?</h2>
          <p className="text-white/80 mb-8 text-lg">Join over 1,200 satisfied renters across Dar es Salaam.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => navigate("/register")} className="btn-primary bg-white text-maroon-600 hover:bg-white/90">
              Get Started Free
            </button>
            <button onClick={() => navigate("/chat")} className="btn-outline border-white text-white hover:bg-white/10">
              <MessageSquare className="w-4 h-4" /> Chat with AI
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
