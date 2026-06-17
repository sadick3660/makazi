import { Shield } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-surface-50">
      <div className="bg-hero-gradient text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Privacy Policy</h1>
          <p className="text-white/70 text-sm">Last updated: June 2026</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12 prose prose-surface">
        <div className="card p-8 space-y-6 text-sm text-surface-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-surface-900 mb-3">1. Information We Collect</h2>
            <p>When you use NyumbaLink, we may collect the following information:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Account information: name, email address, phone number, and role (renter or landlord)</li>
              <li>For landlords: National ID / NIDA number for identity verification</li>
              <li>Property listings you create, including location coordinates</li>
              <li>Chat messages and search queries you submit to our AI assistant</li>
              <li>Payment records for M-Pesa transactions</li>
              <li>Usage data: pages visited, features used, device type</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-surface-900 mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide and improve our accommodation search services</li>
              <li>To verify landlord identities and detect fraudulent listings</li>
              <li>To process M-Pesa payments securely</li>
              <li>To train and improve our fair-price ML models (anonymised data only)</li>
              <li>To send important service notifications (not marketing without consent)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-surface-900 mb-3">3. Data Sharing</h2>
            <p>
              We do <strong>not</strong> sell your personal information to third parties.
              We may share data with:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>M-Pesa / Vodacom Tanzania for payment processing</li>
              <li>Cloud hosting providers (data stored in East Africa data centres)</li>
              <li>Tanzanian regulatory authorities when legally required</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-surface-900 mb-3">4. Data Security</h2>
            <p>
              All passwords are hashed using bcrypt. Data in transit is encrypted via HTTPS/TLS.
              Access tokens expire after 24 hours. We conduct regular security reviews.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-surface-900 mb-3">5. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and associated data</li>
              <li>Withdraw consent for marketing communications</li>
            </ul>
            <p className="mt-2">
              To exercise these rights, contact us at <a href="mailto:privacy@nyumbalink.co.tz" className="text-primary-600 hover:underline">privacy@nyumbalink.co.tz</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-surface-900 mb-3">6. Cookies</h2>
            <p>
              We use only essential cookies for session management and authentication.
              We do not use advertising or tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-surface-900 mb-3">7. Changes to This Policy</h2>
            <p>
              We may update this policy periodically. We will notify registered users via email
              of any material changes. Continued use of the service constitutes acceptance of
              the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-surface-900 mb-3">8. Contact</h2>
            <p>
              NyumbaLink, Dar es Salaam, Tanzania<br />
              Email: <a href="mailto:privacy@nyumbalink.co.tz" className="text-primary-600 hover:underline">privacy@nyumbalink.co.tz</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
