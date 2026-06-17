import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { favoritesApi } from "../../services/api";
import PropertyCard from "../../components/ui/PropertyCard";
import type { Property } from "../../types";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    favoritesApi.list().then(setFavorites).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="bg-hero-gradient text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Heart className="w-7 h-7 fill-white" /> Saved Properties
          </h1>
          <p className="text-primary-200 mt-2">Your shortlisted accommodation</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1,2,3,4].map(i => <div key={i} className="card h-64 animate-pulse bg-surface-200" />)}
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-16 h-16 text-surface-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-surface-700 mb-2">No saved properties yet</h3>
            <p className="text-surface-500 text-sm mb-6">Start saving properties you like while browsing.</p>
            <Link to="/search" className="btn-primary">Browse Properties</Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-surface-600 font-medium mb-5">{favorites.length} saved propert{favorites.length !== 1 ? "ies" : "y"}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {favorites.map(p => <PropertyCard key={p.id} property={p} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
