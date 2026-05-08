"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import useHelper from "./helper.jsx";
import { apiClient } from "@/lib/api-client";

const roleConfigs = {
  admin: {
    dashboardHref: "/admin/dashboard",
    profileHref: "/admin/admin_profile",
    notificationHref: "/admin/notifications",
    sections: [
      {
        title: "Main",
        items: [
          { label: "Dashboard", href: "/admin/dashboard", icon: "solar:home-2-linear" },
          { label: "Manage User", href: "/admin/manage_user", icon: "solar:users-group-rounded-linear" },
          { label: "Manage Report", href: "/admin/manage_report", icon: "solar:file-text-linear" },
          { label: "Manage Subscription", href: "/admin/manage_subscription", icon: "solar:bookmark-linear" },
          { label: "Manage Support", href: "/admin/manage_support", icon: "solar:chat-round-linear" },
          { label: "Manage Messages", href: "/admin/manage_messages", icon: "solar:letter-linear" },
          { label: "Notifications", href: "/admin/notifications", icon: "solar:bell-linear" },
        ],
      },
      {
        title: "Account",
        items: [
          { label: "Admin Setting", href: "/admin/admin_setting", icon: "solar:settings-linear" },
          { label: "Activities", href: "/admin/activities", icon: "solar:chart-square-linear" },
          { label: "Admin Profile", href: "/admin/admin_profile", icon: "solar:user-linear" },
          { label: "Logs", href: "/admin/logs", icon: "solar:bug-linear" },
        ],
      },
    ],
  },
  client: {
    dashboardHref: "/client/dashboard",
    profileHref: "/client/profile",
    notificationHref: "/client/notifications",
    sections: [
      {
        title: "Main",
        items: [
          { label: "Dashboard", href: "/client/dashboard", icon: "solar:home-linear" },
          { label: "Upload Reports", href: "/client/upload-reports", icon: "solar:upload-linear" },
          { label: "Report", href: "/client/report", icon: "solar:file-text-linear" },
          { label: "Notifications", href: "/client/notifications", icon: "solar:bell-linear" },
        ],
      },
      {
        title: "Account",
        items: [
          { label: "Support", href: "/client/support", icon: "solar:help-linear" },
          { label: "Subscription", href: "/client/subscription", icon: "solar:bookmark-linear" },
          { label: "Setting", href: "/client/setting", icon: "solar:settings-linear" },
          { label: "Profile", href: "/client/profile", icon: "solar:user-linear" },
        ],
      },
    ],
  },
};

function formatSegment(segment) {
  return segment
    .split("-")
    .join(" ")
    .split("_")
    .join(" ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function DashboardShell({ role, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { darkMode, toggleTheme } = useHelper();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const notificationRef = useRef(null);

  const loadHeaderNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      let mapped = [];

      if (role === "admin") {
        const data = await apiClient.admin.getNotifications(user.id);
        mapped = (data || []).map((n) => {
          const note = n.notifications || n;
          return {
            subject: note.subject || "Notification",
            body: note.body || "",
            time: new Date(note.created_at || note.createdAt || Date.now()).toLocaleDateString(),
            unread: !(n.is_read ?? n.isRead ?? false),
          };
        });
      } else {
        const data = await apiClient.client.getNotifications(user.id);
        // data may be userNotification records with a nested `notifications` field
        mapped = (data || []).map((n) => {
          const note = n.notifications || n;
          return {
            subject: note.subject || "Notification",
            body: note.body || "",
            time: new Date(note.created_at || note.createdAt || Date.now()).toLocaleDateString(),
            unread: !(n.is_read ?? n.isRead ?? false),
          };
        });
      }

      setNotifications(mapped);
    } catch (err) {
      console.error("Shell notification error:", err);
    }
  }, [role, user]);

  useEffect(() => {
    const fromStorage = typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "null")
      : null;
    
    if (!fromStorage?.id) {
      router.replace("/auth/login");
      return;
    }

    // Role Restriction: Ensure user can't access unauthorized portal
    if (fromStorage.role !== role) {
      const correctPath = fromStorage.role === 'admin' ? '/admin/dashboard' : '/client/dashboard';
      router.replace(correctPath);
      return;
    }

    queueMicrotask(() => {
      setUser(fromStorage);
    });

    // 15-minute Logout after no activity
    let timeoutId;
    const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes

    const logout = () => {
      localStorage.removeItem("user");
      sessionStorage.removeItem("user");
      router.replace("/auth/login");
    };

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(logout, INACTIVITY_LIMIT);
    };

    const handleActivity = () => resetTimer();

    resetTimer();

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("click", handleActivity);
    window.addEventListener("scroll", handleActivity);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("scroll", handleActivity);
    };
  }, [router, role]);

  useEffect(() => {
    if (user?.id) {
      queueMicrotask(() => {
        loadHeaderNotifications();
      });
    }
  }, [loadHeaderNotifications, user]);

  useEffect(() => {
    if (notificationOpen && user?.id) {
      queueMicrotask(() => {
        loadHeaderNotifications();
      });
    }
  }, [loadHeaderNotifications, notificationOpen, user]);

  // Listen for notifications update event from other components
  useEffect(() => {
    const handleNotificationsUpdated = () => {
      if (user?.id) {
        queueMicrotask(() => {
          loadHeaderNotifications();
        });
      }
    };

    window.addEventListener('notificationsUpdated', handleNotificationsUpdated);
    return () => window.removeEventListener('notificationsUpdated', handleNotificationsUpdated);
  }, [loadHeaderNotifications, user]);

  // Refresh user profile data periodically to reflect image/profile updates
  useEffect(() => {
    if (!user?.id) return;

    const refreshUserProfile = async () => {
      try {
        const data = await apiClient.client.getProfile(user.id);
        if (data) {
          setUser((prev) => ({
            ...prev,
            image: data.image || data.profileImage || prev.image,
            first_name: data.first_name || data.firstName || prev.first_name,
            last_name: data.last_name || data.lastName || prev.last_name,
            email: data.email || prev.email,
            username: data.username || prev.username,
            role: data.role || prev.role,
          }));
        }
      } catch (err) {
        console.error("Failed to refresh user profile:", err);
      }
    };

    // Refresh every 30 seconds
    const interval = setInterval(refreshUserProfile, 30000);

    // Also listen for storage changes (when profile is updated in another tab/window)
    const handleStorageChange = (e) => {
      if (e.key === "user" && e.newValue) {
        try {
          const updatedUser = JSON.parse(e.newValue);
          if (updatedUser?.id) {
            setUser(updatedUser);
          }
        } catch (err) {
          console.error("Failed to parse updated user from storage:", err);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [user?.id]);

  const unreadCount = useMemo(() => notifications.filter((item) => item.unread).length, [notifications]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const config = roleConfigs[role] || roleConfigs.client;

  const closeOverlays = () => {
    setSidebarOpen(false);
    setNotificationOpen(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setNotificationOpen(false);
      setSidebarOpen(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  const routeTrail = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1] || "dashboard";

    return {
      roleLabel: formatSegment(segments[0] || role),
      pageLabel: formatSegment(lastSegment),
    };
  }, [pathname, role]);

  const isActive = (href) => pathname === href;

  const firstName = user?.first_name || user?.firstName;
  const lastName = user?.last_name || user?.lastName;
  const userDisplayName = user ? (firstName ? `${firstName} ${lastName || ''}` : user.username || user.email.split('@')[0]) : "User";
  
  const getRoleLabel = (role) => {
    const roleMap = {
      admin: 'Administrator',
      client: 'Client',
      doctor: 'Doctor',
      enterprise: 'Enterprise',
    };
    return roleMap[role] || role || 'User';
  };
  
  const userRoleLabel = getRoleLabel(user?.role);
  const profileImage = user?.image || user?.profileImage || `/profile/profile.png`;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eef4ff_100%)] text-slate-900 dark:bg-[linear-gradient(180deg,#020617_0%,#0f172a_100%)] dark:text-slate-100">
      <div className="flex min-h-screen">
        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close sidebar backdrop"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-slate-900/35"
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-64 -translate-x-full flex-col justify-between overflow-y-auto border-r border-slate-100 bg-white/90 shadow-[4px_0_24px_rgba(0,0,0,0.02)] backdrop-blur-xl transition-transform duration-300 dark:border-slate-800 dark:bg-slate-950/85 ${
            sidebarOpen ? "translate-x-0" : ""
          }`}
        >
          <div>
            <div className="flex h-20 items-center border-b border-slate-100 px-4 dark:border-slate-800">
              <Link href={config.dashboardHref} onClick={closeOverlays} className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-lg shadow-blue-600/30 dark:bg-cyan-400 dark:text-slate-950">
                  <span className="text-lg font-semibold">M</span>
                </div>
                <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  MEDX<span className="text-blue-600 dark:text-cyan-300">ANALYSIS</span>
                </span>
              </Link>
            </div>

            <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-6">
              {config.sections.map((section) => (
                <div key={section.title}>
                  <p className="mb-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {section.title}
                  </p>
                  <div className="space-y-1">
                    {section.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeOverlays}
                        className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all duration-200 ${
                          isActive(item.href)
                            ? "bg-blue-50 font-medium text-blue-600 dark:bg-cyan-400/10 dark:text-cyan-300"
                            : "text-slate-500 hover:bg-slate-50 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-cyan-300"
                        }`}
                      >
                        <Icon icon={item.icon} width={20} />
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </div>

          <div className="border-t border-slate-100 p-4 dark:border-slate-800">
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  localStorage.removeItem("user");
                  sessionStorage.removeItem("user");
                }
                router.replace("/auth/login");
              }}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-slate-500 transition-all duration-200 hover:bg-slate-50 hover:text-rose-500 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-rose-400"
            >
              <Icon icon="solar:logout-2-linear" width={20} />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        <div className={`flex min-h-screen w-full flex-col transition-[padding] duration-300 ${sidebarOpen ? "lg:pl-64" : "lg:pl-0"}`}>
          <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-100 bg-white/80 px-4 backdrop-blur-xl sm:px-6 lg:px-10 dark:border-slate-800 dark:bg-slate-950/70">
            <div className="flex items-center gap-4">
              <button
                type="button"
                aria-label="Toggle sidebar"
                  onClick={() => {
                    setNotificationOpen(false);
                    setSidebarOpen((prev) => !prev);
                  }}
                className="rounded-lg p-1 text-slate-500 transition hover:text-blue-600 dark:text-slate-300 dark:hover:text-cyan-300"
              >
                <Icon icon="solar:hamburger-menu-linear" width={24} />
              </button>

              <nav className="hidden items-center text-sm font-medium text-slate-400 sm:flex">
                <span className="transition-colors hover:text-blue-600 dark:hover:text-cyan-300">{routeTrail.roleLabel}</span>
                <Icon icon="solar:alt-arrow-right-linear" width={14} className="mx-2" />
                <span className="text-blue-600 dark:text-cyan-300">{routeTrail.pageLabel}</span>
              </nav>
            </div>

            <div className="flex items-center gap-4 md:gap-6">
              <button
                type="button"
                onClick={toggleTheme}
                title="Toggle dark mode"
                className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:text-blue-600 dark:border-slate-700 dark:text-slate-300 dark:hover:text-cyan-300"
              >
                {darkMode ? (
                  <Icon icon="solar:moon-linear" width={20} className="text-indigo-300" />
                ) : (
                  <Icon icon="solar:sun-2-linear" width={20} className="text-yellow-500" />
                )}
              </button>

              <div className="relative" ref={notificationRef}>
                <button
                  type="button"
                  aria-label="Toggle notifications"
                  onClick={() => setNotificationOpen((prev) => !prev)}
                  className="relative rounded-full p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-cyan-300"
                >
                  <Icon icon="solar:bell-linear" width={22} />
                  {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notificationOpen && (
                  <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
                    <div className="border-b border-slate-200 p-4 dark:border-slate-700">
                      <h3 className="font-semibold text-slate-800 dark:text-slate-100">Notifications</h3>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length > 0 ? notifications.slice(0, 5).map((item, idx) => (
                        <div
                          key={idx}
                          className={`border-b border-slate-100 p-4 last:border-b-0 dark:border-slate-800 ${
                            item.unread ? "bg-blue-50/50 dark:bg-cyan-400/5" : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Icon
                              icon="solar:bell-linear"
                              width={20}
                              className={item.unread ? "mt-1 text-blue-600 dark:text-cyan-300" : "mt-1 text-slate-400"}
                            />
                            <div>
                              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{item.subject}</p>
                              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{item.body}</p>
                              <p className="mt-1 text-[10px] text-slate-400">{item.time}</p>
                            </div>
                          </div>
                        </div>
                      )) : (
                        <div className="p-8 text-center text-xs text-slate-400">No recent notifications</div>
                      )}
                    </div>

                    <div className="border-t border-slate-200 p-3 text-center dark:border-slate-700">
                      <Link href={config.notificationHref} onClick={closeOverlays} className="text-sm text-blue-600 hover:underline dark:text-cyan-300 font-semibold">
                        View all notifications
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <Link href={config.profileHref} onClick={closeOverlays} className="group flex cursor-pointer items-center gap-3 border-l border-slate-200 pl-4 dark:border-slate-700">
                <div className="hidden text-right md:block">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold text-slate-900 transition-colors group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-cyan-300">
                      {userDisplayName}
                    </span>
                    <Icon icon="solar:check-circle-bold" width={16} className="text-blue-500" />
                  </div>
                  <p className="text-[10px] uppercase font-bold tracking-tighter text-slate-400">{userRoleLabel}</p>
                </div>

                <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-white dark:border-slate-800 shadow-sm transition-transform group-hover:scale-105">
                  <Image
                    src={profileImage}
                    alt="Profile"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </Link>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10">{children}</main>

          <footer className="mt-4 flex flex-col items-center justify-between border-t border-slate-200 px-4 pb-4 pt-6 text-center text-xs text-slate-400 sm:flex-row sm:text-left lg:px-10 dark:border-slate-800">
            <p>&copy; 2024 MedxAnalysis. All rights reserved.</p>
            <div className="mt-2 flex gap-4 sm:mt-0">
              <Link href="/pages/privacy-policy" className="transition hover:text-blue-600 dark:hover:text-cyan-300">
                Privacy Policy
              </Link>
              <Link href="/pages/term-and-conditions" className="transition hover:text-blue-600 dark:hover:text-cyan-300">
                Terms of Service
              </Link>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}



