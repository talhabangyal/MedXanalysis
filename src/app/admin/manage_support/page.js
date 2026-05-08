"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { apiClient } from "@/lib/api-client";
// Database operations use API calls instead

const monthOptions = ["All", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const statusOptions = ["All", "Open", "Pending", "Replied", "Closed"];
const editableStatusOptions = ["open", "pending", "replied", "closed"];

function statusClass(status) {
  const s = status?.toLowerCase();
  if (s === "open") return "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300";
  if (s === "pending") return "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300";
  if (s === "replied" || s === "closed") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";
  return "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200";
}

export default function AdminManageSupportPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [, setLoading] = useState(true);
  
  // Reply Modal State
  const [replyTicket, setReplyTicket] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replyStatus, setReplyStatus] = useState("replied");
  const [savingReply, setSavingReply] = useState(false);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const [ticketData, usersData] = await Promise.all([
        apiClient.admin.getSupport(),
        apiClient.admin.getUsers(),
      ]);

      const usersById = new Map((usersData || []).map((u) => [u.id, u]));

      setTickets((ticketData || []).map((t) => {
        const linkedUser = usersById.get(t.userId || t.user_id || "");
        const firstName = linkedUser?.firstName || linkedUser?.first_name || "";
        const lastName = linkedUser?.lastName || linkedUser?.last_name || "";
        const name = `${firstName} ${lastName}`.trim() || linkedUser?.username || "Unknown User";
        const email = linkedUser?.email || "N/A";

        return {
          id: t.id,
          name,
          email,
          question: t.subject || "No subject",
          body: t.body || t.message || "",
          image: t.image || t.imageUrl || t.image_url || "",
          rawStatus: (t.status || "pending").toLowerCase(),
          status: (t.status || "pending").charAt(0).toUpperCase() + (t.status || "pending").slice(1),
          month: new Date(t.createdAt || t.created_at || Date.now()).toLocaleString('default', { month: 'long' }),
          createdAt: t.createdAt || t.created_at,
        };
      }) || []);
    } catch (err) {
      console.error("Failed to load tickets:", err);
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
        loadTickets();
      });
    }
  }, [loadTickets, currentUser]);

  const handleSaveReply = async () => {
    if (!replyTicket) return;
    if (!replyText.trim()) return;

    setSavingReply(true);
    try {
      await apiClient.admin.updateSupportTicket(replyTicket.id, {
        reply: replyText.trim(),
        status: replyStatus,
      });

      await apiClient.admin.createActivity({
        user_id: currentUser.id,
        action: "reply_support",
        description: `Updated ticket #${replyTicket.id} to ${replyStatus} and sent a reply`,
        source: "admin"
      });

      setReplyTicket(null);
      setReplyText("");
      setReplyStatus("replied");
      await loadTickets();
    } catch (err) {
      console.error("Reply error:", err);
    } finally {
      setSavingReply(false);
    }
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const monthMatch = selectedMonth === "All" || ticket.month === selectedMonth;
      const statusMatch = selectedStatus === "All" || ticket.status === selectedStatus;
      return monthMatch && statusMatch;
    });
  }, [tickets, selectedMonth, selectedStatus]);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manage Support</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">View customer support queries and reply quickly.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="support-month-filter" className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Filter by Month
          </label>
          <select
            id="support-month-filter"
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

        <div className="space-y-2">
          <label htmlFor="support-status-filter" className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Filter by Support Status
          </label>
          <select
            id="support-status-filter"
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(event.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:focus:border-cyan-400"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-semibold">Name</th>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold">Question</th>
                <th className="px-6 py-4 font-semibold">Body</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Reply</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="align-top">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{ticket.name}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{ticket.email}</td>
                  <td className="px-6 py-4 text-slate-700 dark:text-slate-200">{ticket.question}</td>
                  <td className="max-w-md px-6 py-4 text-slate-600 dark:text-slate-300">{ticket.body}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => {
                        setReplyTicket(ticket);
                        setReplyText("");
                        setReplyStatus(ticket.rawStatus || "replied");
                      }}
                      aria-label={`Open ${ticket.name} ticket`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-cyan-400 dark:hover:text-cyan-300"
                    >
                      <Icon icon="solar:chat-round-linear" width={18} />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredTickets.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                    No support records found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {replyTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-950 max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Support Ticket Details</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Review subject, body, image, update status, and send a reply.</p>
              </div>
              <button onClick={() => setReplyTicket(null)} className="text-slate-500 hover:text-rose-500">
                <Icon icon="solar:close-circle-linear" width={24} />
              </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Subject</p>
                  <p className="mt-1 text-base font-semibold text-slate-900 dark:text-white">{replyTicket.question}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Body</p>
                  <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{replyTicket.body}</p>
                </div>

                {replyTicket.image && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Attachment</p>
                    <div className="relative aspect-16/10 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                      <Image src={replyTicket.image} alt="Support attachment" fill className="object-contain" unoptimized />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Current Status</p>
                  <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass(replyTicket.status)}`}>
                    {replyTicket.status}
                  </span>
                </div>

                <div className="space-y-2">
                  <label htmlFor="support-status" className="text-sm font-medium text-slate-700 dark:text-slate-200">Update Status</label>
                  <select
                    id="support-status"
                    value={replyStatus}
                    onChange={(e) => setReplyStatus(e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:focus:border-cyan-400"
                  >
                    {editableStatusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="support-reply" className="text-sm font-medium text-slate-700 dark:text-slate-200">Send Reply</label>
                  <textarea
                    id="support-reply"
                    rows={8}
                    placeholder="Write your response here..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-transparent p-4 text-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:focus:border-cyan-400"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setReplyTicket(null)}
                className="rounded-full border border-slate-200 px-6 py-2.5 text-sm font-semibold transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveReply}
                disabled={savingReply || (!replyText.trim() && !replyStatus)}
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 dark:bg-cyan-400 dark:text-slate-950 disabled:opacity-50"
              >
                {savingReply && <Icon icon="eos-icons:loading" width={18} />}
                Save & Send Reply
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
