import { useState } from "react";
import { Link } from "react-router-dom";
import { Home, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { authApi } from "../../services/api";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch {
      toast.error("Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Home className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">
            Nyumba<span className="text-maroon-300">Link</span>
          </span>
        </Link>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold text-surface-900 mb-2">Check your email</h2>
              <p className="text-surface-500 text-sm mb-6">
                We've sent a password reset link to <strong>{email}</strong>. Check your inbox and follow the instructions.
              </p>
              <Link to="/login" className="btn-primary w-full justify-center">
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-6 h-6 text-primary-600" />
                </div>
                <h2 className="text-xl font-bold text-surface-900">Forgot Password?</h2>
                <p className="text-surface-500 text-sm mt-1">
                  Enter your email and we'll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="btn-primary w-full justify-center disabled:opacity-50"
                >
                  {loading ? "Sending…" : "Send Reset Link"}
                </button>
              </form>

              <div className="mt-5 text-center">
                <Link to="/login" className="flex items-center justify-center gap-1.5 text-sm text-surface-500 hover:text-primary-600 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
