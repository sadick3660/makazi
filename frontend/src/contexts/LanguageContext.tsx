import { createContext, useContext, useState, type ReactNode } from "react";
import type { Language } from "../types";

type Translations = Record<string, string>;

const EN: Translations = {
  // Nav
  "nav.home": "Home", "nav.search": "Search", "nav.about": "About",
  "nav.contact": "Contact", "nav.login": "Sign In", "nav.register": "Get Started",
  "nav.dashboard": "Dashboard", "nav.logout": "Logout", "nav.chat": "AI Chat",
  "nav.favorites": "Favorites", "nav.profile": "Profile",
  // Hero
  "hero.title": "Find Your Perfect Home in Dar es Salaam",
  "hero.subtitle": "AI-powered accommodation search across all municipalities. Fair prices, zero broker exploitation.",
  "hero.cta": "Search Now", "hero.chat_cta": "Chat with AI",
  "hero.stats.listings": "Active Listings", "hero.stats.wards": "Wards Covered",
  "hero.stats.users": "Happy Renters",
  // Search
  "search.title": "Find Accommodation",
  "search.placeholder": "Search by location, type…",
  "search.municipality": "Municipality", "search.ward": "Ward",
  "search.type": "Property Type", "search.budget": "Max Budget (TZS)",
  "search.rooms": "Min Rooms", "search.btn": "Search",
  "search.all": "All", "search.results": "results found",
  // Property types
  "type.room": "Room", "type.house": "House", "type.hostel": "Hostel",
  "type.apartment": "Apartment",
  // Chat
  "chat.placeholder": "Ask me anything about accommodation…",
  "chat.send": "Send", "chat.welcome": "Welcome! How can I help you find a home today?",
  "chat.suggestion1": "I need a room in Mikocheni under 300,000 TZS",
  "chat.suggestion2": "Show hostels near IAA University",
  "chat.suggestion3": "Find houses close to public transport",
  "chat.suggestion4": "What is a fair price in Sinza?",
  // Auth
  "auth.email": "Email", "auth.password": "Password", "auth.name": "Full Name",
  "auth.phone": "Phone Number", "auth.login": "Sign In", "auth.register": "Create Account",
  "auth.forgot": "Forgot Password?", "auth.no_account": "Don't have an account?",
  "auth.has_account": "Already have an account?",
  "auth.role_seeker": "Looking for Accommodation",
  "auth.role_landlord": "I'm a Property Owner",
  // Common
  "common.loading": "Loading…", "common.save": "Save", "common.cancel": "Cancel",
  "common.edit": "Edit", "common.delete": "Delete", "common.view": "View",
  "common.per_month": "/ month", "common.rooms": "rooms",
  "common.furnished": "Furnished", "common.wifi": "WiFi",
  "common.water": "Water", "common.electricity": "Electricity",
  "common.verified": "Verified", "common.flagged": "Price Flagged",
  "common.submit": "Submit", "common.back": "Back",
  // Price
  "price.fair": "Fair Market Value", "price.estimate": "Price Estimate",
  "price.confidence": "Confidence", "price.inflated": "Possibly Inflated",
};

const SW: Translations = {
  // Nav
  "nav.home": "Nyumbani", "nav.search": "Tafuta", "nav.about": "Kuhusu",
  "nav.contact": "Wasiliana", "nav.login": "Ingia", "nav.register": "Jisajili",
  "nav.dashboard": "Dashibodi", "nav.logout": "Toka", "nav.chat": "Mazungumzo",
  "nav.favorites": "Vipendwa", "nav.profile": "Wasifu",
  // Hero
  "hero.title": "Pata Nyumba Yako Dar es Salaam",
  "hero.subtitle": "Tafuta makazi kwa AI katika manispaa zote. Bei halisi, bila dalali.",
  "hero.cta": "Tafuta Sasa", "hero.chat_cta": "Zungumza na AI",
  "hero.stats.listings": "Orodha Zinazopatikana", "hero.stats.wards": "Kata Zilizofunikwa",
  "hero.stats.users": "Wapangaji Waliofurahika",
  // Search
  "search.title": "Tafuta Makazi",
  "search.placeholder": "Tafuta kwa eneo, aina…",
  "search.municipality": "Manispaa", "search.ward": "Kata",
  "search.type": "Aina ya Mali", "search.budget": "Bajeti ya Juu (TZS)",
  "search.rooms": "Vyumba Vya Chini", "search.btn": "Tafuta",
  "search.all": "Zote", "search.results": "matokeo yamepatikana",
  // Property types
  "type.room": "Chumba", "type.house": "Nyumba", "type.hostel": "Hostel",
  "type.apartment": "Ghorofa",
  // Chat
  "chat.placeholder": "Niulize chochote kuhusu makazi…",
  "chat.send": "Tuma", "chat.welcome": "Karibu! Nawezaje kukusaidia kupata nyumba leo?",
  "chat.suggestion1": "Natafuta chumba Mikocheni chini ya 300,000 TZS",
  "chat.suggestion2": "Onyesha hostel karibu na IAA",
  "chat.suggestion3": "Nyumba karibu na usafiri wa umma",
  "chat.suggestion4": "Bei halisi ni nini Sinza?",
  // Auth
  "auth.email": "Barua Pepe", "auth.password": "Nywila", "auth.name": "Jina Kamili",
  "auth.phone": "Nambari ya Simu", "auth.login": "Ingia", "auth.register": "Fungua Akaunti",
  "auth.forgot": "Umesahau Nywila?", "auth.no_account": "Huna akaunti?",
  "auth.has_account": "Una akaunti?",
  "auth.role_seeker": "Natafuta Makazi",
  "auth.role_landlord": "Mimi ni Mmiliki wa Mali",
  // Common
  "common.loading": "Inapakia…", "common.save": "Hifadhi", "common.cancel": "Ghairi",
  "common.edit": "Hariri", "common.delete": "Futa", "common.view": "Tazama",
  "common.per_month": "/ mwezi", "common.rooms": "vyumba",
  "common.furnished": "Imefurnishwa", "common.wifi": "WiFi",
  "common.water": "Maji", "common.electricity": "Umeme",
  "common.verified": "Imethibitishwa", "common.flagged": "Bei Imewekwa Alama",
  "common.submit": "Wasilisha", "common.back": "Rudi",
  // Price
  "price.fair": "Thamani ya Soko", "price.estimate": "Makadirio ya Bei",
  "price.confidence": "Ujasiri", "price.inflated": "Labda Imepandishwa",
};

const TRANSLATIONS: Record<Language, Translations> = { en: EN, sw: SW };

interface LangContextValue {
  language: Language;
  setLanguage: (l: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const LangContext = createContext<LangContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem("nyumbalink_lang") as Language) ?? "en";
  });

  const setLang = (l: Language) => {
    setLanguage(l);
    localStorage.setItem("nyumbalink_lang", l);
  };

  const t = (key: string, fallback?: string) =>
    TRANSLATIONS[language][key] ?? fallback ?? key;

  return (
    <LangContext.Provider value={{ language, setLanguage: setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be inside LanguageProvider");
  return ctx;
}
