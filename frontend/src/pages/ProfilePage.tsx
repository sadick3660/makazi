import { useState } from "react";
import { User, Mail, Phone, Globe, Save, Shield, Bell, LogOut } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useLang } from "../contexts/LanguageContext";
import toast from "react-hot-toast";
import type { Language } from "../types";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { language, setLanguage } = useLang();
  const [form, setForm] = useState({ full_name: user?.full_name ?? "", phone: user?.phone ?? "", email: user?.email ?? "" });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    toast.success("Profile updated successfully!");
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="bg-hero-gradient text-white py-12 px-4">
        <div className="max-w-3xl mx-auto flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold">
            {user?.full_name[0]}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user?.full_name}</h1>
            <p className="text-primary-200 text-sm capitalize">{user?.role} · {user?.email}</p>
            {user?.is_verified && (
              <div className="flex items-center gap-1 mt-1 text-emerald-300 text-xs">
                <Shield className="w-3 h-3" /> Verified Account
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Profile form */}
        <form onSubmit={handleSave} className="card p-6">
          <h2 className="font-semibold text-surface-900 mb-5 flex items-center gap-2"><User className="w-4 h-4 text-primary-500" />Personal Information</h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input className="input pl-9" value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input type="email" className="input pl-9" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="label">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input className="input pl-9" placeholder="+255 7xx xxx xxx" value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save Changes"}
          </button>
        </form>

        {/* Language */}
        <div className="card p-6">
          <h2 className="font-semibold text-surface-900 mb-4 flex items-center gap-2"><Globe className="w-4 h-4 text-primary-500" />Language Preference</h2>
          <div className="grid grid-cols-2 gap-3 max-w-xs">
            {([["en", "🇬🇧 English"], ["sw", "🇹🇿 Kiswahili"]] as [Language, string][]).map(([lang, label]) => (
              <button key={lang} onClick={() => setLanguage(lang)}
                className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${language === lang ? "border-primary-500 bg-primary-50 text-primary-700" : "border-surface-200 text-surface-600 hover:border-surface-300"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="card p-6">
          <h2 className="font-semibold text-surface-900 mb-4 flex items-center gap-2"><Bell className="w-4 h-4 text-primary-500" />Notifications</h2>
          <div className="space-y-3">
            {[
              { label: "Email notifications", desc: "Receive updates via email" },
              { label: "New inquiries", desc: "When someone contacts you about a listing" },
              { label: "Price alerts", desc: "When similar listings change price" },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-surface-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-surface-800">{item.label}</p>
                  <p className="text-xs text-surface-500">{item.desc}</p>
                </div>
                <input type="checkbox" defaultChecked className="accent-primary-500 w-4 h-4 cursor-pointer" />
              </div>
            ))}
          </div>
        </div>

        {/* Danger zone */}
        <div className="card p-6 border-maroon-100">
          <h2 className="font-semibold text-maroon-600 mb-4">Account Actions</h2>
          <button onClick={logout} className="btn-outline border-maroon-300 text-maroon-600 hover:bg-maroon-50 hover:border-maroon-400">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
