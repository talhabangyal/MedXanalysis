"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { apiClient } from "@/lib/api-client";

const currencyRates = {
  USD: 1,
  PKR: 280,
  EUR: 0.92,
  GBP: 0.78,
};

const currencySymbols = {
  USD: "$",
  PKR: "Rs ",
  EUR: "€",
  GBP: "£",
};

export default function ClientSubscriptionPage() {
  const [user, setUser] = useState(null);
  const [plans, setPlans] = useState([]);
  const [activeSub, setActiveSub] = useState(null);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [switchingPlanId, setSwitchingPlanId] = useState(null);

  const loadSubscriptionData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [plans, active] = await Promise.all([
        apiClient.admin.getSubscriptions(),
        apiClient.client.getActiveSubscription(user.id)
      ]);
      const parsedPlans = (plans || []).map((plan) => {
        let metadata = { planType: "individual", tags: [], details: [] };

        if (typeof plan.features === "string") {
          try {
            const parsed = JSON.parse(plan.features);
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
              metadata = {
                planType: parsed.planType || parsed.type || "individual",
                tags: Array.isArray(parsed.tags) ? parsed.tags : [],
                details: Array.isArray(parsed.details) ? parsed.details : [],
              };
            } else if (Array.isArray(parsed)) {
              metadata = { planType: "individual", tags: [], details: parsed };
            }
          } catch {
            metadata = {
              planType: "individual",
              tags: [],
              details: plan.features.split(",").map((item) => item.trim()).filter(Boolean),
            };
          }
        }

        return {
          id: plan.id,
          planName: plan.planName || plan.plan_name,
          monthlyPrice: Number(plan.monthlyPrice || plan.monthly_price || 0),
          yearlyPrice: Number(plan.yearlyPrice || plan.yearly_price || 0),
          monthlyDiscount: Number(plan.monthlyDiscount || plan.monthly_discount || 0),
          yearlyDiscount: Number(plan.yearlyDiscount || plan.yearly_discount || 0),
          ...metadata,
        };
      }).filter((plan) => plan.planType === "individual");

      setPlans(parsedPlans || []);
      setActiveSub(active || null);
    } catch (err) {
      console.error("Failed to load subscription data:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const fromStorage = typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "null")
      : null;
    if (fromStorage) {
      queueMicrotask(() => {
        setUser(fromStorage);
      });
    } else {
      queueMicrotask(() => {
        setLoading(false);
      });
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      queueMicrotask(() => {
        loadSubscriptionData();
      });
    }
  }, [loadSubscriptionData, user]);

  const currentPlan = useMemo(() => activeSub?.subscription || { planName: "Free" }, [activeSub]);

  function getPrice(plan) {
    if (plan.planName === "Free") return 0;
    const amount = billingCycle === "yearly" ? (plan.yearlyPrice || 0) : (plan.monthlyPrice || 0);
    return amount * (currencyRates[currency] || 1);
  }

  function convertPriceLabel(value) {
    if (!value || value === 0) return "Free";
    return `${currencySymbols[currency] || "$"}${Number(value).toLocaleString(undefined, {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    })}`;
  }

  function getPlanFeatures(plan) {
    if (!plan?.features) return [];

    if (Array.isArray(plan.features)) return plan.features;

    if (typeof plan.features === "string") {
      try {
        const parsed = JSON.parse(plan.features);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          return Array.isArray(parsed.details) ? parsed.details : [];
        }

        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return plan.features
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }
    }

    if (typeof plan.features === "object") {
      return Array.isArray(plan.features.details) ? plan.features.details : [];
    }

    return [];
  }

  async function switchPlan(planId) {
    if (!user) return;
    setSwitchingPlanId(planId);
    setStatusMessage("");
    
    try {
      const selectedPlan = plans.find(p => p.id === planId);
      const isFreeDowngrade = selectedPlan?.planName === "Free";
      
      let endDate = null;
      if (!isFreeDowngrade) {
        endDate = new Date();
        endDate.setDate(endDate.getDate() + (billingCycle === "yearly" ? 365 : 30));
      }

      await apiClient.client.updateSubscription({
        user_id: user.id,
        subscription_id: planId,
        status: "active",
        start_date: new Date().toISOString(),
        end_date: endDate ? endDate.toISOString() : null,
        is_free_plan: isFreeDowngrade,
      });

      const planName = selectedPlan?.planName || "Plan";
      const actionText = isFreeDowngrade ? "downgraded" : "upgraded";
      
      await apiClient.client.createActivity({
        user_id: user.id,
        action: "subscription_change",
        description: `${actionText === "downgraded" ? "Downgraded" : "Upgraded"} subscription to ${planName}`,
        source: "client",
      });

      setStatusMessage(`✓ Successfully ${actionText} to ${planName}!`);
      setTimeout(() => loadSubscriptionData(), 1000);
    } catch (err) {
      console.error("Switch plan failed:", err);
      setStatusMessage("✗ Error updating plan. Please try again.");
    } finally {
      setSwitchingPlanId(null);
    }
  }

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white">Subscription Plans</h1>
        <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">Choose the perfect plan for your needs</p>
      </div>

      {statusMessage && (
        <div className={`rounded-2xl border px-6 py-4 font-semibold transition-all ${
          statusMessage.startsWith('✓')
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
            : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300'
        }`}>
          {statusMessage}
        </div>
      )}

      {loading && !plans.length ? (
        <div className="flex h-40 items-center justify-center">
          <Icon icon="eos-icons:loading" width={40} className="animate-spin text-blue-600 dark:text-cyan-400" />
        </div>
      ) : (
        <>
          {/* Current Plan Section */}
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-linear-to-br from-blue-50 to-blue-100/50 shadow-sm dark:border-slate-800 dark:from-blue-950/30 dark:to-blue-900/20">
            <div className="flex flex-col gap-6 p-8 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Currently Active</p>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white">{currentPlan.planName || "Free"}</h2>
                {activeSub && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Valid until {!activeSub.endDate ? "Lifetime" : new Date(activeSub.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
              </div>

              <div className="h-px w-full bg-linear-to-r from-blue-200 to-transparent sm:h-16 sm:w-px dark:from-blue-800" />

              <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => setBillingCycle("monthly")}
                  className={`rounded-xl px-6 py-2.5 text-sm font-bold transition ${
                    billingCycle === "monthly"
                      ? "bg-blue-600 text-white shadow-md dark:bg-cyan-400 dark:text-slate-950"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle("yearly")}
                  className={`rounded-xl px-6 py-2.5 text-sm font-bold transition ${
                    billingCycle === "yearly"
                      ? "bg-blue-600 text-white shadow-md dark:bg-cyan-400 dark:text-slate-950"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  Yearly <span className="ml-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">(Save 20%)</span>
                </button>
              </div>

              <div className="relative inline-flex rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="h-11 appearance-none rounded-xl bg-transparent px-4 pr-10 text-sm font-bold outline-none"
                >
                  <option value="USD">USD</option>
                  <option value="PKR">PKR</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
                <Icon icon="solar:alt-arrow-down-linear" width={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-300" />
              </div>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => {
              const isCurrent = plan.id === activeSub?.subscriptionId || (plan.planName === "Free" && !activeSub);
              const features = getPlanFeatures(plan);
              const basePrice = getPrice(plan);
              const discountPercent = billingCycle === "yearly" ? (plan.yearlyDiscount || 0) : (plan.monthlyDiscount || 0);
              const discountedPrice = basePrice - (basePrice * discountPercent / 100);
              const price = discountPercent > 0 ? discountedPrice : basePrice;
              const isPopular = plan.planName === "Professional";

              return (
                <article
                  key={plan.id}
                  className={`group relative flex flex-col overflow-hidden rounded-3xl border transition-all duration-300 ${
                    isCurrent
                      ? "border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20 dark:border-cyan-400 dark:bg-cyan-500/10 dark:ring-cyan-400/20"
                      : isPopular
                      ? "border-slate-200 bg-white hover:border-blue-400 hover:shadow-xl dark:border-slate-800 dark:bg-slate-950/70 dark:hover:border-cyan-500/50"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950/70"
                  }`}
                >
                  {discountPercent > 0 && (
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-b-lg bg-red-500 px-4 py-1 text-[11px] font-black uppercase tracking-widest text-white">
                      <Icon icon="solar:fire-linear" width={12} />
                      Save {discountPercent}%
                    </div>
                  )}

                  {isPopular && !isCurrent && !discountPercent && (
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-linear-to-r from-blue-600 to-cyan-500 px-4 py-1 text-[11px] font-black uppercase tracking-widest text-white">
                      ⭐ Most Popular
                    </div>
                  )}

                  {isCurrent && (
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 rounded-b-lg bg-emerald-500 px-4 py-1 text-[11px] font-black uppercase tracking-widest text-white dark:bg-emerald-400 dark:text-slate-950">
                      ✓ Active Plan
                    </div>
                  )}

                  <div className="space-y-6 p-8">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white">{plan.planName}</h3>
                      {plan.description && (
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{plan.description}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black text-slate-900 dark:text-white">{convertPriceLabel(price)}</span>
                        {discountPercent > 0 && (
                          <span className="text-sm font-semibold text-slate-400 line-through">{convertPriceLabel(basePrice)}</span>
                        )}
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">/{billingCycle === "yearly" ? "year" : "month"}</span>
                      </div>
                      {billingCycle === "yearly" && price > 0 && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                          Save {convertPriceLabel(Math.round((price / 12) * 2.4))}/month vs monthly
                        </p>
                      )}
                    </div>

                    <ul className="space-y-3">
                      {features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                          <Icon icon="solar:check-circle-bold" className="mt-0.5 shrink-0 text-emerald-500" width={18} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-auto border-t border-slate-200 p-8 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => switchPlan(plan.id)}
                      disabled={isCurrent || switchingPlanId !== null}
                      className={`w-full rounded-2xl py-4 font-black text-sm uppercase tracking-wider transition-all ${
                        isCurrent
                          ? "bg-slate-100 text-slate-400 cursor-default dark:bg-slate-900 dark:text-slate-600"
                          : "bg-blue-600 text-white hover:-translate-y-1 hover:shadow-lg dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300 disabled:opacity-70"
                      }`}
                    >
                      {switchingPlanId === plan.id ? (
                        <Icon icon="eos-icons:loading" className="inline mr-2 animate-spin" width={16} />
                      ) : isCurrent ? (
                        "Current Plan"
                      ) : (
                        `${plan.planName === "Free" ? "Switch to Free" : "Upgrade Now"}`
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {/* FAQ Section */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Frequently Asked Questions</h3>
            <div className="mt-6 space-y-4">
              <details className="group rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                <summary className="flex cursor-pointer items-center justify-between font-semibold text-slate-900 dark:text-white">
                  Can I change my plan anytime?
                  <Icon icon="solar:alt-arrow-down-linear" className="transition group-open:rotate-180" width={20} />
                </summary>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
              </details>
              <details className="group rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                <summary className="flex cursor-pointer items-center justify-between font-semibold text-slate-900 dark:text-white">
                  What payment methods do you accept?
                  <Icon icon="solar:alt-arrow-down-linear" className="transition group-open:rotate-180" width={20} />
                </summary>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">We accept all major credit cards, debit cards, and digital payment methods.</p>
              </details>
              <details className="group rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                <summary className="flex cursor-pointer items-center justify-between font-semibold text-slate-900 dark:text-white">
                  Is there a free trial available?
                  <Icon icon="solar:alt-arrow-down-linear" className="transition group-open:rotate-180" width={20} />
                </summary>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">Yes! Start with our Free plan and upgrade anytime to access premium features.</p>
              </details>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

