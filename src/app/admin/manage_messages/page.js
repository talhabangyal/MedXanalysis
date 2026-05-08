"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { apiClient } from "@/lib/api-client";
// Database operations use API calls instead

const monthOptions = ["All", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function AdminManageMessagesPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("All");
  const [loading, setLoading] = useState(true);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.admin.getMessages();
      setMessages((data || []).map((m) => ({
        id: m.id,
        firstName: m.firstName || m.first_name || "",
        lastName: m.lastName || m.last_name || "",
        email: m.email,
        subject: m.subject,
        body: m.body || m.message || "",
        month: new Date(m.createdAt || m.created_at || Date.now()).toLocaleString("default", { month: "long" })
      })) || []);
    } catch (err) {
      console.error("Failed to load messages:", err);
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
        loadMessages();
      });
    }
  }, [loadMessages, currentUser]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this message?")) return;
    setLoading(true);
    try {
      await apiClient.admin.deleteMessage(id);
      await loadMessages();
    } catch (err) {
      console.error("Delete message error:", err);
      setLoading(false);
    }
  };

  const filteredMessages = useMemo(() => {
    if (selectedMonth === "All") return messages;
    return messages.filter((message) => message.month === selectedMonth);
  }, [selectedMonth, messages]);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manage Messages</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">Review user messages and reply quickly.</p>
      </div>

      <div className="max-w-sm space-y-2">
        <label htmlFor="message-month-filter" className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Filter by Month
        </label>
        <select
          id="message-month-filter"
          value={selectedMonth}
          onChange={(event) => setSelectedMonth(event.target.value)}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:focus:border-cyan-400"
        >
          {monthOptions.map((month) => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-semibold">First Name</th>
                <th className="px-6 py-4 font-semibold">Last Name</th>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold">Subject</th>
                <th className="px-6 py-4 font-semibold">Body</th>
                <th className="px-6 py-4 font-semibold">Reply</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredMessages.map((message) => (
                <tr key={message.id} className="align-top">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{message.firstName}</td>
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{message.lastName}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{message.email}</td>
                  <td className="px-6 py-4 text-slate-700 dark:text-slate-200">{message.subject}</td>
                  <td className="max-w-md px-6 py-4 text-slate-600 dark:text-slate-300">{message.body}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => window.open(`mailto:${message.email}?subject=Re: ${message.subject}`)}
                        aria-label={`Reply to ${message.firstName}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-cyan-400 dark:hover:text-cyan-300"
                      >
                        <Icon icon="solar:chat-round-linear" width={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(message.id)}
                        disabled={loading}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-rose-500 transition hover:border-rose-300 hover:bg-rose-50 dark:border-slate-700 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10"
                      >
                        <Icon icon="solar:trash-bin-trash-linear" width={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredMessages.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                    No messages found for the selected month.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
