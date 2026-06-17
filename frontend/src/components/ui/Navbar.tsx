import { useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Menu, X, Bell, Globe, Home, ChevronDown, LogOut,
  User, LayoutDashboard, Heart, Search, Building2,
  ShieldCheck, UserPlus, LogIn, Users,
} from "lucide-react";
import clsx from "clsx";
import { useAuth } from "../../contexts/AuthContext";
import { useLang } from "../../contexts/LanguageContext";

/** Role colour map */
const ROLE_BADGE: Record<string, string> = {
  seeker:   "bg-primary-100 text-primary-700",
  landlord: "bg-emerald-100 text-emerald-700",
  admin:    "bg-maroon-100 text-maroon-700",
};
const ROLE_LABEL: Record<string, string> = {
  seeker: "Seeker", landlord: "Landlord", admin: "Admin",
};

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { language, setLanguage, t } = useLang();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen]   = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [authMenuOpen, setAuthMenuOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const authMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
      if (authMenuRef.current && !authMenuRef.current.contains(e.target as Node)) setAuthMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => { logout(); setUserMenuOpen(false); navigate("/"); };

  const navLinks = [
    { to: "/",        label: t("nav.home"),    end: true },
    { to: "/search",  label: t("nav.search"),  end: false },
    { to: "/hostels", label: "Hostels",         end: false },
    { to: "/about",   label: t("nav.about"),   end: false },
    { to: "/contact", label: t("nav.contact"), end: false },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-surface-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ───────────────────────────────────────────────────────── */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-maroon-500 flex items-center justify-center shadow-sm">
              <Home className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-primary-600 text-lg leading-none">Nyumba</span>
              <span className="font-bold text-maroon-500 text-lg leading-none">Link</span>
            </div>
          </Link>

          {/* ── Desktop nav links ───────────────────────────────────────────── */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(l => (
              <NavLink key={l.to} to={l.to} end={l.end}
                className={({ isActive }) => clsx(
                  "px-3 py-2 rounded-lg text-sm transition-colors hover:bg-surface-100",
                  isActive ? "text-primary-600 font-semibold bg-primary-50" : "text-surface-700"
                )}
              >
                {l.label}
              </NavLink>
            ))}
          </div>

          {/* ── Right actions ───────────────────────────────────────────────── */}
          <div className="flex items-center gap-2">

            {/* Language toggle */}
            <button
              onClick={() => setLanguage(language === "en" ? "sw" : "en")}
              className="hidden sm:flex items-center gap-1 text-xs font-semibold text-surface-600 hover:text-primary-600 border border-surface-200 rounded-lg px-2 py-1.5 hover:bg-surface-50 transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              {language === "en" ? "SW" : "EN"}
            </button>

            {isAuthenticated ? (
              <>
                {/* Notifications bell */}
                <button className="relative p-2 text-surface-500 hover:text-primary-600 hover:bg-surface-100 rounded-lg transition-colors">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-maroon-500 rounded-full" />
                </button>

                {/* User dropdown */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(v => !v)}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-surface-100 transition-colors"
                  >
                    {/* Avatar */}
                    <div className={clsx(
                      "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold",
                      user?.role === "admin"    ? "bg-gradient-to-br from-maroon-500 to-maroon-700" :
                      user?.role === "landlord" ? "bg-gradient-to-br from-emerald-500 to-emerald-700" :
                                                  "bg-gradient-to-br from-primary-500 to-primary-700"
                    )}>
                      {user?.full_name[0]}
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-xs font-semibold text-surface-800 leading-none max-w-20 truncate">
                        {user?.full_name.split(" ")[0]}
                      </p>
                      <span className={clsx(
                        "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                        ROLE_BADGE[user?.role ?? "seeker"]
                      )}>
                        {ROLE_LABEL[user?.role ?? "seeker"]}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-surface-400" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-surface-200 rounded-2xl shadow-card-hover overflow-hidden z-50 animate-fade-in">
                      {/* Header */}
                      <div className="px-4 py-3 border-b border-surface-100 bg-surface-50">
                        <p className="text-sm font-semibold text-surface-900 truncate">{user?.full_name}</p>
                        <p className="text-xs text-surface-500 truncate">{user?.email}</p>
                        <span className={clsx(
                          "inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full",
                          ROLE_BADGE[user?.role ?? "seeker"]
                        )}>
                          {ROLE_LABEL[user?.role ?? "seeker"]}
                        </span>
                      </div>

                      {/* Links */}
                      <div className="py-1.5">
                        <Link to={`/${user?.role}/dashboard`}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4" /> Dashboard
                        </Link>
                        <Link to="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 hover:text-primary-600 transition-colors"
                        >
                          <User className="w-4 h-4" /> {t("nav.profile")}
                        </Link>
                        {user?.role === "seeker" && (
                          <Link to="/favorites"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 hover:text-primary-600 transition-colors"
                          >
                            <Heart className="w-4 h-4" /> {t("nav.favorites")}
                          </Link>
                        )}
                        {user?.role === "landlord" && (
                          <Link to="/landlord/add-property"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 hover:text-primary-600 transition-colors"
                          >
                            <Building2 className="w-4 h-4" /> Add Listing
                          </Link>
                        )}
                        {user?.role === "admin" && (
                          <Link to="/admin/dashboard"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-maroon-700 hover:bg-maroon-50 transition-colors"
                          >
                            <ShieldCheck className="w-4 h-4" /> Admin Panel
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-surface-100 py-1.5">
                        <button onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-maroon-600 hover:bg-maroon-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" /> {t("nav.logout")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* ── Guest: Login / Register dropdown ──────────────────────── */
              <div className="flex items-center gap-2" ref={authMenuRef}>

                {/* Login with role dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setAuthMenuOpen(v => !v)}
                    className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-surface-700 hover:text-primary-600 border border-surface-200 hover:border-primary-300 rounded-xl px-3 py-1.5 transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    {t("nav.login")}
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>

                  {authMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-surface-200 rounded-2xl shadow-card-hover overflow-hidden z-50 animate-fade-in">
                      <div className="px-4 py-2.5 border-b border-surface-100 bg-surface-50">
                        <p className="text-xs font-semibold text-surface-600 uppercase tracking-wide">Sign in as</p>
                      </div>
                      {[
                        { role: "seeker",   icon: Search,      label: "Seeker",   desc: "Find accommodation",  color: "text-primary-600",  bg: "hover:bg-primary-50" },
                        { role: "landlord", icon: Building2,   label: "Landlord", desc: "Manage my listings",  color: "text-emerald-600",  bg: "hover:bg-emerald-50" },
                        { role: "admin",    icon: ShieldCheck, label: "Admin",    desc: "System administration", color: "text-maroon-600", bg: "hover:bg-maroon-50" },
                      ].map(({ role, icon: Icon, label, desc, color, bg }) => (
                        <Link
                          key={role}
                          to={`/login?role=${role}`}
                          onClick={() => setAuthMenuOpen(false)}
                          className={clsx("flex items-center gap-3 px-4 py-3 transition-colors", bg)}
                        >
                          <div className={clsx("w-8 h-8 rounded-lg bg-surface-100 flex items-center justify-center flex-shrink-0", color)}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className={clsx("text-sm font-semibold", color)}>{label}</p>
                            <p className="text-xs text-surface-500">{desc}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Register with role dropdown */}
                <div className="relative">
                  <Link
                    to="/register"
                    className="btn-primary flex items-center gap-1.5 text-sm"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span className="hidden sm:inline">{t("nav.register")}</span>
                    <span className="sm:hidden">Join</span>
                  </Link>
                </div>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(v => !v)}
              className="md:hidden p-2 text-surface-600 hover:text-primary-600 hover:bg-surface-100 rounded-lg"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* ── Mobile menu ─────────────────────────────────────────────────── */}
        {mobileOpen && (
          <div className="md:hidden border-t border-surface-100 py-3 animate-slide-up">
            {/* Nav links */}
            {navLinks.map(l => (
              <NavLink key={l.to} to={l.to} end={l.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => clsx(
                  "block px-4 py-2.5 text-sm rounded-lg mb-0.5 transition-colors",
                  isActive ? "text-primary-600 font-semibold bg-primary-50" : "text-surface-700 hover:bg-surface-100"
                )}
              >
                {l.label}
              </NavLink>
            ))}

            {/* Auth section */}
            <div className="pt-3 mt-2 border-t border-surface-100 px-4 space-y-2">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-3 py-2">
                    <div className={clsx(
                      "w-9 h-9 rounded-full flex items-center justify-center text-white font-bold",
                      user?.role === "admin" ? "bg-maroon-500" : user?.role === "landlord" ? "bg-emerald-600" : "bg-primary-600"
                    )}>
                      {user?.full_name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-surface-900">{user?.full_name}</p>
                      <span className={clsx("text-[11px] font-semibold px-1.5 py-0.5 rounded-full", ROLE_BADGE[user?.role ?? "seeker"])}>
                        {ROLE_LABEL[user?.role ?? "seeker"]}
                      </span>
                    </div>
                  </div>
                  <Link to={`/${user?.role}/dashboard`} onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 text-sm text-surface-700 py-2"
                  >
                    <LayoutDashboard className="w-4 h-4 text-primary-500" /> Dashboard
                  </Link>
                  <button onClick={() => { handleLogout(); setMobileOpen(false); }}
                    className="flex items-center gap-2 text-sm text-maroon-600 py-2 w-full"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </>
              ) : (
                <>
                  <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2">Sign in as</p>
                  {[
                    { role: "seeker",   icon: Search,      label: "Seeker Login",   color: "text-primary-600" },
                    { role: "landlord", icon: Building2,   label: "Landlord Login", color: "text-emerald-600" },
                    { role: "admin",    icon: ShieldCheck, label: "Admin Login",    color: "text-maroon-600" },
                  ].map(({ role, icon: Icon, label, color }) => (
                    <Link key={role} to={`/login?role=${role}`}
                      onClick={() => setMobileOpen(false)}
                      className={clsx("flex items-center gap-2 text-sm py-2 font-medium", color)}
                    >
                      <Icon className="w-4 h-4" /> {label}
                    </Link>
                  ))}
                  <Link to="/register" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 text-sm text-surface-700 py-2 font-medium border-t border-surface-100 mt-1 pt-3"
                  >
                    <UserPlus className="w-4 h-4 text-primary-500" /> Create Account
                  </Link>
                </>
              )}

              {/* Language toggle */}
              <div className="pt-2 border-t border-surface-100">
                <button onClick={() => setLanguage(language === "en" ? "sw" : "en")}
                  className="flex items-center gap-1.5 text-xs font-semibold text-surface-600 border border-surface-200 rounded-lg px-2.5 py-1.5"
                >
                  <Globe className="w-3.5 h-3.5" />{language === "en" ? "SW" : "EN"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
