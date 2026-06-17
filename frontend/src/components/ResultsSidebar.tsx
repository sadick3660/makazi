/**
 * ResultsSidebar — scrollable property results list that slides in
 * after a successful search.
 */
import { useAppStore } from "../store/appStore";
import PropertyCard from "./PropertyCard";

export default function ResultsSidebar() {
  const { searchResults, isSearching } = useAppStore();

  if (isSearching) {
    return (
      <div className="flex flex-col gap-3 p-3 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 rounded-xl bg-slate-800 border border-slate-700"
          />
        ))}
      </div>
    );
  }

  if (searchResults.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 p-3 overflow-y-auto max-h-full">
      <p className="text-xs text-slate-500 font-medium px-1 mb-1">
        {searchResults.length} properties within 2 km
      </p>
      {searchResults.map((p) => (
        <PropertyCard key={p.property_id} property={p} />
      ))}
    </div>
  );
}
