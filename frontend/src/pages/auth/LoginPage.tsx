import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Home, LogIn, Search } from "lucide-react";
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
    desc: "Find accommodation",
    border: "border-primary-500",
    bg: "bg-primary-50",
    text: "text-primary-700",
    iconBg: "bg-primary-100",
  },
];

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const fromParam = (location.state as { from?: string })?.from;
  const [form, setForm] = useState({ email: "", password: "", role: "seeker" as UserRole });

  useEffect(() => {
    const role = new URLSearchParams(location.search).get("role") as UserRole | null;
    if (role === "landlord" || role === "admin") {
      setForm(current => ({ ...current, role }));
    }
  }, [location.search]);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form);
      navigate(fromParam ?? `/${user.role}/dashboard`, { replace: true });
    } catch {
      toast.error("Invalid email or password. Try any email with the demo.");
    } finally {
      setLoading(false);
    }
  };

  const selectedConfig = ROLE_CONFIG.find(r => r.role === form.role)!;

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel ───────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-5/12 bg-hero-gradient text-white flex-col items-center justify-center p-12">
        <div className="max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-6">
            <Home className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Welcome Back!</h2>
          <p className="text-white/80 leading-relaxed text-sm">
            Sign in to access your dashboard, manage listings, and continue your housing journey across Dar es Salaam.
          </p>
          <div className="mt-10 space-y-3">
            {ROLE_CONFIG.map(rc => (
              <div key={rc.role} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3 text-left">
                <rc.icon className="w-5 h-5 text-white/80 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold">{rc.label}</p>
                  <p className="text-xs text-white/60">{rc.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel ──────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-surface-50">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-7">
            <Link to="/" className="inline-flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-maroon-500 flex items-center justify-center">
                <Home className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-xl">
                <span className="text-primary-600">Nyumba</span>
                <span className="text-maroon-500">Link</span>
              </span>
            </Link>
            <h1 className="text-2xl font-bold text-surface-900">Sign In</h1>
            <p className="text-surface-500 text-sm mt-1">Sign in to access your seeker dashboard.</p>
          </div>


          {/* Form */}
          <form onSubmit={handleSubmit} className="card p-7 space-y-4">
            <div>
              <label className="label">{t("auth.email")}</label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label !mb-0">{t("auth.password")}</label>
                <Link to="/forgot-password" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                  {t("auth.forgot")}
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  className="input pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  autoComplete="current-password"
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
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50 bg-primary-600 hover:bg-primary-700"
            >
              <LogIn className="w-4 h-4" />
              {loading ? "Signing in…" : "Sign in"}
            </button>

            {/* Demo hint */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
              <strong>Demo mode:</strong> Use any email and password to sign in.
            </div>
          </form>

          <p className="text-center text-sm text-surface-500 mt-4">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary-600 font-semibold hover:text-primary-700">
              {t("auth.register")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
