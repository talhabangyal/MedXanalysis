"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { apiClient } from '@/lib/api-client';

const quickAccess = [
  { label: "Upload Reports", href: "/client/upload-reports", icon: "solar:upload-linear", description: "Upload documents for review" },
  { label: "My Reports", href: "/client/report", icon: "solar:file-text-linear", description: "View analyzed reports" },
  { label: "Notifications", href: "/client/notifications", icon: "solar:bell-linear", description: "Check your alerts" },
  { label: "Subscription", href: "/client/subscription", icon: "solar:bookmark-linear", description: "Manage your plan" },
  { label: "Support", href: "/client/support", icon: "solar:help-linear", description: "Get help and support" },
  { label: "Settings", href: "/client/setting", icon: "solar:settings-linear", description: "Update preferences" },
  { label: "Profile", href: "/client/profile", icon: "solar:user-linear", description: "Edit your profile" },
];

function useInitialUser() {
  const [user] = useState(() => {
    const fromStorage = typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "null")
      : null;
    return fromStorage;
  });
  return user;
}

export default function ClientDashboardPage() {
  const user = useInitialUser();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState({
    summary: {
      activePlan: "Free",
      expiryDate: "Lifetime",
      reportsAnalyzed: 0,
      reportsThisWeek: 0,
      unreadNotifications: 0,
    },
    recentActivity: [],
    reportCategories: [
      { label: "Radiology", value: 0 },
      { label: "Pathology", value: 0 },
      { label: "Cardiology", value: 0 }
    ],
  });

  useEffect(() => {
    if (!user?.id) return;

    async function loadDashboard() {
      setLoading(true);
      try {
        const [reportsRes, notifsRes, activityRes, activeSub] = await Promise.all([
          apiClient.client.getReports(user.id),
          apiClient.client.getUnreadNotifications(user.id),
          apiClient.client.getActivities(user.id),
          apiClient.client.getActiveSubscription(user.id)
        ]);

        const reports = Array.isArray(reportsRes) ? reportsRes : [];
        const notifs = Array.isArray(notifsRes) ? notifsRes : [];
        const activities = Array.isArray(activityRes) ? activityRes : [];

        // Get active subscription data
        let activePlan = "Free";
        let expiryDate = "Lifetime";
        
        if (activeSub && activeSub.status === 'active') {
          const subscription = activeSub.subscription || {};
          activePlan = subscription.planName || "Free";
          expiryDate = !activeSub.endDate 
            ? "Lifetime" 
            : new Date(activeSub.endDate).toLocaleDateString();
        }

        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));

        setDashboard({
          summary: {
            activePlan,
            expiryDate,
            reportsAnalyzed: reports.length,
            reportsThisWeek: reports.filter(r => {
              const uploadDate = r.uploadDate || r.upload_date;
              return uploadDate && new Date(uploadDate) >= startOfWeek;
            }).length,
            unreadNotifications: notifs.length,
          },
          recentActivity: activities.map(a => ({
            title: a.action ? a.action.charAt(0).toUpperCase() + a.action.slice(1) : "Activity",
            meta: a.description || "",
            status: a.source || "system",
            time: a.createdAt || a.created_at ? new Date(a.createdAt || a.created_at).toLocaleString() : ""
          })) || [],
          reportCategories: [
            { label: "Radiology", value: reports.filter(r => r.reportType === 'Radiology' || r.report_type === 'Radiology').length },
            { label: "Pathology", value: reports.filter(r => r.reportType === 'Pathology' || r.report_type === 'Pathology').length },
            { label: "Cardiology", value: reports.filter(r => r.reportType === 'Cardiology' || r.report_type === 'Cardiology').length }
          ],
        });
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [user]);

  const categories = useMemo(() => {
    const total = dashboard.reportCategories.reduce((sum, item) => sum + item.value, 0);
    return dashboard.reportCategories.map((item, index) => {
      const palette = ["from-blue-500 to-cyan-400", "from-emerald-500 to-teal-400", "from-amber-500 to-orange-400", "from-violet-500 to-fuchsia-400"];
      return {
        ...item,
        percent: total > 0 ? Math.round((item.value / total) * 100) : 0,
        color: palette[index % palette.length],
      };
    });
  }, [dashboard.reportCategories]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="text-center">
          <Icon icon="eos-icons:loading" width={50} className="mx-auto mb-4 text-blue-600 dark:text-cyan-400" />
          <p className="text-slate-600 dark:text-slate-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-950">
      <div className="space-y-8 p-8">
        {/* Animated Header */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/50 bg-white/80 backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/50">
          <div className="absolute inset-0 bg-linear-to-r from-blue-500/10 via-cyan-500/10 to-teal-500/10 dark:from-blue-500/5 dark:via-cyan-500/5 dark:to-teal-500/5" />
          <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-blue-400/20 blur-3xl dark:bg-blue-600/10" />
          <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl dark:bg-cyan-600/10" />
          
          <div className="relative z-10 p-8">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <p className="text-sm font-semibold uppercase tracking-widest text-blue-600 dark:text-cyan-400">Welcome Back</p>
                <h1 className="mt-2 text-4xl font-black text-slate-900 dark:text-white">
                  Hey, {user?.firstName || "User"} 👋
                </h1>
                <p className="mt-3 text-lg text-slate-600 dark:text-slate-300">
                  Here&apos;s your medical dashboard overview for today
                </p>
              </div>
              <div className="hidden rounded-2xl bg-blue-100 p-6 dark:bg-blue-500/10 sm:block">
                <Icon icon="solar:smiley-linear" width={48} className="text-blue-600 dark:text-cyan-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Reports */}
          <div className="group relative overflow-hidden rounded-2xl border border-blue-200/50 bg-linear-to-br from-blue-50 to-blue-100/30 p-6 transition-all hover:border-blue-300 hover:shadow-lg dark:border-blue-900/30 dark:from-blue-950/30 dark:to-blue-900/20 dark:hover:border-blue-700/50">
            <div className="absolute -right-12 -top-12 h-24 w-24 rounded-full bg-blue-400/10 blur-3xl transition group-hover:scale-125" />
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-blue-100 p-2.5 dark:bg-blue-500/20">
                  <Icon icon="solar:files-linear" width={24} className="text-blue-600 dark:text-blue-400" />
                </div>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">+0</span>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-black text-slate-900 dark:text-white">{dashboard.summary.reportsAnalyzed}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Total Reports</p>
              </div>
            </div>
          </div>

          {/* This Week */}
          <div className="group relative overflow-hidden rounded-2xl border border-emerald-200/50 bg-linear-to-br from-emerald-50 to-emerald-100/30 p-6 transition-all hover:border-emerald-300 hover:shadow-lg dark:border-emerald-900/30 dark:from-emerald-950/30 dark:to-emerald-900/20 dark:hover:border-emerald-700/50">
            <div className="absolute -right-12 -top-12 h-24 w-24 rounded-full bg-emerald-400/10 blur-3xl transition group-hover:scale-125" />
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-emerald-100 p-2.5 dark:bg-emerald-500/20">
                  <Icon icon="solar:chart-2-linear" width={24} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">This week</span>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-black text-slate-900 dark:text-white">{dashboard.summary.reportsThisWeek}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">New Uploads</p>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="group relative overflow-hidden rounded-2xl border border-orange-200/50 bg-linear-to-br from-orange-50 to-orange-100/30 p-6 transition-all hover:border-orange-300 hover:shadow-lg dark:border-orange-900/30 dark:from-orange-950/30 dark:to-orange-900/20 dark:hover:border-orange-700/50">
            <div className="absolute -right-12 -top-12 h-24 w-24 rounded-full bg-orange-400/10 blur-3xl transition group-hover:scale-125" />
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-orange-100 p-2.5 dark:bg-orange-500/20">
                  <Icon icon="solar:bell-linear" width={24} className="text-orange-600 dark:text-orange-400" />
                </div>
                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700 dark:bg-orange-500/20 dark:text-orange-300">Unread</span>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-black text-slate-900 dark:text-white">{dashboard.summary.unreadNotifications}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Notifications</p>
              </div>
            </div>
          </div>

          {/* Active Plan */}
          <div className="group relative overflow-hidden rounded-2xl border border-violet-200/50 bg-linear-to-br from-violet-50 to-violet-100/30 p-6 transition-all hover:border-violet-300 hover:shadow-lg dark:border-violet-900/30 dark:from-violet-950/30 dark:to-violet-900/20 dark:hover:border-violet-700/50">
            <div className="absolute -right-12 -top-12 h-24 w-24 rounded-full bg-violet-400/10 blur-3xl transition group-hover:scale-125" />
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-violet-100 p-2.5 dark:bg-violet-500/20">
                  <Icon icon="solar:bookmark-linear" width={24} className="text-violet-600 dark:text-violet-400" />
                </div>
                <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">Active</span>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-black text-slate-900 dark:text-white">{dashboard.summary.activePlan}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Expires {dashboard.summary.expiryDate}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column */}
          <div className="space-y-6 lg:col-span-2">
            {/* Quick Actions */}
            <div className="overflow-hidden rounded-3xl border border-slate-200/50 bg-white/80 backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/50">
              <div className="border-b border-slate-200/50 px-8 py-6 dark:border-slate-700/50">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Quick Actions</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Access your most used features</p>
              </div>
              <div className="grid gap-4 p-8 sm:grid-cols-2">
                {quickAccess.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/50 bg-linear-to-br from-slate-50 to-slate-100/50 p-4 transition-all duration-300 hover:border-blue-300 hover:shadow-lg dark:border-slate-700/50 dark:from-slate-800/50 dark:to-slate-900/50 dark:hover:border-blue-600/50">
                      <div className="absolute inset-0 bg-linear-to-r from-blue-500/0 to-blue-500/0 transition group-hover:from-blue-500/5 group-hover:to-cyan-500/5" />
                      <div className="relative z-10">
                        <div className="mb-3 inline-block rounded-xl bg-blue-100 p-2 transition group-hover:scale-110 dark:bg-blue-500/20">
                          <Icon icon={item.icon} width={20} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <p className="font-semibold text-slate-900 transition group-hover:text-blue-600 dark:text-white dark:group-hover:text-cyan-400">{item.label}</p>
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{item.description}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Report Distribution */}
            <div className="overflow-hidden rounded-3xl border border-slate-200/50 bg-white/80 backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/50">
              <div className="border-b border-slate-200/50 px-8 py-6 dark:border-slate-700/50">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Report Distribution</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Breakdown by category</p>
              </div>
              <div className="space-y-6 p-8">
                {categories.length > 0 ? (
                  categories.map((item) => (
                    <div key={item.label} className="group">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`h-3 w-3 rounded-full bg-linear-to-r ${item.color}`} />
                          <span className="font-semibold text-slate-700 dark:text-slate-200">{item.label}</span>
                        </div>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{item.percent}% ({item.value})</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className={`h-full rounded-full bg-linear-to-r ${item.color} transition-all duration-500 group-hover:shadow-lg`}
                          style={{ width: `${item.percent}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-slate-500 dark:text-slate-400">No reports yet. Start uploading!</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Subscription Card */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200/50 bg-linear-to-br from-blue-600 via-cyan-500 to-teal-500 p-8 text-white shadow-xl dark:from-cyan-600 dark:via-blue-500 dark:to-cyan-500">
              <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
              
              <div className="relative z-10 space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/70">Your Current Plan</p>
                  <h3 className="mt-3 text-4xl font-black">{dashboard.summary.activePlan}</h3>
                </div>
                
                <div className="space-y-3 border-t border-white/20 pt-6">
                  <div>
                    <p className="text-xs font-medium text-white/70">Expires On</p>
                    <p className="mt-1 text-lg font-bold">{dashboard.summary.expiryDate}</p>
                  </div>
                </div>

                <Link href="/client/subscription">
                  <button className="w-full rounded-xl bg-white/20 px-4 py-3 font-semibold transition-all duration-300 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center gap-2 group">
                    <span>Manage Plan</span>
                    <Icon icon="solar:alt-arrow-right-linear" width={18} className="transition group-hover:translate-x-1" />
                  </button>
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="overflow-hidden rounded-3xl border border-slate-200/50 bg-white/80 backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/50">
              <div className="border-b border-slate-200/50 px-6 py-5 dark:border-slate-700/50">
                <h3 className="font-bold text-slate-900 dark:text-white">Recent Activity</h3>
              </div>
              <div className="max-h-96 overflow-y-auto p-6">
                {dashboard.recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {dashboard.recentActivity.slice(0, 5).map((activity, idx) => (
                      <div key={idx} className="group flex gap-3 rounded-lg transition hover:bg-slate-50 p-2 dark:hover:bg-slate-800/50">
                        <div className="mt-1">
                          <div className={`h-2 w-2 rounded-full ${
                            activity.status === 'admin' ? 'bg-emerald-500' :
                            activity.status === 'system' ? 'bg-violet-500' :
                            'bg-blue-500'
                          }`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-slate-900 dark:text-white text-sm">{activity.title}</p>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{activity.meta}</p>
                          <p className="mt-1 text-xs text-slate-400">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-sm text-slate-500 dark:text-slate-400">No activity yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
