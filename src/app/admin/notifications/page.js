"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { apiClient } from "@/lib/api-client";

export default function ClientNotificationsPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("view");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [, setLoading] = useState(true);
  const [markingAsRead, setMarkingAsRead] = useState(false);

  const loadNotifications = useCallback(async (userId) => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await apiClient.admin.getNotifications(userId);
      setNotifications((data || []).map((n) => {
        const note = n.notifications || n;
        return {
          id: n.id,
          subject: note.subject || n.subject || "",
          body: note.body || n.body || "",
          time: note.created_at ? new Date(note.created_at).toLocaleString() : (note.createdAt ? new Date(note.createdAt).toLocaleString() : ""),
          unread: !(n.is_read ?? n.isRead ?? false),
        };
      }));
    } catch (err) {
      console.error("Failed to load notifications:", err);
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
        setCurrentUser(fromStorage);
      });
    } else {
      queueMicrotask(() => {
        setLoading(false);
      });
    }
  }, []);

  useEffect(() => {
    if (currentUser?.id) {
      queueMicrotask(() => {
        loadNotifications(currentUser.id);
      });
    }
  }, [loadNotifications, currentUser]);

  const handleAddNotification = async (event) => {
    event.preventDefault();
    if (!subject.trim() || !body.trim() || !currentUser) return;
    setLoading(true);

    try {
      await apiClient.admin.createNotification({
        subject: subject.trim(),
        body: body.trim(),
        created_by: currentUser.id
      });

      await apiClient.admin.createActivity({
        user_id: currentUser.id,
        action: "broadcast_notification",
        description: `Broadcasted: ${subject}`,
        source: "admin"
      });

      setSubject("");
      setBody("");
      setActiveTab("view");
      await loadNotifications(currentUser.id);
    } catch (err) {
      console.error("Add notification error:", err);
      setLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!currentUser?.id) return;
    setMarkingAsRead(true);
    try {
      await apiClient.client.markNotificationsAsRead(currentUser.id);
      await loadNotifications(currentUser.id);

      window.dispatchEvent(new CustomEvent('notificationsUpdated'));
    } catch (err) {
      console.error("Failed to mark notifications as read:", err);
      alert("Failed to mark notifications as read. Please try again.");
    } finally {
      setMarkingAsRead(false);
    }
  };

  const unreadCount = useMemo(() => notifications.filter((item) => item.unread).length, [notifications]);


  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Notifications</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">Create notifications and monitor unread/read status.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => setActiveTab("add")} className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${activeTab === "add" ? "bg-blue-600 text-white dark:bg-cyan-400 dark:text-slate-950" : "border border-slate-200 bg-white text-slate-700 hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:text-cyan-300"}`}>
          <Icon icon="solar:add-circle-linear" width={18} />
          Add Notification
        </button>

        <button type="button" onClick={() => setActiveTab("view")} className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${activeTab === "view" ? "bg-blue-600 text-white dark:bg-cyan-400 dark:text-slate-950" : "border border-slate-200 bg-white text-slate-700 hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:text-cyan-300"}`}>
          <Icon icon="solar:bell-linear" width={18} />
          View All Notifications
        </button>

        <button
          type="button"
          onClick={handleMarkAllAsRead}
          disabled={markingAsRead}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-400 hover:text-emerald-600 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-emerald-400 dark:hover:text-emerald-300"
        >
          {markingAsRead ? (
            <Icon icon="eos-icons:loading" width={18} />
          ) : (
            <Icon icon="solar:check-circle-linear" width={18} />
          )}
          {markingAsRead ? 'Marking as Read...' : 'Mark All as Read'}
        </button>
      </div>

      {activeTab === "add" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
          <h2 className="mb-5 text-xl font-semibold">Add Notification</h2>

          <form onSubmit={handleAddNotification} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="notification-subject" className="text-sm font-medium text-slate-700 dark:text-slate-200">Subject</label>
              <input id="notification-subject" type="text" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Enter notification subject" className="h-11 w-full rounded-xl border border-slate-200 bg-transparent px-3 text-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:focus:border-cyan-400" required />
            </div>

            <div className="space-y-2">
              <label htmlFor="notification-body" className="text-sm font-medium text-slate-700 dark:text-slate-200">Body</label>
              <textarea id="notification-body" rows={5} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Enter notification message" className="w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:focus:border-cyan-400" required />
            </div>

            <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 dark:bg-cyan-400 dark:text-slate-950">
              <Icon icon="solar:diskette-linear" width={18} />
              Save Notification
            </button>
          </form>
        </div>
      )}

      {activeTab === "view" && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/70 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Total: {notifications.length} | Unread: {unreadCount}</p>
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

