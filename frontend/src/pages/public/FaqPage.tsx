import { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";

const FAQS = [
  {
    category: "For Renters",
    items: [
      {
        q: "Is NyumbaLink free to use?",
        a: "Yes! Searching, browsing listings, and chatting with the AI is completely free for renters. There are no hidden fees or broker commissions.",
      },
      {
        q: "How does the AI chatbot work?",
        a: "Our AI assistant understands both Swahili and English. Simply describe what you're looking for — ward, budget, number of rooms — and it will instantly show matching properties on the map.",
      },
      {
        q: "What is the Fair Price Estimator?",
        a: "It's an XGBoost machine learning model trained on Kinondoni rental data. It estimates a fair market value for any property based on location, utilities, and amenities — helping you spot overpriced dalali listings.",
      },
      {
        q: "How do I contact a landlord?",
        a: "Each listing shows the landlord's phone number. You can call or WhatsApp them directly. No broker middlemen involved.",
      },
      {
        q: "Are all listings verified?",
        a: "Landlords go through an identity verification process using their NIDA national ID. Listings suspected of price inflation are automatically flagged by our ML engine.",
      },
    ],
  },
  {
    category: "For Landlords",
    items: [
      {
        q: "How do I list my property?",
        a: "Register as a landlord, then go to your dashboard and click 'Add Listing'. You'll fill in property details, location, utilities, and photos in a simple 4-step form.",
      },
      {
        q: "Is listing my property free?",
        a: "Basic listings are free. Premium promotion features (appearing at the top of search results) are available for a small fee paid via M-Pesa.",
      },
      {
        q: "Why was my listing flagged?",
        a: "Our ML price engine compares your listed rent against the estimated fair market value for similar properties in the same ward. If your price is more than 10% above the estimate, the listing gets flagged. You can request a review if you believe this is incorrect.",
      },
      {
        q: "Can I edit or remove my listing?",
        a: "Yes. From your landlord dashboard, you can edit any listing details or mark it as rented/unavailable at any time.",
      },
    ],
  },
  {
    category: "Technical",
    items: [
      {
        q: "What areas does NyumbaLink cover?",
        a: "Currently we cover all 5 municipalities of Dar es Salaam: Kinondoni, Ilala, Ubungo, Temeke, and Kigamboni, with a focus on Kinondoni wards.",
      },
      {
        q: "How do I pay via M-Pesa?",
        a: "When booking a property or purchasing a promotion, you'll be prompted to enter your M-Pesa number. A push notification will be sent to your phone to confirm the payment.",
      },
      {
        q: "Is my data safe?",
        a: "Yes. We use industry-standard encryption for all data. Passwords are hashed with bcrypt and we never share your personal information with third parties.",
      },
    ],
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-surface-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-surface-50 transition-colors"
        aria-expanded={open}
      >
        <span className="font-medium text-surface-900 text-sm pr-4">{q}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-primary-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-surface-400 flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-surface-600 leading-relaxed border-t border-surface-100 pt-3">
          {a}
        </div>
      )}
    </div>
  );
}

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-surface-50">
      {/* Hero */}
      <div className="bg-hero-gradient text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Frequently Asked Questions</h1>
          <p className="text-white/80 text-lg">
            Everything you need to know about NyumbaLink.
          </p>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        {FAQS.map(section => (
          <div key={section.category} className="mb-10">
            <h2 className="text-lg font-bold text-surface-900 mb-4 pb-2 border-b border-surface-200">
              {section.category}
            </h2>
            <div className="space-y-3">
              {section.items.map(item => (
                <FaqItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        ))}

        {/* Still have questions */}
        <div className="bg-primary-50 border border-primary-100 rounded-2xl p-6 text-center mt-8">
          <h3 className="font-semibold text-primary-900 mb-2">Still have questions?</h3>
          <p className="text-sm text-primary-700 mb-4">
            Our support team is available Monday–Friday, 8am–6pm EAT.
          </p>
          <a href="/contact" className="btn-primary">
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
