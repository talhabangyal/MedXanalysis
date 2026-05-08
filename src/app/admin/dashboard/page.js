"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { apiClient } from "@/lib/api-client";
// Database operations use API calls instead


function formatPrice(value) {
  if (!value || value === 0) return "Free";
  return `$${value}`;
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
          tags: Array.isArray(parsed.tags) ? parsed.tags : [],
          details: Array.isArray(parsed.details) ? parsed.details : [],
        };
      }
      if (Array.isArray(parsed)) {
        return { planType: "individual", tags: [], details: parsed };
      }
    } catch {
      return { planType: "individual", tags: [], details: [] };
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

export default function AdminDashboardPage() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ totalUsers: 0, reports: 0, openSupport: 0, unreadAlerts: 0 });
  const [subscriptions, setSubscriptions] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [usersData, reportsData, supportData, notificationsData, subscriptionsData, activitiesData] = await Promise.all([
        apiClient.admin.getUsers(),
        apiClient.admin.getReports(),
        apiClient.admin.getSupport(),
        apiClient.admin.getNotifications(),
        apiClient.admin.getSubscriptions(),
        apiClient.admin.getActivities(),
      ]);

      const users = usersData || [];
      const reports = reportsData || [];
      const supportTickets = supportData || [];
      const notifications = notificationsData || [];
      const planList = subscriptionsData || [];
      const activitiesList = activitiesData || [];

      setStats({
        totalUsers: users.length || 0,
        reports: reports.length || 0,
        openSupport: supportTickets.filter((t) => ["open", "pending"].includes((t.status || "").toLowerCase())).length || 0,
        unreadAlerts: notifications.length || 0,
      });

      // Show subscription plans with proper details
      setSubscriptions(
        planList.slice(0, 10).map((p) => {
          const parsed = parsePackageFeatures(p.features);
          return {
            id: p.id,
            name: p.planName || "Unknown Plan",
            type: parsed.planType || "individual",
            monthlyPrice: Number(p.monthlyPrice || 0),
            yearlyPrice: Number(p.yearlyPrice || 0),
            monthlyDiscount: Number(p.monthlyDiscount || 0),
            yearlyDiscount: Number(p.yearlyDiscount || 0),
            tags: parsed.tags || [],
            features: (parsed.details || []).slice(0, 3), // Show top 3 features
            status: "active",
          };
        })
      );

      setActivities(
        activitiesList.slice(0, 5).map((a) => ({
          id: a.id,
          name: (a.action || "").replace(/_/g, " ").toUpperCase(),
          log: a.description,
          source: a.source,
          time: new Date(a.createdAt).toLocaleString(),
        }))
      );

    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

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
        loadDashboard();
      });
    }
  }, [loadDashboard, user]);

  const statsLoading = loading && !stats.totalUsers;

  if (statsLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Icon icon="eos-icons:loading" width={40} className="text-blue-600 dark:text-cyan-400" />
      </div>
    );
  }

  return (
    <section className="space-y-8">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white">Welcome back, Admin! 🎯</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">Manage users, reports, subscriptions, and system activities</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-linear-to-br from-blue-50 to-blue-100/50 p-6 transition hover:border-blue-300 dark:border-slate-800 dark:from-blue-950/30 dark:to-blue-900/20 dark:hover:border-blue-700">
          <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-blue-200 opacity-30 transition group-hover:scale-110 dark:bg-blue-400/20" />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Total Users</p>
                <p className="mt-3 text-4xl font-black text-slate-900 dark:text-white">{stats.totalUsers.toLocaleString()}</p>
              </div>
              <Icon icon="solar:users-group-rounded-linear" width={40} className="text-blue-500 opacity-40 transition group-hover:opacity-60" />
            </div>
            <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">Across all statuses</p>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-linear-to-br from-emerald-50 to-emerald-100/50 p-6 transition hover:border-emerald-300 dark:border-slate-800 dark:from-emerald-950/30 dark:to-emerald-900/20 dark:hover:border-emerald-700">
          <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-emerald-200 opacity-30 transition group-hover:scale-110 dark:bg-emerald-400/20" />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Reports</p>
                <p className="mt-3 text-4xl font-black text-slate-900 dark:text-white">{stats.reports.toLocaleString()}</p>
              </div>
              <Icon icon="solar:file-text-linear" width={40} className="text-emerald-500 opacity-40 transition group-hover:opacity-60" />
            </div>
            <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">Submitted documents</p>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-linear-to-br from-orange-50 to-orange-100/50 p-6 transition hover:border-orange-300 dark:border-slate-800 dark:from-orange-950/30 dark:to-orange-900/20 dark:hover:border-orange-700">
          <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-orange-200 opacity-30 transition group-hover:scale-110 dark:bg-orange-400/20" />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">Support</p>
                <p className="mt-3 text-4xl font-black text-slate-900 dark:text-white">{stats.openSupport.toLocaleString()}</p>
              </div>
              <Icon icon="solar:help-linear" width={40} className="text-orange-500 opacity-40 transition group-hover:opacity-60" />
            </div>
            <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">Open tickets</p>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-linear-to-br from-rose-50 to-rose-100/50 p-6 transition hover:border-rose-300 dark:border-slate-800 dark:from-rose-950/30 dark:to-rose-900/20 dark:hover:border-rose-700">
          <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-rose-200 opacity-30 transition group-hover:scale-110 dark:bg-rose-400/20" />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">Alerts</p>
                <p className="mt-3 text-4xl font-black text-slate-900 dark:text-white">{stats.unreadAlerts.toLocaleString()}</p>
              </div>
              <Icon icon="solar:bell-linear" width={40} className="text-rose-500 opacity-40 transition group-hover:opacity-60" />
            </div>
            <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">Unread notifications</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
        <div className="space-y-6">
          {/* Subscription Plans */}
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-950/70 overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Subscription Plans</h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Active packages available to users</p>
                </div>
                <Icon icon="solar:bookmark-linear" width={24} className="text-slate-400" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Plan Name</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Pricing</th>
                    <th className="px-6 py-4">Discount</th>
                    <th className="px-6 py-4">Features</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {subscriptions.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{item.name}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 capitalize dark:bg-slate-800 dark:text-slate-300">
                          {item.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs">{formatPrice(item.monthlyPrice)}/mo</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">{formatPrice(item.yearlyPrice)}/yr</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {Math.max(item.monthlyDiscount, item.yearlyDiscount) > 0 ? (
                          <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-500/15 dark:text-red-300">
                            {Math.max(item.monthlyDiscount, item.yearlyDiscount)}% OFF
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500 dark:text-slate-400">No discount</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {item.features.slice(0, 2).map((feature, idx) => (
                            <span
                              key={idx}
                              className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-400/10 dark:text-blue-300 truncate max-w-25"
                              title={feature}
                            >
                              {feature.substring(0, 12)}...
                            </span>
                          ))}
                          {item.features.length > 2 && (
                            <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              +{item.features.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {subscriptions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <Icon icon="solar:inbox-line-duotone" width={40} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                        <p className="text-sm text-slate-500 dark:text-slate-400">No subscription plans found.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <aside className="space-y-6">
          {/* System Status Card */}
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-950/70">
            <div className="relative overflow-hidden bg-linear-to-br from-indigo-600 via-purple-500 to-pink-500 p-6 text-white dark:from-indigo-600 dark:via-purple-500 dark:to-pink-400">
              <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
              <div className="relative z-10 space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest opacity-80">System Status</p>
                  <h3 className="mt-3 text-3xl font-black">Operational</h3>
                </div>
                <div className="border-t border-white/20 pt-4">
                  <p className="text-xs font-medium opacity-80">Active Plans</p>
                  <p className="mt-1 text-sm font-bold">{subscriptions.length} Packages</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-lg bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                  <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  All Systems Operational
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-950/70">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Activity Log</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Recent actions</p>
              </div>
              <Icon icon="solar:history-linear" width={24} className="text-slate-400" />
            </div>
            <div className="space-y-3">
              {activities.map((entry) => (
                <div key={entry.id} className="group flex gap-3 rounded-lg transition hover:bg-slate-50 p-2 dark:hover:bg-slate-800/50">
                  <div className="mt-1 h-2 w-2 rounded-full shrink-0 bg-blue-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{entry.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{entry.log}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{entry.time}</p>
                  </div>
                </div>
              ))}

              {activities.length === 0 && (
                <div className="rounded-lg bg-slate-50 p-4 text-center dark:bg-slate-900/30">
                  <p className="text-sm text-slate-500 dark:text-slate-400">No activity logs yet.</p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
