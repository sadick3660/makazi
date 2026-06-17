import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, UserPlus, Home, Building2, Search, ShieldCheck } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useLang } from "../../contexts/LanguageContext";
import type { UserRole } from "../../types";
import toast from "react-hot-toast";
import clsx from "clsx";

const ROLE_CONFIG = [
  {
    role: "seeker" as UserRole,
    icon: Search,
    label: "Seeker",
    desc: "I'm looking for accommodation",
    border: "border-primary-500",
    bg: "bg-primary-50",
    text: "text-primary-700",
    iconBg: "bg-primary-100",
  },
  {
    role: "landlord" as UserRole,
    icon: Building2,
    label: "Landlord",
    desc: "I have property to list",
    border: "border-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    iconBg: "bg-emerald-100",
  },
  {
    role: "admin" as UserRole,
    icon: ShieldCheck,
    label: "Admin",
    desc: "System administration",
    border: "border-maroon-500",
    bg: "bg-maroon-50",
    text: "text-maroon-700",
    iconBg: "bg-maroon-100",
  },
];

const ROLE_REDIRECT: Record<UserRole, string> = {
  seeker:   "/seeker/dashboard",
  landlord: "/landlord/dashboard",
  admin:    "/admin/dashboard",
};

const BENEFITS: Record<UserRole, string[]> = {
  seeker:   ["AI-powered housing search", "Fair price estimates", "No broker fees", "Save favourites"],
  landlord: ["Publish listings for free", "Reach 1,200+ seekers", "Real-time enquiries", "M-Pesa payments"],
  admin:    ["Full platform oversight", "User management", "Fraud detection tools", "Analytics dashboard"],
};

export default function RegisterPage() {
  const { register } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", password: "",
    role: "seeker" as UserRole,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await register(form);
      toast.success("Account created! Welcome to NyumbaLink.");
      navigate(ROLE_REDIRECT[form.role]);
    } catch {
      toast.error("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectedConfig = ROLE_CONFIG.find(r => r.role === form.role)!;

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel ─────────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-5/12 bg-hero-gradient text-white flex-col items-center justify-center p-12">
        <div className="max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-6">
            <Home className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-3">Join NyumbaLink</h2>
          <p className="text-white/80 text-sm leading-relaxed mb-8">
            Tanzania's smart housing platform. Find fair-priced homes, list your property, or manage the platform.
          </p>

          {/* Dynamic benefits for selected role */}
          <div className="bg-white/10 rounded-2xl p-5 text-left">
            <p className="text-sm font-semibold text-white/90 mb-3">
              {selectedConfig.label} benefits:
            </p>
            <ul className="space-y-2">
              {BENEFITS[form.role].map(b => (
                <li key={b} className="flex items-center gap-2 text-sm text-white/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-300 flex-shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── Right panel ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-surface-50 overflow-y-auto">
        <div className="w-full max-w-md py-6">

          {/* Logo */}
          <div className="text-center mb-6">
            <Link to="/" className="inline-flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-maroon-500 flex items-center justify-center">
                <Home className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-xl">
                <span className="text-primary-600">Nyumba</span>
                <span className="text-maroon-500">Link</span>
              </span>
            </Link>
            <h1 className="text-2xl font-bold text-surface-900">Create Account</h1>
            <p className="text-surface-500 text-sm mt-1">Choose your role to get started</p>
          </div>

          {/* Role selector */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            {ROLE_CONFIG.map(rc => (
              <button
                key={rc.role}
                type="button"
                onClick={() => setForm(f => ({ ...f, role: rc.role }))}
                className={clsx(
                  "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all",
                  form.role === rc.role
                    ? `${rc.border} ${rc.bg} ${rc.text}`
                    : "border-surface-200 bg-white text-surface-500 hover:border-surface-300"
                )}
              >
                <div className={clsx(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  form.role === rc.role ? rc.iconBg : "bg-surface-100"
                )}>
                  <rc.icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold leading-tight text-center">{rc.label}</span>
              </button>
            ))}
          </div>

          {/* Selected role banner */}
          <div className={clsx(
            "flex items-center gap-3 rounded-xl px-4 py-2.5 mb-5 border text-sm",
            selectedConfig.bg,
            selectedConfig.border.replace("-500", "-200")
          )}>
            <selectedConfig.icon className={clsx("w-4 h-4 flex-shrink-0", selectedConfig.text)} />
            <span className={selectedConfig.text}>{selectedConfig.desc}</span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="card p-6 space-y-4">
            <div>
              <label className="label">{t("auth.name")}</label>
              <input
                className="input"
                placeholder="John Massawe"
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                required
                autoComplete="name"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{t("auth.email")}</label>
                <input
                  type="email"
                  className="input"
                  placeholder="you@email.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="label">{t("auth.phone")}</label>
                <input
                  className="input"
                  placeholder="+255 7xx xxx xxx"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  autoComplete="tel"
                />
              </div>
            </div>

            <div>
              <label className="label">{t("auth.password")}</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  className="input pr-10"
                  placeholder="Min 8 characters"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  autoComplete="new-password"
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={clsx(
                "w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50",
                form.role === "admin"
                  ? "bg-maroon-600 hover:bg-maroon-700"
                  : form.role === "landlord"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-primary-600 hover:bg-primary-700"
              )}
            >
              <UserPlus className="w-4 h-4" />
              {loading ? "Creating account…" : `Register as ${selectedConfig.label}`}
            </button>
          </form>

          <p className="text-center text-sm text-surface-500 mt-4">
            Already have an account?{" "}
            <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700">
              {t("auth.login")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
