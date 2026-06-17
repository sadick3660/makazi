/**
 * Global Zustand store — single source of truth for search results,
 * chat history, map state, and prediction output.
 */
import { create } from "zustand";
import type {
  ChatMessage,
  MapPin,
  ParsedIntent,
  PricePredictionResponse,
  PropertySearchResult,
  WardName,
} from "../types";
// All types above are now exported from types/index.ts

interface AppState {
  // ── Chat ──────────────────────────────────────────────────────────────────
  sessionId: string | null;
  messages: ChatMessage[];
  isTyping: boolean;
  setSessionId: (id: string) => void;
  addMessage: (msg: ChatMessage) => void;
  setTyping: (v: boolean) => void;

  // ── Map / Search ──────────────────────────────────────────────────────────
  searchResults: PropertySearchResult[];
  mapPins: MapPin[];
  selectedPropertyId: string | null;
  mapCenter: [number, number]; // [lat, lng]
  mapZoom: number;
  isSearching: boolean;
  setSearchResults: (results: PropertySearchResult[]) => void;
  setSelectedProperty: (id: string | null) => void;
  setMapCenter: (center: [number, number], zoom?: number) => void;
  setSearching: (v: boolean) => void;

  // ── Active filters (driven by NLP intent) ─────────────────────────────────
  activeWard: WardName | null;
  activeMaxRent: number | null;
  activeMinRooms: number | null;
  applyIntent: (intent: ParsedIntent) => void;

  // ── Price Prediction ──────────────────────────────────────────────────────
  predictionResult: PricePredictionResponse | null;
  setPredictionResult: (r: PricePredictionResponse | null) => void;
}

// Default centre: Mwenge roundabout, Kinondoni
const KINONDONI_CENTER: [number, number] = [-6.774, 39.259];

export const useAppStore = create<AppState>((set) => ({
  // ── Chat
  sessionId: null,
  messages: [],
  isTyping: false,
  setSessionId: (id) => set({ sessionId: id }),
  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages, msg] })),
  setTyping: (v) => set({ isTyping: v }),

  // ── Map / Search
  searchResults: [],
  mapPins: [],
  selectedPropertyId: null,
  mapCenter: KINONDONI_CENTER,
  mapZoom: 14,
  isSearching: false,

  setSearchResults: (results) => {
    const pins: MapPin[] = results.flatMap((p) => {
      const propertyPin: MapPin = {
        id: String(p.property_id),
        lat: p.latitude,
        lng: p.longitude,
        type: "property",
        label: p.title,
        rent: p.base_rent_amount,
        is_flagged: p.is_price_flagged,
        isFlagged: p.is_price_flagged,
      };
      const amenityPins: MapPin[] = p.amenities.map((a) => ({
        id: String(a.amenity_id ?? a.id),
        lat: p.latitude + (Math.random() - 0.5) * 0.003,
        lng: p.longitude + (Math.random() - 0.5) * 0.003,
        type: a.category,
        label: a.name,
      }));
      return [propertyPin, ...amenityPins];
    });
    // Ensure every result has a convenient .id string alias
    const normalised = results.map(r => ({ ...r, id: String(r.property_id) }));
    set({ searchResults: normalised, mapPins: pins });
  },

  setSelectedProperty: (id) => set({ selectedPropertyId: id }),
  setMapCenter: (center, zoom) =>
    set((s) => ({ mapCenter: center, mapZoom: zoom ?? s.mapZoom })),
  setSearching: (v) => set({ isSearching: v }),

  // ── Filters
  activeWard: null,
  activeMaxRent: null,
  activeMinRooms: null,
  applyIntent: (intent) =>
    set({
      activeWard: (
        (intent.geographical_bounds?.target_ward as WardName)
        ?? (intent.ward as WardName)
        ?? null
      ),
      activeMaxRent:
        intent.financial_constraints?.max_budget_limit
        ?? intent.max_budget
        ?? null,
      activeMinRooms:
        intent.structural_requirements?.min_rooms
        ?? intent.min_rooms
        ?? null,
    }),

  // ── Price Prediction
  predictionResult: null,
  setPredictionResult: (r) => set({ predictionResult: r }),
}));
