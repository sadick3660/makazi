// ── Enums ─────────────────────────────────────────────────────────────────

export type UserRole = "seeker" | "landlord" | "admin";
export type Language = "en" | "sw";

export type Municipality =
  | "Ilala" | "Kinondoni" | "Ubungo" | "Temeke" | "Kigamboni";

export type Ward =
  | "Mikocheni" | "Mwananyamala" | "Kijitonyama" | "Mwenge"
  | "Mabatini" | "Makumbusho" | "Sinza" | "Tandale" | "Ubungo"
  | "Ilala" | "Temeke" | "Kigamboni";

/** Alias used by the NLP/chat/map layer (Kinondoni-specific wards) */
export type WardName = Ward;

export type PropertyType = "room" | "house" | "hostel" | "apartment";
export type PropertyStatus = "available" | "rented" | "pending" | "suspended";
export type AmenityCategory = "cafeteria" | "transit_node" | "hospital" | "school" | "university";
export type WaterReliability = "none" | "intermittent" | "daily" | "continuous";
export type ElectricityConfig = "none" | "luku" | "fixed" | "solar";
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";
export type PaymentType = "booking" | "promotion" | "subscription";

// ── Auth ──────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  is_verified: boolean;
  account_status?: string;
  preferred_language: Language;
  created_at: string;
}

export interface LandlordUser extends User {
  verification_status?: string;
  verification_date?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginRequest  { email: string; password: string; role?: UserRole; }
export interface RegisterRequest {
  email: string; password: string; full_name: string;
  phone?: string; role: UserRole;
}

// ── Property ─────────────────────────────────────────────────────────────

export interface PropertyImage {
  id: string;
  url: string;
  is_primary: boolean;
  caption?: string;
}

export interface PropertyVideo {
  id: string;
  url: string;
  caption?: string;
}

export interface Amenity {
  id: string;
  amenity_id?: string;
  name: string;
  category: AmenityCategory;
  distance_m: number | null;
  /** Backend field name alias */
  distance_from_property_m?: number | null;
  latitude: number;
  longitude: number;
  address?: string;
}

export interface Property {
  id: string;
  title: string;
  description?: string;
  type: PropertyType;
  status: PropertyStatus;
  municipality: Municipality;
  ward: Ward;
  street_address?: string;
  latitude: number;
  longitude: number;
  rooms: number;
  bathrooms: number;
  floor_area_sqm?: number;
  rent_amount: number;
  deposit_months: number;
  water_reliability: WaterReliability;
  electricity_config: ElectricityConfig;
  is_furnished: boolean;
  has_wifi: boolean;
  has_parking: boolean;
  images: PropertyImage[];
  videos?: PropertyVideo[];
  amenities: Amenity[];
  landlord_id: string;
  landlord_name?: string;
  landlord_phone?: string;
  /** Hostel capacity (number of beds/rooms) */
  capacity?: number;
  /** Maximum price for range-priced hostels */
  price_range_max?: number;
  /** Distance to university / reference point in km */
  distance_to_udsm_km?: number;
  /** Gender policy for hostels: 'girls', 'boys', 'mixed' */
  gender_policy?: "girls" | "boys" | "mixed";
  is_price_flagged: boolean;
  is_verified?: boolean;
  fair_price_estimate?: number;
  average_rating?: number;
  review_count: number;
  created_at: string;
  updated_at: string;
  /** Optional Google Maps share / place link for the property location */
  google_maps_url?: string;
}

/**
 * PropertySearchResult — shape returned by the spatial search endpoint.
 * Uses backend field names (base_rent_amount, structural_rooms, etc.)
 * The dark-theme map/results components use this type.
 */
export interface PropertySearchResult {
  property_id: string;
  title: string;
  ward: WardName;
  base_rent_amount: number;
  structural_rooms: number;
  distance_metres: number;
  is_price_flagged: boolean;
  flagged_fair_value?: number | null;
  longitude: number;
  latitude: number;
  water_reliability?: string;
  electricity_config?: string;
  is_furnished?: boolean;
  has_wifi?: boolean;
  amenities: Amenity[];
  /** Convenience alias so map pins can use .id */
  id?: string;
}

export interface PropertySearchParams {
  query?: string;
  municipality?: Municipality | "";
  ward?: Ward | "";
  type?: PropertyType | "";
  min_rent?: number;
  max_rent?: number;
  min_rooms?: number;
  is_furnished?: boolean;
  lat?: number;
  lng?: number;
  radius_m?: number;
  page?: number;
  limit?: number;
}

/** Spatial search params (chat/map layer) */
export interface SpatialSearchParams {
  target_lng: number;
  target_lat: number;
  radius_metres?: number;
  max_rent?: number;
  min_rooms?: number;
  ward?: WardName;
  limit?: number;
}

/** Spatial search response */
export interface SearchResponse {
  total_results: number;
  radius_metres: number;
  origin_lng: number;
  origin_lat: number;
  results: PropertySearchResult[];
}

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
  total_pages: number;
  current_page: number;
}

// ── Chat ──────────────────────────────────────────────────────────────────

export type IntentType =
  | "search_accommodation" | "predict_fair_price" | "view_amenities"
  | "get_info" | "unknown";

/**
 * ParsedIntent — two compatible shapes:
 * - Flat (legacy frontend mock): .ward, .max_budget
 * - Nested (backend + dark-theme layer): .geographical_bounds, .financial_constraints
 */
export interface GeographicalBounds {
  target_municipality: string;
  target_ward?: string | null;
}

export interface FinancialConstraints {
  max_budget_limit?: number | null;
  min_budget_limit?: number | null;
  currency_code: string;
}

export interface StructuralRequirements {
  property_type?: string | null;
  min_rooms?: number | null;
}

export interface ParsedIntent {
  parsed_intent: IntentType;
  // Backend nested shape
  geographical_bounds: GeographicalBounds;
  financial_constraints: FinancialConstraints;
  structural_requirements: StructuralRequirements;
  raw_normalized_text?: string;
  confidence: number;
  // Flat convenience aliases (populated from nested fields for legacy consumers)
  municipality?: string;
  ward?: string;
  max_budget?: number;
  min_budget?: number;
  property_type?: string;
  min_rooms?: number;
  language?: Language;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** ISO string or Date — normalise at the boundary */
  timestamp: Date | string;
  intent?: ParsedIntent | null;
}

/** Backend ConversationResponse shape */
export interface ConversationResponse {
  session_id: string;
  reply: string;
  parsed_intent?: ParsedIntent | null;
  action_triggered?: string | null;
}

// ── Reviews ───────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  property_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  rating: number;      // 1–5
  comment: string;
  moderation_status?: string;
  created_at: string;
}

// ── Payments ──────────────────────────────────────────────────────────────

export interface Payment {
  id: string;
  user_id: string;
  property_id?: string;
  type: PaymentType;
  amount: number;
  currency: string;
  status: PaymentStatus;
  mpesa_ref?: string;
  description: string;
  created_at: string;
}
export interface RentalApplication {
  id: string;
  seeker_id: string;
  property_id: string;
  application_status: string;
  move_in_date?: string;
  message?: string;
  applied_at: string;
}

export interface Appointment {
  id: string;
  seeker_id: string;
  property_id: string;
  appointment_date?: string;
  status: string;
  notes?: string;
  created_at: string;
}
// ── Price Prediction ──────────────────────────────────────────────────────

export interface PricePredictionRequest {
  municipality?: Municipality;
  ward: WardName;
  property_type?: PropertyType;
  rooms?: number;
  /** Backend field name */
  structural_rooms?: number;
  floor_area_sqm?: number;
  water_reliability: WaterReliability;
  electricity_config: ElectricityConfig;
  is_furnished: boolean;
  has_wifi: boolean;
  distance_to_transit_m: number;
}

export interface VarianceRange {
  minimum_fair_boundary: number;
  maximum_fair_boundary: number;
}

export interface PricePredictionResponse {
  // Backend field names
  estimated_fair_market_value: number;
  calculated_variance_range: VarianceRange;
  confidence_score_metric: number;
  ward: string;
  is_overpriced: boolean;
  overpriced_by_percent: number;
  // Frontend convenience aliases
  estimated_fair_value?: number;
  min_range?: number;
  max_range?: number;
  confidence?: number;
  overpriced_by_pct?: number;
}

// ── Admin ─────────────────────────────────────────────────────────────────

export interface AdminStats {
  total_users: number;
  total_properties: number;
  active_listings: number;
  total_revenue: number;
  pending_approvals: number;
  pending_landlord_verifications: number;
  fraud_reports: number;
  open_complaints: number;
  pending_reviews: number;
  users_by_month: { month: string; count: number }[];
  revenue_by_month: { month: string; amount: number }[];
  listings_by_municipality: { municipality: string; count: number }[];
  popular_wards: { ward: string; count: number }[];
}

export interface Complaint {
  id: string;
  complainant_id: string;
  property_id?: string;
  complaint_text?: string;
  status: string;
  resolved_by?: string;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  sent_by?: string;
  created_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price_tzs: number;
  billing_cycle: string;
  is_active: boolean;
}

export interface ReportSummary {
  total_users: number;
  total_properties: number;
  total_revenue: number;
  open_complaints: number;
  pending_reviews: number;
  generated_at: string;
}

export interface SystemSetting {
  id: number;
  setting_key: string;
  setting_value: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  entity_name?: string;
  entity_id?: string;
  ip_address?: string;
  created_at: string;
}

// ── Notification ──────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
  link?: string;
}

// ── Map ───────────────────────────────────────────────────────────────────

export interface MapPin {
  id: string;
  lat: number;
  lng: number;
  type: "property" | AmenityCategory;
  label: string;
  rent?: number;
  /** Canonical flag field — both spellings accepted for compatibility */
  is_flagged?: boolean;
  isFlagged?: boolean;
  property_type?: PropertyType;
}
