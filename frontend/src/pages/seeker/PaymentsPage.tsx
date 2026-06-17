import { useEffect, useState } from "react";
import { CreditCard, CheckCircle, Clock, XCircle, Smartphone } from "lucide-react";
import { paymentsApi } from "../../services/api";
import type { Payment } from "../../types";
import toast from "react-hot-toast";

const STATUS_META: Record<string, { icon: typeof CheckCircle; color: string; label: string }> = {
  completed: { icon: CheckCircle, color: "text-emerald-600 bg-emerald-50",  label: "Completed" },
  pending:   { icon: Clock,       color: "text-amber-600 bg-amber-50",       label: "Pending" },
  failed:    { icon: XCircle,     color: "text-maroon-600 bg-maroon-50",     label: "Failed" },
  refunded:  { icon: CheckCircle, color: "text-surface-500 bg-surface-100",  label: "Refunded" },
};

export default function PaymentsPage() {
  const [history, setHistory] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [mpesaForm, setMpesaForm] = useState({ amount: "", phone: "", desc: "" });
  const [paying, setPaying] = useState(false);

  useEffect(() => { paymentsApi.history().then(setHistory).finally(() => setLoading(false)); }, []);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mpesaForm.phone.match(/^(\+255|0)[67]\d{8}$/)) { toast.error("Enter a valid M-Pesa number."); return; }
    setPaying(true);
    try {
      const p = await paymentsApi.initiate(Number(mpesaForm.amount), mpesaForm.phone, mpesaForm.desc || "Payment");
      setHistory(prev => [p, ...prev]);
      setMpesaForm({ amount: "", phone: "", desc: "" });
      toast.success("M-Pesa request sent! Check your phone.");
    } catch { toast.error("Payment failed. Try again."); }
    finally { setPaying(false); }
  };

  const total = history.filter(p => p.status === "completed").reduce((s, p) => s + p.amount, 0);

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="bg-hero-gradient text-white py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold flex items-center gap-3"><CreditCard className="w-7 h-7" />Payments</h1>
          <div className="flex items-center gap-8 mt-5">
            <div>
              <p className="text-primary-200 text-xs">Total Paid</p>
              <p className="text-2xl font-bold">TZS {total.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-primary-200 text-xs">Transactions</p>
              <p className="text-2xl font-bold">{history.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 grid md:grid-cols-3 gap-8">
        {/* New payment */}
        <div className="md:col-span-1">
          <div className="card p-6">
            <h2 className="font-semibold text-surface-900 mb-4 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-primary-500" /> M-Pesa Payment
            </h2>
            <form onSubmit={handlePay} className="space-y-4">
              <div>
                <label className="label">Amount (TZS)</label>
                <input type="number" className="input" placeholder="150000" value={mpesaForm.amount}
                  onChange={e => setMpesaForm(f => ({ ...f, amount: e.target.value }))} required min={1000} />
              </div>
              <div>
                <label className="label">M-Pesa Number</label>
                <input className="input" placeholder="+255 7xx xxx xxx" value={mpesaForm.phone}
                  onChange={e => setMpesaForm(f => ({ ...f, phone: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Description</label>
                <input className="input" placeholder="Rent payment…" value={mpesaForm.desc}
                  onChange={e => setMpesaForm(f => ({ ...f, desc: e.target.value }))} />
              </div>
              <button type="submit" disabled={paying} className="btn-maroon w-full justify-center">
                {paying ? "Processing…" : "Pay via M-Pesa"}
              </button>
            </form>
            <p className="text-[10px] text-surface-400 mt-3 text-center">Payments are secured and encrypted.</p>
          </div>
        </div>

        {/* History */}
        <div className="md:col-span-2">
          <h2 className="font-semibold text-surface-900 mb-4">Transaction History</h2>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="card h-16 animate-pulse" />)}</div>
          ) : history.length === 0 ? (
            <div className="card p-10 text-center text-surface-500">No payment history yet.</div>
          ) : (
            <div className="space-y-3">
              {history.map(p => {
                const meta = STATUS_META[p.status] ?? STATUS_META.pending;
                return (
                  <div key={p.id} className="card p-4 flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                      <meta.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-surface-900 text-sm truncate">{p.description}</p>
                      <p className="text-xs text-surface-500">{new Date(p.created_at).toLocaleDateString()} {p.mpesa_ref && `· ${p.mpesa_ref}`}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-surface-900 text-sm">TZS {p.amount.toLocaleString()}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${meta.color}`}>{meta.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
