import { useState } from "react";
import { Mail, Phone, MapPin, Send, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setSent(true);
    setLoading(false);
    toast.success("Message sent! We'll reply within 24 hours.");
  };

  return (
    <div>
      <section className="bg-hero-gradient text-white py-20 text-center">
        <h1 className="text-4xl font-bold mb-3">Contact Us</h1>
        <p className="text-white/80 text-lg">We're here to help. Reach out any time.</p>
      </section>

      <section className="section bg-surface-50">
        <div className="container-lg">
          <div className="grid md:grid-cols-5 gap-10">
            {/* Info */}
            <div className="md:col-span-2 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-surface-900 mb-2">Get in Touch</h2>
                <p className="text-surface-500 text-sm">For inquiries about listings, partnerships, or technical support.</p>
              </div>
              {[
                { icon: MapPin, label: "Address", value: "Dar es Salaam, Tanzania" },
                { icon: Phone, label: "Phone", value: "+255 653 870 753" },
                { icon: Mail, label: "Email", value: "info@nyumbalink.co.tz" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide">{label}</p>
                    <p className="text-surface-800 text-sm mt-0.5">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Form */}
            <div className="md:col-span-3">
              {sent ? (
                <div className="card p-10 text-center">
                  <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-surface-900 mb-2">Message Sent!</h3>
                  <p className="text-surface-500 text-sm">We'll get back to you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="card p-8 space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="label">Full Name</label>
                      <input className="input" placeholder="John Doe" value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="label">Email</label>
                      <input type="email" className="input" placeholder="you@example.com" value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                    </div>
                  </div>
                  <div>
                    <label className="label">Subject</label>
                    <input className="input" placeholder="How can we help?" value={form.subject}
                      onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="label">Message</label>
                    <textarea rows={5} className="input resize-none" placeholder="Write your message here…" value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))} required />
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full">
                    <Send className="w-4 h-4" /> {loading ? "Sending…" : "Send Message"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
