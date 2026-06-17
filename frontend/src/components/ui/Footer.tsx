import { Link } from "react-router-dom";
import { Home, Mail, Phone, MapPin, Facebook, Twitter, Instagram } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-primary-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-maroon-500 flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl"><span className="text-white">Nyumba</span><span className="text-maroon-400">Link</span></span>
            </div>
            <p className="text-surface-400 text-sm leading-relaxed mb-5">
              AI-powered accommodation search for Dar es Salaam. Fair prices, transparent listings, zero exploitation.
            </p>
            <div className="flex items-center gap-3">
              {[Facebook, Twitter, Instagram].map((Icon, i) => (
                <a key={i} href="https://www.facebook.com/sadic.mchora" className="w-8 h-8 rounded-lg bg-primary-800 hover:bg-maroon-600 flex items-center justify-center transition-colors">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wide text-surface-300 mb-4">Quick Links</h4>
            <ul className="space-y-2.5">
              {[["Home", "/"], ["Search Properties", "/search"], ["AI Chat", "/chat"], ["About Us", "/about"], ["Contact", "/contact"]].map(([label, to]) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-surface-400 hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Landlords */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wide text-surface-300 mb-4">For Landlords</h4>
            <ul className="space-y-2.5">
              {[["List Your Property", "/landlord/add-property"], ["Manage Listings", "/landlord/dashboard"], ["Pricing Guide", "/faq"], ["FAQ", "/faq"]].map(([label, to]) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-surface-400 hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wide text-surface-300 mb-4">Contact Us</h4>
            <div className="space-y-3">
              {[
                { Icon: MapPin, text: "Dar es Salaam, Tanzania" },
                { Icon: Phone, text: "+255653870753" },
                { Icon: Mail, text: "mnemosadick@gmail.com" },
              ].map(({ Icon, text }) => (
                <div key={text} className="flex items-center gap-2.5 text-sm text-surface-400">
                  <Icon className="w-4 h-4 text-maroon-400 flex-shrink-0" />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-primary-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-surface-500">© 2026 NyumbaLink. All rights reserved.</p>
          <div className="flex items-center gap-4">
            {[["Privacy Policy", "/privacy"], ["Terms of Service", "/terms"]].map(([label, to]) => (
              <Link key={to} to={to} className="text-xs text-surface-500 hover:text-white transition-colors">{label}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
