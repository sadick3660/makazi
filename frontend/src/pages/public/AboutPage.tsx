import { Shield, Users, TrendingUp, MapPin, Award, Globe } from "lucide-react";

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-hero-gradient text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-5">About NyumbaLink</h1>
          <p className="text-lg text-white/80 leading-relaxed">
            We're on a mission to make finding accommodation in Dar es Salaam fair, transparent, and accessible to everyone — powered by AI.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="section bg-white">
        <div className="container-lg">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="badge-maroon mb-4">Our Mission</span>
              <h2 className="text-3xl font-bold text-surface-900 mb-5">Ending Exploitation in Housing</h2>
              <p className="text-surface-600 leading-relaxed mb-4">
                Informal brokers (dalalis) in Dar es Salaam routinely inflate rental prices, taking advantage of housing seekers who lack market information. NyumbaLink changes that.
              </p>
              <p className="text-surface-600 leading-relaxed mb-6">
                Our AI-powered platform gives every renter access to real market prices, verified listings, and intelligent recommendations — eliminating the information asymmetry that dalalis exploit.
              </p>
              <div className="space-y-3">
                {["Fair price detection using Machine Learning", "Verified landlord listings only", "AI chatbot in Swahili and English", "Full municipality coverage across DSM"].map(i => (
                  <div key={i} className="flex items-center gap-2.5 text-sm text-surface-700">
                    <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-primary-500" />
                    </div>
                    {i}
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Shield, color: "bg-primary-100 text-primary-600", title: "Anti-Fraud AI", desc: "Flags inflated listings automatically" },
                { icon: Globe, color: "bg-maroon-100 text-maroon-600", title: "Bilingual", desc: "Full Swahili & English support" },
                { icon: MapPin, color: "bg-emerald-100 text-emerald-600", title: "5 Municipalities", desc: "All of Dar es Salaam covered" },
                { icon: TrendingUp, color: "bg-amber-100 text-amber-600", title: "ML Pricing", desc: "Random Forest price models" },
              ].map(f => (
                <div key={f.title} className="card p-5">
                  <div className={`w-10 h-10 ${f.color} rounded-xl flex items-center justify-center mb-3`}>
                    <f.icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-semibold text-surface-900 text-sm mb-1">{f.title}</h4>
                  <p className="text-xs text-surface-500">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section bg-surface-50">
        <div className="container-lg text-center">
          <h2 className="section-title">Our Team</h2>
          <p className="section-subtitle mx-auto">Built by engineers passionate about solving housing access challenges in Dar es Salaam.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
            {[
              { name: "Salim Sadick Mnemo", role: "CEO & Co-Founder", emoji: "👨🏾‍💻" },
              { name: "Fatma Abdul", role: "CTO", emoji: "👩🏾" },
              { name: "Adiliano Sindobewe", role: "AI Engineer", emoji: "👨🏾‍💻" },
              { name: "Diana Juma", role: "Product Designer", emoji: "👩🏾" },
            ].map(m => (
              <div key={m.name} className="card p-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center text-3xl mx-auto mb-3">{m.emoji}</div>
                <h4 className="font-semibold text-surface-900 text-sm">{m.name}</h4>
                <p className="text-xs text-surface-500 mt-0.5">{m.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section bg-primary-500 text-white">
        <div className="container-xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { value: "287+", label: "Active Listings" },
              { value: "1,248", label: "Registered Users" },
              { value: "5", label: "Municipalities" },
              { value: "98%", label: "User Satisfaction" },
            ].map(s => (
              <div key={s.label}>
                <p className="text-4xl font-bold mb-2">{s.value}</p>
                <p className="text-primary-200 text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
