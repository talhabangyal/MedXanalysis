"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { apiClient } from "@/lib/api-client";

export default function ClientNotificationsPage() {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAsRead, setMarkingAsRead] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await apiClient.client.getNotifications(user.id);
      setNotifications((data || []).map((n) => ({
        id: n.id,
        subject: n.notifications?.subject || n.subject || '',
        body: n.notifications?.body || n.body || '',
        time: n.notifications?.created_at ? new Date(n.notifications.created_at).toLocaleString() : (n.createdAt ? new Date(n.createdAt).toLocaleString() : ''),
        unread: !(n.is_read ?? n.isRead ?? false),
      })));
    } catch (err) {
      console.error("Failed to load notifications:", err);
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
        loadNotifications();
      });
    }
  }, [loadNotifications, user]);

  const unreadCount = useMemo(() => notifications.filter((item) => item.unread).length, [notifications]);

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;
    setMarkingAsRead(true);
    try {
      await apiClient.client.markNotificationsAsRead(user.id);
      await loadNotifications();
      window.dispatchEvent(new CustomEvent('notificationsUpdated'));
    } catch (err) {
      console.error("Failed to mark notifications as read:", err);
      alert("Failed to mark notifications as read. Please try again.");
    } finally {
      setMarkingAsRead(false);
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Notifications</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">Stay updated with your report status and system alerts.</p>
      </div>

      {loading && (
        <div className="flex justify-center p-12">
          <Icon icon="eos-icons:loading" width={32} className="animate-spin text-blue-600 dark:text-cyan-400" />
        </div>
      )}

      {!loading && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/70 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Total: {notifications.length} | Unread: {unreadCount}</p>
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={markingAsRead}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-400 hover:text-emerald-600 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:border-emerald-400 dark:hover:text-emerald-300"
            >
              {markingAsRead ? (
                <Icon icon="eos-icons:loading" width={14} className="animate-spin" />
              ) : (
                <Icon icon="solar:check-circle-linear" width={14} />
              )}
              {markingAsRead ? 'Marking as read...' : 'Mark all as read'}
            </button>
          </div>

          <div className="space-y-3">
            {notifications.map((item) => (
              <article key={item.id} className={`rounded-xl border p-4 transition ${item.unread ? "border-blue-200 bg-blue-50/70 dark:border-cyan-500/30 dark:bg-cyan-400/5" : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.subject}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{item.body}</p>
                  </div>
                  <span className="shrink-0 text-[10px] text-slate-500 dark:text-slate-400">{item.time}</span>
                </div>
              </article>
            ))}
            {notifications.length === 0 && (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                <Icon icon="solar:bell-off-linear" width={48} className="mx-auto mb-3 opacity-20" />
                <p>No notifications found.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
