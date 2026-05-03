import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";

const plans = [
  {
    id: "premium_monthly",
    title: "Premium Monthly",
    price: "$29",
    period: "per month",
    description: "Full access to AI-powered threat insights, advanced reporting, and premium support.",
    badge: "Best for teams",
  },
  {
    id: "premium_yearly",
    title: "Premium Annual",
    price: "$299",
    period: "per year",
    description: "Annual billing with savings for longer-term protection and priority updates.",
    badge: "Save 15%",
  },
];

export default function Billing() {
  const [status, setStatus] = useState({ loading: false, message: "", error: "" });
  const publishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;

  const handleSubscribe = async (planId) => {
    if (!publishableKey) {
      setStatus({ loading: false, message: "", error: "Missing Stripe publishable key. Set REACT_APP_STRIPE_PUBLISHABLE_KEY in frontend .env." });
      return;
    }

    setStatus({ loading: true, message: "Creating Stripe checkout session…", error: "" });

    try {
      const stripe = await loadStripe(publishableKey);
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to create checkout session.");
      }

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId });
      if (error) {
        throw error;
      }
    } catch (error) {
      setStatus({ loading: false, message: "", error: error.message || "Checkout failed." });
    }
  };

  return (
    <div className="p-8 flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h2 className="text-white text-3xl font-bold">💳 Billing & Subscription</h2>
        <p className="text-slate-400 max-w-2xl">
          Upgrade CipherWatch to access premium protection, reporting, and priority support. Secure your organization with a subscription plan that includes ongoing threat monitoring and AI-powered analysis.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-slate-800 border border-slate-700 rounded-3xl p-6 shadow-xl shadow-slate-950/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-slate-400 uppercase tracking-[0.2em] text-xs">{plan.title}</p>
                <h3 className="text-white text-4xl font-bold mt-3">{plan.price}</h3>
                <p className="text-slate-500 mt-1 text-sm">{plan.period}</p>
              </div>
              <span className="rounded-full bg-cyan-500/15 text-cyan-300 px-3 py-1 text-xs font-semibold">{plan.badge}</span>
            </div>
            <p className="text-slate-300 leading-relaxed mb-6">{plan.description}</p>
            <button
              onClick={() => handleSubscribe(plan.id)}
              disabled={status.loading}
              className="w-full rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status.loading ? "Redirecting…" : "Subscribe now"}
            </button>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-700 bg-slate-800 p-5">
          <p className="text-slate-400 text-sm">Premium features</p>
          <ul className="mt-4 space-y-2 text-slate-200 text-sm">
            <li>• Unlimited premium threat scans</li>
            <li>• Dark web monitoring alerts</li>
            <li>• Advanced reporting dashboard</li>
            <li>• Priority customer support</li>
          </ul>
        </div>
        <div className="rounded-3xl border border-slate-700 bg-slate-800 p-5">
          <p className="text-slate-400 text-sm">Quick start</p>
          <ul className="mt-4 space-y-2 text-slate-200 text-sm">
            <li>• Add Stripe keys to backend and frontend</li>
            <li>• Click subscribe to create checkout</li>
            <li>• Complete payment securely on Stripe</li>
          </ul>
        </div>
        <div className="rounded-3xl border border-slate-700 bg-slate-800 p-5">
          <p className="text-slate-400 text-sm">Local setup</p>
          <ul className="mt-4 space-y-2 text-slate-200 text-sm">
            <li>• Backend: STRIPE_SECRET_KEY, STRIPE_PRICE_ID_*</li>
            <li>• Frontend: REACT_APP_STRIPE_PUBLISHABLE_KEY</li>
            <li>• Make sure server and client run locally</li>
          </ul>
        </div>
      </div>

      {status.message && <div className="rounded-2xl bg-slate-900 border border-slate-700 p-4 text-slate-100">{status.message}</div>}
      {status.error && <div className="rounded-2xl bg-rose-950 border border-rose-500 p-4 text-rose-200">{status.error}</div>}
    </div>
  );
}
