import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { Toaster } from "react-hot-toast";
import type { UserRole } from "./types";

// Layout shell
import PageShell from "./components/ui/PageShell";

// Public pages
import HomePage      from "./pages/public/HomePage";
import AboutPage     from "./pages/public/AboutPage";
import ContactPage   from "./pages/public/ContactPage";
import FaqPage       from "./pages/public/FaqPage";
import PrivacyPage   from "./pages/public/PrivacyPage";
import TermsPage     from "./pages/public/TermsPage";

// Auth pages (no navbar/footer)
import LoginPage          from "./pages/auth/LoginPage";
import RegisterPage       from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";

// Core pages
import SearchPage         from "./pages/SearchPage";
import PropertyDetailPage from "./pages/PropertyDetailPage";
import ChatPage           from "./pages/ChatPage";

// User pages
import SeekerDashboard from "./pages/seeker/SeekerDashboard";
import FavoritesPage   from "./pages/seeker/FavoritesPage";
import PaymentsPage    from "./pages/seeker/PaymentsPage";
import ProfilePage     from "./pages/ProfilePage";

// Landlord pages
import LandlordDashboard from "./pages/landlord/LandlordDashboard";
import AddPropertyPage   from "./pages/landlord/AddPropertyPage";
import EditPropertyPage  from "./pages/landlord/EditPropertyPage";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";

// Hostel pages
import HostelPage from "./pages/public/HostelPage";

// ── Route guards ──────────────────────────────────────────────────────────────

function RequireAuth({ children, role }: { children: React.ReactNode; role?: UserRole }) {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50">
      <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role && user?.role !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
}

// ── Wrapped page helper ───────────────────────────────────────────────────────

function Public({ children, hideFooter }: { children: React.ReactNode; hideFooter?: boolean }) {
  return <PageShell hideFooter={hideFooter}>{children}</PageShell>;
}

// ── App ───────────────────────────────────────────────────────────────────────

function AppRoutes() {
  return (
    <>
      <Routes>
        {/* Public */}
        <Route path="/"         element={<Public><HomePage /></Public>} />
        <Route path="/about"    element={<Public><AboutPage /></Public>} />
        <Route path="/contact"  element={<Public><ContactPage /></Public>} />
        <Route path="/faq"      element={<Public><FaqPage /></Public>} />
        <Route path="/privacy"  element={<Public><PrivacyPage /></Public>} />
        <Route path="/terms"    element={<Public><TermsPage /></Public>} />
        <Route path="/search"   element={<Public hideFooter><SearchPage /></Public>} />
        <Route path="/properties/:id" element={<Public><PropertyDetailPage /></Public>} />
        <Route path="/chat"     element={<Public hideFooter><ChatPage /></Public>} />
        <Route path="/hostels"  element={<Public><HostelPage /></Public>} />

        {/* Auth (no shell) */}
        <Route path="/login"           element={<LoginPage />} />
        <Route path="/register"        element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Seeker */}
        <Route path="/seeker/dashboard" element={<RequireAuth role="seeker"><Public hideFooter><SeekerDashboard /></Public></RequireAuth>} />
        <Route path="/favorites"        element={<RequireAuth><Public><FavoritesPage /></Public></RequireAuth>} />
        <Route path="/payments"         element={<RequireAuth><Public><PaymentsPage /></Public></RequireAuth>} />
        <Route path="/profile"          element={<RequireAuth><Public><ProfilePage /></Public></RequireAuth>} />

        {/* Landlord */}
        <Route path="/landlord/dashboard"         element={<RequireAuth role="landlord"><Public hideFooter><LandlordDashboard /></Public></RequireAuth>} />
        <Route path="/landlord/add-property"      element={<RequireAuth role="landlord"><Public><AddPropertyPage /></Public></RequireAuth>} />
        <Route path="/landlord/edit-property/:id" element={<RequireAuth role="landlord"><Public><EditPropertyPage /></Public></RequireAuth>} />

        {/* Admin */}
        <Route path="/admin/dashboard" element={<RequireAuth role="admin"><Public hideFooter><AdminDashboard /></Public></RequireAuth>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-right" toastOptions={{
        className: "!rounded-xl !shadow-card !text-sm !font-medium",
        success: { iconTheme: { primary: "#1B3A6B", secondary: "#fff" } },
        error:   { iconTheme: { primary: "#800020", secondary: "#fff" } },
      }} />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
