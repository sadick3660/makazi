import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Heart, MessageSquare, CreditCard, MapPin, TrendingUp, Bell, ChevronRight } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { propertiesApi, favoritesApi, notificationsApi } from "../../services/api";
import PropertyCard from "../../components/ui/PropertyCard";
import type { Property, Notification } from "../../types";

export default function SeekerDashboard() {
  const { user } = useAuth();
  const [recommended, setRecommended] = useState<Property[]>([]);
  const [favorites, setFavorites] = useState<Property[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    propertiesApi.getFeatured().then(setRecommended);
    favoritesApi.list().then(setFavorites);
    notificationsApi.list().then(setNotifications);
  }, []);

  const unread = notifications.filter(n => !n.is_read).length;

  const handleMarkNotificationsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;

    await Promise.all(unreadIds.map(id => notificationsApi.markRead(id)));
    setNotifications(current => current.map(n => ({ ...n, is_read: true })));
  };

  const actions = [
    { icon: Search,       label: "Search Properties", to: "/search",   color: "bg-primary-100 text-primary-600" },
    { icon: MessageSquare,label: "AI Chat",           to: "/chat",     color: "bg-emerald-100 text-emerald-600" },
    { icon: Heart,        label: "My Favorites",      to: "/favorites",color: "bg-maroon-100 text-maroon-600" },
    { icon: CreditCard,   label: "Payments",          to: "/payments", color: "bg-amber-100 text-amber-600" },
  ];

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <div className="bg-hero-gradient text-white px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-primary-200 text-sm mb-1">Welcome back,</p>
              <h1 className="text-2xl sm:text-3xl font-bold">{user?.full_name ?? "User"} 👋</h1>
              <p className="text-primary-200 mt-1 text-sm">Your housing search dashboard</p>
            </div>
            <div className="relative">
              <button className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors">
                <Bell className="w-5 h-5 text-white" />
              </button>
              {unread > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-maroon-500 rounded-full text-white text-xs flex items-center justify-center font-bold">{unread}</span>}
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
            {actions.map(a => (
              <Link key={a.to} to={a.to}
                className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl p-4 flex flex-col items-center gap-2 text-center transition-all hover:scale-105"
              >
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <a.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs text-white font-medium">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Notifications */}
        {unread > 0 && (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-surface-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary-500" /> Notifications
                <span className="badge-maroon">{unread} new</span>
              </h2>
              <button
                type="button"
                onClick={handleMarkNotificationsRead}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Mark all read
              </button>
            </div>
            <div className="space-y-2">
              {notifications.filter(n => !n.is_read).map(n => (
                <div key={n.id} className="flex items-start gap-3 bg-primary-50 border border-primary-100 rounded-xl p-3">
                  <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-surface-900">{n.title}</p>
                    <p className="text-xs text-surface-500">{n.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Saved favorites */}
        {favorites.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-surface-900 flex items-center gap-2">
                <Heart className="w-4 h-4 text-maroon-500" /> Saved Properties
              </h2>
              <Link to="/favorites" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
                View all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {favorites.slice(0, 3).map(p => <PropertyCard key={p.id} property={p} />)}
            </div>
          </div>
        )}

        {/* AI Recommendations */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-surface-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary-500" /> Recommended For You
            </h2>
            <Link to="/search" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
              Browse all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {recommended.map(p => <PropertyCard key={p.id} property={p} />)}
          </div>
        </div>

        {/* Price intelligence banner */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">Check if your rent is fair</h3>
            <p className="text-primary-200 text-sm">Our AI model analyses thousands of listings to tell you the fair market price for any neighbourhood.</p>
          </div>
          <Link to="/chat" className="btn-primary bg-white text-primary-700 hover:bg-primary-50 flex-shrink-0">
            Get Price Estimate
          </Link>
        </div>
      </div>
    </div>
  );
}
