/**
 * Centralised API service — mock-ready with real endpoint structure.
 * All functions return typed promises. Mock data is embedded for
 * frontend-only development (no backend required to render UI).
 *
 * To switch to real backend: set VITE_API_URL in .env and set
 * VITE_USE_MOCK=false.
 */
import axios from "axios";
import type {
  User, AuthTokens, LoginRequest, RegisterRequest,
  Property, PropertySearchParams, PaginatedResponse,
  ChatMessage, PricePredictionRequest, PricePredictionResponse,
  Payment, AdminStats, Review, Notification,
  ConversationResponse, SpatialSearchParams, SearchResponse,
} from "../types";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";

export const http = axios.create({
  baseURL: BASE,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

// Attach token automatically
http.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem("nyumbalink_tokens");
    if (raw) {
      const tokens: AuthTokens = JSON.parse(raw);
      config.headers.Authorization = `Bearer ${tokens.access}`;
    }
  } catch { /* ignore */ }
  return config;
});

// ── Mock data helpers ──────────────────────────────────────────────────────

const MOCK_USER: User = {
  id: "u1", email: "demo@nyumbalink.co.tz", full_name: "Demo User",
  phone: "+255712345678", role: "seeker", is_verified: true,
  preferred_language: "en", created_at: "2024-01-01",
};

const MOCK_LANDLORD_USER: User = {
  id: "u2", email: "landlord@nyumbalink.co.tz", full_name: "Jane Landlord",
  phone: "+255756789012", role: "landlord", is_verified: true,
  preferred_language: "en", created_at: "2024-01-01",
};

const MOCK_ADMIN_USER: User = {
  id: "u3", email: "admin@nyumbalink.co.tz", full_name: "System Admin",
  phone: "+255700000001", role: "admin", is_verified: true,
  preferred_language: "en", created_at: "2024-01-01",
};

const MOCK_PROPERTIES: Property[] = [
  {
    id: "p1", title: "Spacious Room in Mikocheni B", description: "Clean, quiet room with compound access and 24/7 water supply. Close to Shoppers Plaza.",
    type: "room", status: "available", municipality: "Kinondoni", ward: "Mikocheni",
    street_address: "Mikocheni B, Off New Bagamoyo Road",
    latitude: -6.764, longitude: 39.279, rooms: 1, bathrooms: 1,
    floor_area_sqm: 18, rent_amount: 180000, deposit_months: 1,
    water_reliability: "continuous", electricity_config: "luku",
    is_furnished: false, has_wifi: false, has_parking: false,
    images: [{ id: "img1", url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800", is_primary: true }],
    amenities: [
      { id: "a1", name: "Shoppers Plaza Cafeteria", category: "cafeteria", distance_m: 350, latitude: -6.761, longitude: 39.282 },
      { id: "a2", name: "Mikocheni Daladala Stop", category: "transit_node", distance_m: 200, latitude: -6.766, longitude: 39.277 },
    ],
    landlord_id: "l1", landlord_name: "John Massawe", landlord_phone: "+255754001001",
    is_price_flagged: false, average_rating: 4.2, review_count: 7, created_at: "2024-03-10", updated_at: "2024-06-01",
  },
  {
    id: "p2", title: "2-Bedroom House — Sinza C", description: "Modern house with solar backup, borehole water, and parking. Ideal for families.",
    type: "house", status: "available", municipality: "Kinondoni", ward: "Sinza",
    street_address: "Sinza C, Near Sinza Mosque", latitude: -6.792, longitude: 39.249,
    rooms: 2, bathrooms: 1, floor_area_sqm: 55, rent_amount: 420000, deposit_months: 2,
    water_reliability: "daily", electricity_config: "solar",
    is_furnished: true, has_wifi: true, has_parking: true,
    images: [{ id: "img2", url: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800", is_primary: true }],
    amenities: [
      { id: "a3", name: "Sinza Hospital", category: "hospital", distance_m: 800, latitude: -6.789, longitude: 39.253 },
      { id: "a4", name: "Sinza Bus Terminal", category: "transit_node", distance_m: 400, latitude: -6.794, longitude: 39.246 },
    ],
    landlord_id: "l2", landlord_name: "Fatuma Hassan", landlord_phone: "+255653870753",
    is_price_flagged: false, fair_price_estimate: 390000,
    average_rating: 4.6, review_count: 12, created_at: "2024-02-15", updated_at: "2024-05-30",
  },
  {
    id: "p3", title: "Student Hostel — Mwenge", description: "Affordable hostel rooms for students. Walking distance to UDSM bus stop.",
    type: "hostel", status: "available", municipality: "Kinondoni", ward: "Mwenge",
    street_address: "Mwenge Roundabout area", latitude: -6.771, longitude: 39.259,
    rooms: 1, bathrooms: 1, floor_area_sqm: 12, rent_amount: 95000, deposit_months: 1,
    water_reliability: "intermittent", electricity_config: "luku",
    is_furnished: true, has_wifi: true, has_parking: false,
    images: [{ id: "img3", url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800", is_primary: true }],
    amenities: [
      { id: "a5", name: "Mwenge Cafeteria", category: "cafeteria", distance_m: 150, latitude: -6.772, longitude: 39.261 },
    ],
    landlord_id: "l3", landlord_name: "Peter Kimaro", landlord_phone: "+255756003003",
    is_price_flagged: true, fair_price_estimate: 75000,
    average_rating: 3.8, review_count: 4, created_at: "2024-04-01", updated_at: "2024-06-10",
  },
  {
    id: "p4", title: "Self-Contained Apartment — Kijitonyama",
    description: "Modern apartment with fitted kitchen, hot shower, and 24/7 security. Near UDOM bus stage.",
    type: "apartment", status: "available", municipality: "Kinondoni", ward: "Kijitonyama",
    street_address: "Kijitonyama, Near TANESCO Office", latitude: -6.778, longitude: 39.271,
    rooms: 2, bathrooms: 2, floor_area_sqm: 70, rent_amount: 650000, deposit_months: 2,
    water_reliability: "continuous", electricity_config: "fixed",
    is_furnished: true, has_wifi: true, has_parking: true,
    images: [{ id: "img4", url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800", is_primary: true }],
    amenities: [
      { id: "a6", name: "Kijitonyama Health Centre", category: "hospital", distance_m: 600, latitude: -6.775, longitude: 39.274 },
      { id: "a7", name: "UDOM Bus Stage", category: "transit_node", distance_m: 300, latitude: -6.780, longitude: 39.268 },
    ],
    landlord_id: "l4", landlord_name: "Rose Mwamba", landlord_phone: "+255757004004",
    is_price_flagged: false,
    average_rating: 4.8, review_count: 21, created_at: "2024-01-20", updated_at: "2024-06-05",
  },
  {
    id: "p5", title: "Room — Mwananyamala", description: "Affordable single room in a compound with shared facilities.",
    type: "room", status: "available", municipality: "Kinondoni", ward: "Mwananyamala",
    street_address: "Mwananyamala near hospital", latitude: -6.784, longitude: 39.262,
    rooms: 1, bathrooms: 1, floor_area_sqm: 14, rent_amount: 120000, deposit_months: 1,
    water_reliability: "daily", electricity_config: "luku",
    is_furnished: false, has_wifi: false, has_parking: false,
    images: [{ id: "img5", url: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800", is_primary: true }],
    amenities: [
      { id: "a8", name: "Mwananyamala Regional Hospital", category: "hospital", distance_m: 200, latitude: -6.782, longitude: 39.264 },
    ],
    landlord_id: "l5", landlord_name: "Ali Ndunguru", landlord_phone: "+255758005005",
    is_price_flagged: false,
    average_rating: 3.5, review_count: 3, created_at: "2024-05-01", updated_at: "2024-06-08",
  },
  {
    id: "p6", title: "3-Room House — Makumbusho", description: "Spacious family house, recently renovated. Has a garden and parking.",
    type: "house", status: "available", municipality: "Kinondoni", ward: "Makumbusho",
    street_address: "Makumbusho Village Road", latitude: -6.776, longitude: 39.254,
    rooms: 3, bathrooms: 2, floor_area_sqm: 90, rent_amount: 550000, deposit_months: 2,
    water_reliability: "continuous", electricity_config: "fixed",
    is_furnished: false, has_wifi: false, has_parking: true,
    images: [{ id: "img6", url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800", is_primary: true }],
    amenities: [],
    landlord_id: "l6", landlord_name: "Grace Mwakipesile", landlord_phone: "+255759006006",
    is_price_flagged: false,
    average_rating: 4.1, review_count: 6, created_at: "2024-03-25", updated_at: "2024-06-02",
  },

  // ── Real Hostel Listings ─────────────────────────────────────────────────
  // Contact for all hostels: +255653870753
  {
    id: "h1", title: "Dage Hostel (Girls Only)",
    description: "Girls-only hostel located in Africa Sana, Kinondoni. 56-bed capacity with clean shared bathrooms, compound security, and easy access to daladala transport. Perfect for female students and working women.",
    type: "hostel", status: "available", municipality: "Kinondoni", ward: "Sinza",
    street_address: "Africa Sana, Kinondoni, Dar es Salaam",
    latitude: -6.7955, longitude: 39.2468,
    rooms: 56, bathrooms: 8, floor_area_sqm: 14, rent_amount: 640000, deposit_months: 1,
    water_reliability: "daily", electricity_config: "luku",
    is_furnished: true, has_wifi: false, has_parking: false,
    capacity: 56, distance_to_udsm_km: 1.5, gender_policy: "girls" as const,
    images: [{ id: "h1img1", url: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800", is_primary: true }],
    amenities: [
      { id: "h1a1", name: "Africa Sana Daladala Stop", category: "transit_node" as const, distance_m: 100, latitude: -6.796, longitude: 39.245 },
    ],
    landlord_id: "lh1", landlord_name: "Dage Hostel Management", landlord_phone: "+255653870753",
    is_price_flagged: false, review_count: 0,
    created_at: "2025-01-01", updated_at: "2026-06-14",
    google_maps_url: "https://maps.google.com/?q=-6.7955,39.2468",
  },
  {
    id: "h2", title: "Maisha Hostel (Girls & Boys)",
    description: "Mixed hostel in Africa Sana with 82-bed capacity. Price ranges from TZS 560,000 to 800,000 depending on room type. Includes parking, clean facilities, and proximity to campus transport routes. Distance 1.4 km.",
    type: "hostel", status: "available", municipality: "Kinondoni", ward: "Sinza",
    street_address: "Africa Sana, Kinondoni, Dar es Salaam",
    latitude: -6.7948, longitude: 39.2475,
    rooms: 82, bathrooms: 12, floor_area_sqm: 16, rent_amount: 560000, price_range_max: 800000, deposit_months: 1,
    water_reliability: "continuous", electricity_config: "luku",
    is_furnished: true, has_wifi: true, has_parking: true,
    capacity: 82, distance_to_udsm_km: 1.4, gender_policy: "mixed" as const,
    images: [{ id: "h2img1", url: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800", is_primary: true }],
    amenities: [
      { id: "h2a1", name: "Africa Sana Daladala Stop", category: "transit_node" as const, distance_m: 120, latitude: -6.796, longitude: 39.245 },
      { id: "h2a2", name: "Sinza Hospital", category: "hospital" as const, distance_m: 800, latitude: -6.789, longitude: 39.253 },
    ],
    landlord_id: "lh2", landlord_name: "Maisha Hostel Management", landlord_phone: "+255653870753",
    is_price_flagged: false, review_count: 0,
    created_at: "2025-01-01", updated_at: "2026-06-14",
    google_maps_url: "https://maps.google.com/?q=-6.7948,39.2475",
  },
  {
    id: "h3", title: "Maria Stopes Hostel (Girls Only)",
    description: "Girls-only hostel in Bamaga area with 74-bed capacity. Distance 1.3 km. Price TZS 650,000/month. Secure compound, clean self-contained rooms, and convenient daladala access.",
    type: "hostel", status: "available", municipality: "Kinondoni", ward: "Mwananyamala",
    street_address: "Bamaga, Kinondoni, Dar es Salaam",
    latitude: -6.7838, longitude: 39.2585,
    rooms: 74, bathrooms: 10, floor_area_sqm: 14, rent_amount: 650000, deposit_months: 1,
    water_reliability: "daily", electricity_config: "luku",
    is_furnished: true, has_wifi: false, has_parking: false,
    capacity: 74, distance_to_udsm_km: 1.3, gender_policy: "girls" as const,
    images: [{ id: "h3img1", url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800", is_primary: true }],
    amenities: [
      { id: "h3a1", name: "Bamaga Daladala Stop", category: "transit_node" as const, distance_m: 200, latitude: -6.784, longitude: 39.257 },
      { id: "h3a2", name: "Mwananyamala Regional Hospital", category: "hospital" as const, distance_m: 600, latitude: -6.782, longitude: 39.264 },
    ],
    landlord_id: "lh3", landlord_name: "Maria Stopes Hostel", landlord_phone: "+255653870753",
    is_price_flagged: false, review_count: 0,
    created_at: "2025-01-01", updated_at: "2026-06-14",
    google_maps_url: "https://maps.google.com/?q=-6.7838,39.2585",
  },
  {
    id: "h4", title: "Nenes Hostel (Girls Only)",
    description: "Girls-only hostel in Kijitonyama, just 850 m from campus. Capacity 36. Price TZS 700,000/month. Self-contained rooms with WiFi, clean compound, and night security.",
    type: "hostel", status: "available", municipality: "Kinondoni", ward: "Kijitonyama",
    street_address: "Kijitonyama, Kinondoni, Dar es Salaam",
    latitude: -6.7785, longitude: 39.2715,
    rooms: 36, bathrooms: 6, floor_area_sqm: 15, rent_amount: 700000, deposit_months: 1,
    water_reliability: "continuous", electricity_config: "luku",
    is_furnished: true, has_wifi: true, has_parking: false,
    capacity: 36, distance_to_udsm_km: 0.85, gender_policy: "girls" as const,
    images: [{ id: "h4img1", url: "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800", is_primary: true }],
    amenities: [
      { id: "h4a1", name: "Kijitonyama Health Centre", category: "hospital" as const, distance_m: 500, latitude: -6.775, longitude: 39.274 },
      { id: "h4a2", name: "UDOM Bus Stage", category: "transit_node" as const, distance_m: 300, latitude: -6.780, longitude: 39.268 },
    ],
    landlord_id: "lh4", landlord_name: "Nenes Hostel Management", landlord_phone: "+255653870753",
    is_price_flagged: false, review_count: 0,
    created_at: "2025-01-01", updated_at: "2026-06-14",
    google_maps_url: "https://maps.google.com/?q=-6.7785,39.2715",
  },
  {
    id: "h5", title: "Kilimanjaro Hostel — Mr. Hostel (Boys Only)",
    description: "Boys-only hostel in Bamaga. Capacity 48. Distance 1.3 km. Price TZS 650,000/month. Budget-friendly rooms with shared facilities, compound parking, and easy access to UDSM transport routes.",
    type: "hostel", status: "available", municipality: "Kinondoni", ward: "Mwananyamala",
    street_address: "Bamaga, Kinondoni, Dar es Salaam",
    latitude: -6.7845, longitude: 39.2592,
    rooms: 48, bathrooms: 8, floor_area_sqm: 12, rent_amount: 650000, deposit_months: 1,
    water_reliability: "intermittent", electricity_config: "luku",
    is_furnished: true, has_wifi: false, has_parking: true,
    capacity: 48, distance_to_udsm_km: 1.3, gender_policy: "boys" as const,
    images: [{ id: "h5img1", url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800", is_primary: true }],
    amenities: [
      { id: "h5a1", name: "Bamaga Daladala Stop", category: "transit_node" as const, distance_m: 250, latitude: -6.784, longitude: 39.257 },
      { id: "h5a2", name: "Mwananyamala Regional Hospital", category: "hospital" as const, distance_m: 500, latitude: -6.782, longitude: 39.264 },
    ],
    landlord_id: "lh5", landlord_name: "Kilimanjaro Hostel (Mr. Hostel)", landlord_phone: "+255653870753",
    is_price_flagged: false, review_count: 0,
    created_at: "2025-01-01", updated_at: "2026-06-14",
    google_maps_url: "https://maps.google.com/?q=-6.7845,39.2592",
  },
  {
    id: "h6", title: "Evening Star Hostel (Boys Only)",
    description: "Boys-only hostel in Africa Sana. Capacity 34. Distance 2 km. Price TZS 600,000/month. Peaceful compound with night security and easy access to public transport.",
    type: "hostel", status: "available", municipality: "Kinondoni", ward: "Sinza",
    street_address: "Africa Sana, Kinondoni, Dar es Salaam",
    latitude: -6.7968, longitude: 39.2460,
    rooms: 34, bathrooms: 5, floor_area_sqm: 13, rent_amount: 600000, deposit_months: 1,
    water_reliability: "daily", electricity_config: "luku",
    is_furnished: true, has_wifi: false, has_parking: false,
    capacity: 34, distance_to_udsm_km: 2.0, gender_policy: "boys" as const,
    images: [{ id: "h6img1", url: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800", is_primary: true }],
    amenities: [
      { id: "h6a1", name: "Africa Sana Daladala Stop", category: "transit_node" as const, distance_m: 180, latitude: -6.796, longitude: 39.245 },
    ],
    landlord_id: "lh6", landlord_name: "Evening Star Management", landlord_phone: "+255653870753",
    is_price_flagged: false, review_count: 0,
    created_at: "2025-01-01", updated_at: "2026-06-14",
    google_maps_url: "https://maps.google.com/?q=-6.7968,39.2460",
  },
  {
    id: "h7", title: "Massawe Hostel (Girls & Boys)",
    description: "Mixed hostel in Sinza Mpakani A. Capacity 70. Distance 1.1 km. Price TZS 620,000/month. Well-maintained rooms, shared kitchen, and a short walk from Sinza main road.",
    type: "hostel", status: "available", municipality: "Kinondoni", ward: "Sinza",
    street_address: "Sinza Mpakani A, Kinondoni, Dar es Salaam",
    latitude: -6.7905, longitude: 39.2510,
    rooms: 70, bathrooms: 10, floor_area_sqm: 13, rent_amount: 620000, deposit_months: 1,
    water_reliability: "daily", electricity_config: "luku",
    is_furnished: true, has_wifi: false, has_parking: false,
    capacity: 70, distance_to_udsm_km: 1.1, gender_policy: "mixed" as const,
    images: [{ id: "h7img1", url: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800", is_primary: true }],
    amenities: [
      { id: "h7a1", name: "Sinza Bus Terminal", category: "transit_node" as const, distance_m: 300, latitude: -6.794, longitude: 39.246 },
      { id: "h7a2", name: "Sinza Hospital", category: "hospital" as const, distance_m: 700, latitude: -6.789, longitude: 39.253 },
    ],
    landlord_id: "lh7", landlord_name: "Massawe Hostel Management", landlord_phone: "+255653870753",
    is_price_flagged: false, review_count: 0,
    created_at: "2025-01-01", updated_at: "2026-06-14",
    google_maps_url: "https://maps.google.com/?q=-6.7905,39.2510",
  },
  {
    id: "h8", title: "Kiota Hostel (Girls Only)",
    description: "Premium girls-only hostel in Mikocheni. Capacity 175. Distance 1.7 km. Price TZS 640,000–1,200,000/month depending on room type. Self-contained rooms, WiFi, parking, and proximity to Shoppers Plaza.",
    type: "hostel", status: "available", municipality: "Kinondoni", ward: "Mikocheni",
    street_address: "Mikocheni, Kinondoni, Dar es Salaam",
    latitude: -6.7658, longitude: 39.2795,
    rooms: 175, bathrooms: 24, floor_area_sqm: 18, rent_amount: 640000, price_range_max: 1200000, deposit_months: 1,
    water_reliability: "continuous", electricity_config: "luku",
    is_furnished: true, has_wifi: true, has_parking: true,
    capacity: 175, distance_to_udsm_km: 1.7, gender_policy: "girls" as const,
    images: [{ id: "h8img1", url: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800", is_primary: true }],
    amenities: [
      { id: "h8a1", name: "Shoppers Plaza Cafeteria", category: "cafeteria" as const, distance_m: 350, latitude: -6.761, longitude: 39.282 },
      { id: "h8a2", name: "Mikocheni Daladala Stop", category: "transit_node" as const, distance_m: 220, latitude: -6.766, longitude: 39.277 },
    ],
    landlord_id: "lh8", landlord_name: "Kiota Hostel Management", landlord_phone: "+255653870753",
    is_price_flagged: false, review_count: 0,
    created_at: "2025-01-01", updated_at: "2026-06-14",
    google_maps_url: "https://maps.google.com/?q=-6.7658,39.2795",
  },
  {
    id: "h9", title: "Mikocheni Hostel (Girls & Boys)",
    description: "Large mixed hostel in Mikocheni. Capacity 250. Distance 2.8 km. Price TZS 1,000,000–2,000,000/month. Premium rooms with all amenities, WiFi, parking, and in-house cafeteria.",
    type: "hostel", status: "available", municipality: "Kinondoni", ward: "Mikocheni",
    street_address: "Mikocheni, Kinondoni, Dar es Salaam",
    latitude: -6.7662, longitude: 39.2800,
    rooms: 250, bathrooms: 30, floor_area_sqm: 25, rent_amount: 1000000, price_range_max: 2000000, deposit_months: 1,
    water_reliability: "continuous", electricity_config: "fixed",
    is_furnished: true, has_wifi: true, has_parking: true,
    capacity: 250, distance_to_udsm_km: 2.8, gender_policy: "mixed" as const,
    images: [{ id: "h9img1", url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800", is_primary: true }],
    amenities: [
      { id: "h9a1", name: "Shoppers Plaza Cafeteria", category: "cafeteria" as const, distance_m: 400, latitude: -6.761, longitude: 39.282 },
      { id: "h9a2", name: "Mikocheni Daladala Stop", category: "transit_node" as const, distance_m: 280, latitude: -6.766, longitude: 39.277 },
      { id: "h9a3", name: "Kijitonyama Health Centre", category: "hospital" as const, distance_m: 650, latitude: -6.775, longitude: 39.274 },
    ],
    landlord_id: "lh9", landlord_name: "Mikocheni Hostel Management", landlord_phone: "+255653870753",
    is_price_flagged: false, review_count: 0,
    created_at: "2025-01-01", updated_at: "2026-06-14",
    google_maps_url: "https://maps.google.com/?q=-6.7662,39.2800",
  },
];

// ── Auth API ───────────────────────────────────────────────────────────────

export const authApi = {
  login: async (data: LoginRequest): Promise<{ user: User; tokens: AuthTokens }> => {
    if (!USE_MOCK) {
      const res = await http.post("/api/v1/auth/login", data);
      return res.data;
    }
    await delay(600);
    const requestedRole = data.role ?? (data.email.includes("admin") ? "admin" : data.email.includes("landlord") ? "landlord" : "seeker");
    if (requestedRole === "admin") {
      return {
        user: MOCK_ADMIN_USER,
        tokens: { access: "mock_admin_token", refresh: "mock_admin_refresh_token" },
      };
    }
    if (requestedRole === "landlord") {
      return {
        user: MOCK_LANDLORD_USER,
        tokens: { access: "mock_landlord_token", refresh: "mock_landlord_refresh_token" },
      };
    }
    return {
      user: MOCK_USER,
      tokens: { access: "mock_access_token", refresh: "mock_refresh_token" },
    };
  },
  register: async (data: RegisterRequest): Promise<{ user: User; tokens: AuthTokens }> => {
    if (!USE_MOCK) {
      const res = await http.post("/api/v1/auth/register", data);
      return res.data;
    }
    await delay(800);
    const newUser: User = {
      id: `u_${Date.now()}`, email: data.email, full_name: data.full_name,
      phone: data.phone, role: data.role, is_verified: false,
      preferred_language: "en", created_at: new Date().toISOString(),
    };
    return { user: newUser, tokens: { access: "mock_access_token", refresh: "mock_refresh_token" } };
  },
  me: async (_token: string): Promise<User> => {
    if (!USE_MOCK) {
      const res = await http.get("/api/v1/auth/me");
      return res.data;
    }
    await delay(300);
    if (_token === "mock_admin_token") return MOCK_ADMIN_USER;
    if (_token === "mock_landlord_token") return MOCK_LANDLORD_USER;
    return MOCK_USER;
  },
  forgotPassword: async (email: string): Promise<void> => {
    if (!USE_MOCK) {
      await http.post("/api/v1/auth/forgot-password", { email });
      return;
    }
    await delay(600);
    console.log("Password reset for", email);
  },
  resetPassword: async (token: string, password: string): Promise<void> => {
    if (!USE_MOCK) {
      await http.post("/api/v1/auth/reset-password", { token, password });
      return;
    }
    await delay(600);
    console.log("Password reset with token", token);
  },
  updateProfile: async (data: Partial<User>): Promise<User> => {
    if (!USE_MOCK) {
      const res = await http.patch("/api/v1/auth/me", data);
      return res.data;
    }
    await delay(500);
    return { ...MOCK_USER, ...data };
  },
};

// ── Properties API ─────────────────────────────────────────────────────────

export const propertiesApi = {
  search: async (params: PropertySearchParams): Promise<PaginatedResponse<Property>> => {
    if (!USE_MOCK) {
      const res = await http.get("/api/v1/rentals/list", { params });
      return res.data;
    }
    await delay(500);
    let results = [...MOCK_PROPERTIES];
    if (params.municipality) results = results.filter(p => p.municipality === params.municipality);
    if (params.ward) results = results.filter(p => p.ward === params.ward);
    if (params.type) results = results.filter(p => p.type === params.type);
    if (params.max_rent) results = results.filter(p => p.rent_amount <= params.max_rent!);
    if (params.min_rooms) results = results.filter(p => p.rooms >= params.min_rooms!);
    if (params.is_furnished) results = results.filter(p => p.is_furnished);
    if (params.query) {
      const q = params.query.toLowerCase();
      results = results.filter(p => p.title.toLowerCase().includes(q) || p.ward.toLowerCase().includes(q));
    }
    return {
      results, count: results.length,
      next: null, previous: null,
      total_pages: 1, current_page: 1,
    };
  },
  getById: async (id: string): Promise<Property> => {
    if (!USE_MOCK) {
      const res = await http.get(`/api/v1/rentals/${id}`);
      return res.data;
    }
    await delay(300);
    const p = MOCK_PROPERTIES.find(x => x.id === id);
    if (!p) throw new Error("Property not found");
    return p;
  },
  create: async (data: Partial<Property>): Promise<Property> => {
    if (!USE_MOCK) {
      const res = await http.post("/api/v1/rentals/", data);
      return res.data;
    }
    await delay(800);
    const newProperty: Property = {
      ...MOCK_PROPERTIES[0],
      ...data,
      id: `p${Date.now()}`,
      created_at: data.created_at ?? new Date().toISOString(),
      updated_at: data.updated_at ?? new Date().toISOString(),
      images: data.images?.length ? data.images : [{ id: "fallback", url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800", is_primary: true }],
      amenities: data.amenities ?? [],
      landlord_id: data.landlord_id ?? "me",
      status: data.status ?? "pending",
      review_count: data.review_count ?? 0,
      is_price_flagged: data.is_price_flagged ?? false,
    };
    MOCK_PROPERTIES.unshift(newProperty);
    return newProperty;
  },
  update: async (id: string, data: Partial<Property>): Promise<Property> => {
    if (!USE_MOCK) {
      const res = await http.patch(`/api/v1/rentals/${id}`, data);
      return res.data;
    }
    await delay(500);
    const p = MOCK_PROPERTIES.find(x => x.id === id) ?? MOCK_PROPERTIES[0];
    return { ...p, ...data };
  },
  delete: async (id: string): Promise<void> => {
    if (!USE_MOCK) {
      await http.delete(`/api/v1/rentals/${id}`);
      return;
    }
    await delay(400);
    console.log("Deleted", id);
  },
  getReviews: async (_id: string): Promise<Review[]> => {
    await delay(300);
    return [
      { id: "r1", property_id: _id, user_id: "u2", user_name: "Alice M.", rating: 5, comment: "Great place, very clean and close to everything.", created_at: "2024-05-15" },
      { id: "r2", property_id: _id, user_id: "u3", user_name: "Bob K.", rating: 4, comment: "Good value for money. Landlord is responsive.", created_at: "2024-04-22" },
    ];
  },
  getFeatured: async (): Promise<Property[]> => {
    await delay(400);
    return MOCK_PROPERTIES.slice(0, 4);
  },
  /** Get properties owned by the current authenticated landlord */
  myListings: async (): Promise<PaginatedResponse<Property>> => {
    if (!USE_MOCK) {
      const res = await http.get("/api/v1/rentals/my-listings");
      return res.data;
    }
    await delay(400);
    return {
      results: MOCK_PROPERTIES.slice(0, 3), count: 3,
      next: null, previous: null,
      total_pages: 1, current_page: 1,
    };
  },
};

// ── Spatial search (chat/map layer) ───────────────────────────────────────

export async function searchRentals(params: SpatialSearchParams): Promise<SearchResponse> {
  if (!USE_MOCK) {
    const res = await http.get("/api/v1/rentals/search", { params });
    return res.data;
  }
  await delay(500);
  // Build mock SearchResponse from MOCK_PROPERTIES
  const results = MOCK_PROPERTIES.map((p, i) => ({
    property_id: p.id,
    id: p.id,
    title: p.title,
    ward: p.ward,
    base_rent_amount: p.rent_amount,
    structural_rooms: p.rooms,
    distance_metres: 200 + i * 150,
    is_price_flagged: p.is_price_flagged,
    flagged_fair_value: p.fair_price_estimate ?? null,
    longitude: p.longitude,
    latitude: p.latitude,
    amenities: p.amenities,
  })).filter(r => !params.max_rent || r.base_rent_amount <= params.max_rent)
     .filter(r => !params.min_rooms || r.structural_rooms >= params.min_rooms)
     .filter(r => !params.ward || r.ward === params.ward)
     .slice(0, params.limit ?? 20);

  return {
    total_results: results.length,
    radius_metres: params.radius_metres ?? 2000,
    origin_lng: params.target_lng,
    origin_lat: params.target_lat,
    results,
  };
}

// ── Chat API ───────────────────────────────────────────────────────────────

const HOSTEL_AI_HIGHLIGHTS = [
  { name: "Dage Hostel", location: "Africa Sana", price: "640K", capacity: "56", distance: "1.5 km", gender: "Girls only" },
  { name: "Maisha Hostel", location: "Africa Sana", price: "560K–800K", capacity: "82", distance: "1.4 km", gender: "Girls & boys" },
  { name: "Maria Stopes Hostel", location: "Bamaga", price: "650K", capacity: "74", distance: "1.3 km", gender: "Girls only" },
  { name: "Nenes Hostel", location: "Kijitonyama", price: "700K", capacity: "36", distance: "850 m", gender: "Girls only" },
  { name: "Kilimanjaro Hostel", location: "Bamaga", price: "650K", capacity: "48", distance: "1.3 km", gender: "Boys only" },
  { name: "Evening Star Hostel", location: "Africa Sana", price: "600K", capacity: "34", distance: "2 km", gender: "Boys only" },
  { name: "Massawe Hostel", location: "Sinza Mpakani A", price: "620K", capacity: "70", distance: "1.1 km", gender: "Girls & boys" },
  { name: "Kiota Hostel", location: "Mikocheni", price: "640K–1.2M", capacity: "175", distance: "1.7 km", gender: "Girls only" },
  { name: "Mikocheni Hostel", location: "Mikocheni", price: "1M–2M", capacity: "250", distance: "2.8 km", gender: "Girls & boys" },
] as const;

const CHAT_RESPONSES: Record<string, string> = {
  default_en: "I found several properties matching your request. Let me show you the best options based on your budget and location preferences.",
  default_sw: "Nimepata mali kadhaa zinazolingana na ombi lako. Niache nikuonyeshe chaguzi bora kulingana na bajeti na mahali unapotaka.",
  search: "Based on your search, here are properties in your specified area. You can filter by budget, number of rooms, or amenities.",
  price: "The fair market value for this area is typically between TZS 150,000 – 250,000 per month for a standard room, depending on amenities.",
};

export const chatApi = {
  sendMessage: async (message: string, sessionId?: string): Promise<{
    reply: string; session_id: string; intent: ChatMessage["intent"];
    trigger_search?: boolean; search_params?: PropertySearchParams;
  }> => {
    await delay(900);
    const isSwahili = /natafuta|chumba|nyumba|karibu|onyesha/i.test(message);
    const isPrice = /price|bei|fair|thamani/i.test(message);
    const hostelMatches = HOSTEL_AI_HIGHLIGHTS.filter((hostel) =>
      new RegExp(hostel.name, "i").test(message) ||
      new RegExp(hostel.location, "i").test(message) ||
      /hostel/i.test(message)
    );

    const reply = isPrice
      ? CHAT_RESPONSES.price
      : hostelMatches.length > 0
        ? `I can recommend these updated hostel options: ${hostelMatches.slice(0, 3).map((hostel) => `${hostel.name} (${hostel.gender}) in ${hostel.location} — TZS ${hostel.price}, capacity ${hostel.capacity}, ${hostel.distance} away.`).join(" ")}`
        : isSwahili
          ? CHAT_RESPONSES.default_sw
          : CHAT_RESPONSES.default_en;

    const wards = ["Mikocheni","Sinza","Mwenge","Kijitonyama","Mwananyamala","Makumbusho","Mabatini","Tandale"];
    const mentionedWard = wards.find(w => message.toLowerCase().includes(w.toLowerCase()));
    const budgetMatch = message.match(/(\d[\d,]+)/);
    const budget = budgetMatch ? parseInt(budgetMatch[1].replace(/,/g, ""), 10) : undefined;

    return {
      reply,
      session_id: sessionId ?? `sess_${Date.now()}`,
      intent: {
        parsed_intent: isPrice ? "predict_fair_price" : "search_accommodation",
        geographical_bounds: {
          target_municipality: "Kinondoni",
          target_ward: mentionedWard ?? null,
        },
        financial_constraints: {
          max_budget_limit: budget ?? null,
          min_budget_limit: null,
          currency_code: "TZS",
        },
        structural_requirements: { property_type: null, min_rooms: null },
        raw_normalized_text: message.toLowerCase(),
        confidence: 0.87,
        ward: mentionedWard,
        max_budget: budget,
        language: isSwahili ? "sw" : "en",
      },
      trigger_search: !isPrice,
      search_params: mentionedWard
        ? { ward: mentionedWard as never, max_rent: budget }
        : { max_rent: budget },
    };
  },
};

/**
 * sendChatMessage — REST chat call (used by useChat hook as WebSocket fallback).
 * Returns backend-shaped ConversationResponse.
 */
export async function sendChatMessage(message: string, sessionId: string): Promise<ConversationResponse> {
  if (!USE_MOCK) {
    const res = await http.post("/api/v1/conversation/message", { message, session_id: sessionId });
    return res.data;
  }
  const result = await chatApi.sendMessage(message, sessionId);
  return {
    session_id: result.session_id,
    reply: result.reply,
    parsed_intent: result.intent ?? null,
    action_triggered: result.trigger_search ? "TRIGGER_SEARCH" : null,
  };
}

/**
 * createChatWebSocket — opens a WebSocket to the conversation endpoint.
 */
export function createChatWebSocket(sessionId: string): WebSocket {
  const wsBase = BASE.replace(/^http/, "ws");
  return new WebSocket(`${wsBase}/api/v1/conversation/ws/${sessionId}`);
}

// ── Price prediction API ───────────────────────────────────────────────────

export const predictionApi = {
  predict: async (req: PricePredictionRequest): Promise<PricePredictionResponse> => {
    if (!USE_MOCK) {
      const res = await http.post("/api/v1/predict-price/", req);
      return res.data;
    }
    await delay(700);
    const rooms = req.structural_rooms ?? req.rooms ?? 1;
    const base = rooms * 130000;
    const furnishedBonus = req.is_furnished ? 50000 : 0;
    const wifiBonus = req.has_wifi ? 20000 : 0;
    const waterMult = req.water_reliability === "continuous" ? 1.2
      : req.water_reliability === "daily" ? 1.1 : 1.0;
    const estimated = Math.round((base + furnishedBonus + wifiBonus) * waterMult);
    return {
      estimated_fair_market_value: estimated,
      calculated_variance_range: {
        minimum_fair_boundary: Math.round(estimated * 0.88),
        maximum_fair_boundary: Math.round(estimated * 1.12),
      },
      confidence_score_metric: 0.91,
      ward: req.ward,
      is_overpriced: false,
      overpriced_by_percent: 0,
      // convenience aliases
      estimated_fair_value: estimated,
      min_range: Math.round(estimated * 0.88),
      max_range: Math.round(estimated * 1.12),
      confidence: 0.91,
    };
  },
};

/**
 * predictPrice — direct export for components that import it by name.
 */
export async function predictPrice(req: PricePredictionRequest): Promise<PricePredictionResponse> {
  return predictionApi.predict(req);
}

// ── Payments API ───────────────────────────────────────────────────────────

export const paymentsApi = {
  initiate: async (amount: number, phone: string, desc: string): Promise<Payment> => {
    await delay(1200);
    return {
      id: `pay_${Date.now()}`, user_id: "u1", type: "booking",
      amount, currency: "TZS", status: "pending",
      mpesa_ref: `MPESA${Math.random().toString(36).slice(2,10).toUpperCase()}`,
      description: desc, created_at: new Date().toISOString(),
    };
  },
  history: async (): Promise<Payment[]> => {
    await delay(400);
    return [
      { id: "pay1", user_id: "u1", property_id: "p1", type: "booking", amount: 180000, currency: "TZS", status: "completed", mpesa_ref: "MPESA1A2B3C", description: "Rent — Mikocheni Room", created_at: "2024-05-01" },
      { id: "pay2", user_id: "u1", type: "promotion", amount: 25000, currency: "TZS", status: "completed", mpesa_ref: "MPESA4D5E6F", description: "Listing Promotion", created_at: "2024-04-15" },
    ];
  },
};

// ── Admin API ──────────────────────────────────────────────────────────────

export const adminApi = {
  stats: async (): Promise<AdminStats> => {
    await delay(600);
    return {
      total_users: 1248, total_properties: 342, active_listings: 287,
      total_revenue: 12450000, pending_approvals: 14, fraud_reports: 3,
      users_by_month: [
        { month: "Jan", count: 45 }, { month: "Feb", count: 62 }, { month: "Mar", count: 88 },
        { month: "Apr", count: 110 }, { month: "May", count: 134 }, { month: "Jun", count: 156 },
      ],
      revenue_by_month: [
        { month: "Jan", amount: 1200000 }, { month: "Feb", amount: 1850000 },
        { month: "Mar", amount: 2100000 }, { month: "Apr", amount: 2400000 },
        { month: "May", amount: 2600000 }, { month: "Jun", amount: 2300000 },
      ],
      listings_by_municipality: [
        { municipality: "Kinondoni", count: 145 }, { municipality: "Ilala", count: 89 },
        { municipality: "Ubungo", count: 67 }, { municipality: "Temeke", count: 56 },
        { municipality: "Kigamboni", count: 30 },
      ],
      popular_wards: [
        { ward: "Mikocheni", count: 58 }, { ward: "Sinza", count: 47 },
        { ward: "Mwenge", count: 41 }, { ward: "Kijitonyama", count: 36 },
      ],
    };
  },
  users: async (): Promise<User[]> => {
    await delay(400);
    return [MOCK_USER, MOCK_LANDLORD_USER];
  },
  approveProperty: async (id: string): Promise<void> => {
    await delay(400);
    console.log("Approved property", id);
  },
  suspendUser: async (id: string): Promise<void> => {
    await delay(400);
    console.log("Suspended user", id);
  },
};

// ── Notifications ──────────────────────────────────────────────────────────

export const notificationsApi = {
  list: async (): Promise<Notification[]> => {
    await delay(300);
    return [
      { id: "n1", title: "New Inquiry", body: "Someone enquired about your Mikocheni listing.", is_read: false, created_at: "2024-06-13T10:00:00Z" },
      { id: "n2", title: "Payment Received", body: "TZS 180,000 received via M-Pesa.", is_read: true, created_at: "2024-06-12T08:30:00Z" },
    ];
  },
  markRead: async (id: string): Promise<void> => {
    await delay(200);
    console.log("Marked read", id);
  },
};

// ── Favorites ──────────────────────────────────────────────────────────────

export const favoritesApi = {
  list: async (): Promise<Property[]> => {
    await delay(300);
    return MOCK_PROPERTIES.slice(0, 2);
  },
  add: async (id: string): Promise<void> => { await delay(200); console.log("Fav added", id); },
  remove: async (id: string): Promise<void> => { await delay(200); console.log("Fav removed", id); },
};

// ── Util ───────────────────────────────────────────────────────────────────

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }
