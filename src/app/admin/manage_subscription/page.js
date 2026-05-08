"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { apiClient } from "@/lib/api-client";
// Database operations use API calls instead


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

function parseCommaList(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parsePackageFeatures(features) {
  if (!features) {
    return { planType: "individual", tags: [], details: [] };
  }

  if (typeof features === "string") {
    try {
      const parsed = JSON.parse(features);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return {
          planType: parsed.planType || parsed.type || "individual",
          tags: Array.isArray(parsed.tags) ? parsed.tags : parseCommaList(String(parsed.tags || "")),
          details: Array.isArray(parsed.details) ? parsed.details : parseCommaList(String(parsed.details || "")),
        };
      }

      if (Array.isArray(parsed)) {
        return { planType: "individual", tags: [], details: parsed };
      }
    } catch {
      return { planType: "individual", tags: [], details: parseCommaList(features) };
    }
  }

  if (Array.isArray(features)) {
    return { planType: "individual", tags: [], details: features };
  }

  if (typeof features === "object") {
    return {
      planType: features.planType || features.type || "individual",
      tags: Array.isArray(features.tags) ? features.tags : [],
      details: Array.isArray(features.details) ? features.details : [],
    };
  }

  return { planType: "individual", tags: [], details: [] };
}

export default function AdminManageSubscriptionPage() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("create");
  const [plans, setPlans] = useState([]);
  const [, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [savingPlan, setSavingPlan] = useState(false);
  const [currency, setCurrency] = useState("USD");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successPackageName, setSuccessPackageName] = useState("");
  const [form, setForm] = useState({
    planType: "enterprise",
    planName: "",
    monthlyPrice: "",
    yearlyPrice: "",
    monthlyDiscount: "",
    yearlyDiscount: "",
    tags: "",
    details: "",
  });

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.admin.getSubscriptions();
      setPlans((data || []).map((p) => ({
        id: p.id,
        ...parsePackageFeatures(p.features),
        name: p.planName || p.plan_name,
        monthlyPriceUsd: Number(p.monthlyPrice || p.monthly_price || 0),
        yearlyPriceUsd: Number(p.yearlyPrice || p.yearly_price || 0),
        monthlyDiscountUsd: Number(p.monthlyDiscount || p.monthly_discount || 0),
        yearlyDiscountUsd: Number(p.yearlyDiscount || p.yearly_discount || 0),
        features: parsePackageFeatures(p.features).details,
      })) || []);
    } catch (err) {
      console.error("Failed to load plans:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const convertPrice = (value) => {
    const amount = Number(value || 0) * (currencyRates[currency] || 1);
    if (!amount) return "Free";
    return `${currencySymbols[currency] || "$"}${amount.toLocaleString(undefined, {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    })}`;
  };

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
        loadPlans();
      });
    }
  }, [loadPlans, user]);

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const openEditPlan = (plan) => {
    setEditingPlanId(plan.id);
    setActiveTab("create");
    setForm({
      planType: plan.planType || "individual",
      planName: plan.name || "",
      monthlyPrice: String(plan.monthlyPriceUsd || 0),
      yearlyPrice: String(plan.yearlyPriceUsd || 0),
      monthlyDiscount: String(plan.monthlyDiscountUsd || 0),
      yearlyDiscount: String(plan.yearlyDiscountUsd || 0),
      tags: (plan.tags || []).join(", "),
      details: (plan.features || []).join(", "),
    });
  };

  const resetForm = () => {
    setEditingPlanId(null);
    setForm({
      planType: "enterprise",
      planName: "",
      monthlyPrice: "",
      yearlyPrice: "",
      monthlyDiscount: "",
      yearlyDiscount: "",
      tags: "",
      details: "",
    });
  };

  const handleCreatePlan = async () => {
    if (!user?.id) return;

    if (!form.planName.trim()) {
      alert("Plan name is required.");
      return;
    }

    if (!form.monthlyPrice && !form.yearlyPrice) {
      alert("Please enter at least one price.");
      return;
    }

    setCreating(true);
    setSavingPlan(Boolean(editingPlanId));
    try {
      const payload = {
        plan_name: form.planName.trim(),
        monthly_price: Number(form.monthlyPrice || 0),
        yearly_price: Number(form.yearlyPrice || 0),
        monthly_discount: Number(form.monthlyDiscount || 0),
        yearly_discount: Number(form.yearlyDiscount || 0),
        features: JSON.stringify({
          planType: form.planType,
          tags: parseCommaList(form.tags),
          details: parseCommaList(form.details),
        }),
      };

      if (editingPlanId) {
        await apiClient.admin.updateSubscriptionPlan(editingPlanId, payload);
      } else {
        await apiClient.admin.createSubscriptionPlan(payload);
      }

      await apiClient.admin.createActivity({
        user_id: user.id,
        action: editingPlanId ? "update_subscription_plan" : "create_subscription_plan",
        description: `${editingPlanId ? "Updated" : "Created"} subscription package: ${form.planName.trim()}`,
        source: "admin",
      });

      resetForm();
      setActiveTab("view");
      await loadPlans();
      setSuccessPackageName(form.planName.trim());
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 3000);
    } catch (err) {
      console.error("Failed to create subscription plan:", err);
      alert(editingPlanId ? "Failed to update subscription package." : "Failed to create subscription package.");
    } finally {
      setCreating(false);
      setSavingPlan(false);
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manage Subscription</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">Create new plans or view existing subscriptions.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => setActiveTab("create")} className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${activeTab === "create" ? "bg-blue-600 text-white dark:bg-cyan-400 dark:text-slate-950" : "border border-slate-200 bg-white text-slate-700 hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:text-cyan-300"}`}>
          <Icon icon="solar:add-circle-linear" width={18} />
          Create New Subscription
        </button>

        <button type="button" onClick={() => setActiveTab("view")} className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${activeTab === "view" ? "bg-blue-600 text-white dark:bg-cyan-400 dark:text-slate-950" : "border border-slate-200 bg-white text-slate-700 hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:text-cyan-300"}`}>
          <Icon icon="solar:eye-linear" width={18} />
          View Subscription
        </button>

        <div className="relative ml-auto">
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="h-11 appearance-none rounded-full border border-slate-200 bg-white px-4 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="USD">USD</option>
            <option value="PKR">PKR</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
          <Icon icon="solar:alt-arrow-down-linear" width={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-300" />
        </div>
      </div>

      {activeTab === "create" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
          <h2 className="mb-5 text-xl font-semibold">{editingPlanId ? "Edit Subscription Package" : "Add Subscription Package"}</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Package Type</label>
              <select
                value={form.planType}
                onChange={(e) => handleFormChange("planType", e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-transparent px-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:focus:border-cyan-400"
              >
                <option value="enterprise">Enterprise</option>
                <option value="individual">Individual</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Plan Name</label>
              <input
                type="text"
                value={form.planName}
                onChange={(e) => handleFormChange("planName", e.target.value)}
                placeholder="Starter, Basic, Premium..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-transparent px-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:focus:border-cyan-400"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Monthly Price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.monthlyPrice}
                onChange={(e) => handleFormChange("monthlyPrice", e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-transparent px-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:focus:border-cyan-400"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Yearly Price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.yearlyPrice}
                onChange={(e) => handleFormChange("yearlyPrice", e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-transparent px-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:focus:border-cyan-400"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Monthly Discount (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={form.monthlyDiscount}
                onChange={(e) => handleFormChange("monthlyDiscount", e.target.value)}
                placeholder="e.g., 10 for 10% off"
                className="h-11 w-full rounded-xl border border-slate-200 bg-transparent px-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:focus:border-cyan-400"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">Enter percentage (0-100)</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Yearly Discount (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={form.yearlyDiscount}
                onChange={(e) => handleFormChange("yearlyDiscount", e.target.value)}
                placeholder="e.g., 20 for 20% off"
                className="h-11 w-full rounded-xl border border-slate-200 bg-transparent px-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:focus:border-cyan-400"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">Enter percentage (0-100)</p>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Tags</label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => handleFormChange("tags", e.target.value)}
                placeholder="popular, recommended, best-value"
                className="h-11 w-full rounded-xl border border-slate-200 bg-transparent px-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:focus:border-cyan-400"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">Separate tags with commas.</p>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Package Details</label>
              <textarea
                rows={5}
                value={form.details}
                onChange={(e) => handleFormChange("details", e.target.value)}
                placeholder="AI Interpretation, Email Report Delivery, Unlimited WhatsApp Report"
                className="w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:focus:border-cyan-400"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">Write each point separated by commas. These will show as bullet points on the home page pricing cards.</p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={handleCreatePlan}
              disabled={creating || savingPlan}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
            >
              <Icon icon="solar:add-circle-linear" width={18} />
              {savingPlan ? "Saving..." : editingPlanId ? "Update Package" : "Create Package"}
            </button>
            {editingPlanId && (
              <button
                type="button"
                onClick={resetForm}
                className="ml-3 inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 dark:border-slate-700 dark:text-slate-200"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </div>
      )}

      {activeTab === "view" && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-semibold">Plan</th>
                  <th className="px-6 py-4 font-semibold">Type</th>
                  <th className="px-6 py-4 font-semibold">Monthly</th>
                  <th className="px-6 py-4 font-semibold">Yearly</th>
                  <th className="px-6 py-4 font-semibold">Discount</th>
                  <th className="px-6 py-4 font-semibold">Tags</th>
                  <th className="px-6 py-4 font-semibold">Features</th>
                  <th className="px-6 py-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {plans.map((plan) => (
                  <tr key={plan.id} className="align-top">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{plan.name}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 capitalize">{plan.planType}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{convertPrice(plan.monthlyPriceUsd)}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{convertPrice(plan.yearlyPriceUsd)}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      <div className="space-y-1 text-sm">
                        <div>Monthly: {plan.monthlyDiscountUsd}%</div>
                        <div>Yearly: {plan.yearlyDiscountUsd}%</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{(plan.tags || []).join(", ")}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{(plan.features || []).join(", ")}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      <button
                        type="button"
                        onClick={() => openEditPlan(plan)}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:hover:border-cyan-400 dark:hover:text-cyan-300"
                      >
                        <Icon icon="solar:pen-2-linear" width={14} />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}

                {plans.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400">No plans found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="animate-in fade-in zoom-in-95 rounded-2xl bg-white p-8 shadow-xl dark:bg-slate-950">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
                <Icon icon="solar:check-square-linear" width={24} className="text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Package Updated Successfully</h3>
                <p className="mt-1 text-slate-600 dark:text-slate-300">
                  <span className="font-medium">{successPackageName}</span> is updated successfully
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <Icon icon="solar:close-linear" width={24} />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
