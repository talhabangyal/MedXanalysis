"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { apiClient } from '@/lib/api-client';
// Database operations use API calls via `apiClient`

export default function ClientSupportPage() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("create");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketBody, setTicketBody] = useState("");
  const [repliedTickets, setRepliedTickets] = useState([]);
  const [supportFile, setSupportFile] = useState(null);
  const [supportPreviewUrl, setSupportPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);

  function handleDragEnter(_e) {
    _e.preventDefault();
    _e.stopPropagation();
    setIsDragActive(true);
  }

  function handleDragLeave(_e) {
    _e.preventDefault();
    _e.stopPropagation();
    setIsDragActive(false);
  }

  function handleDragOver(_e) {
    _e.preventDefault();
    _e.stopPropagation();
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f && (f.type.startsWith('image/') || f.type === 'application/pdf')) {
      setSupportFile(f);
      try {
        const url = URL.createObjectURL(f);
        setSupportPreviewUrl(url);
      } catch {
        setSupportPreviewUrl(null);
      }
    }
  }

  function handleClearFile() {
    setSupportFile(null);
    if (supportPreviewUrl) {
      try {
        URL.revokeObjectURL(supportPreviewUrl);
      } catch {}
    }
    setSupportPreviewUrl(null);
  }

  function handleOpenTicketDetail(ticket) {
    setSelectedTicket(ticket);
    setReplyText("");
  }

  function handleCloseTicketDetail() {
    setSelectedTicket(null);
    setReplyText("");
  }

  async function handleSubmitReply(event) {
    event.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;
    setReplyLoading(true);

    try {
      await apiClient.admin.replyToSupport(selectedTicket.id, replyText.trim());
      setReplyText("");
      setStatusMessage("Reply sent successfully!");
      await loadTickets();
      handleCloseTicketDetail();
    } catch (err) {
      console.error("Failed to send reply:", err);
      setStatusMessage("Unable to send reply. Please try again.");
    } finally {
      setReplyLoading(false);
    }
  }

  const loadTickets = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await apiClient.client.getTickets(user.id);
      setRepliedTickets(data || []);
    } catch (err) {
      console.error("Failed to load tickets:", err);
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
        loadTickets();
      });
    }
  }, [loadTickets, user]);

  async function handleSubmitTicket(event) {
    event.preventDefault();
    if (!ticketSubject.trim() || !ticketBody.trim() || !user) return;
    setLoading(true);

    try {
      let imagePath = null;
      if (supportFile) {
        try {
          const upload = await apiClient.uploadSupport(supportFile, `${user.username || user.id}_support_${Date.now()}`);
          imagePath = upload?.path || null;
        } catch (upErr) {
          console.error('Support file upload failed:', upErr);
        }
      }

      await apiClient.client.createTicket({
        user_id: user.id,
        subject: ticketSubject.trim(),
        body: ticketBody.trim(),
        status: "open",
        image_url: imagePath,
      });

      await apiClient.client.createActivity({
        user_id: user.id,
        action: "create_ticket",
        description: `Created support ticket: ${ticketSubject}`,
        source: "client",
      });

      setTicketSubject("");
      setTicketBody("");
      setSupportFile(null);
      if (supportPreviewUrl) {
        try {
          URL.revokeObjectURL(supportPreviewUrl);
        } catch {}
      }
      setSupportPreviewUrl(null);
      setStatusMessage("Ticket submitted successfully. We will get back to you soon.");
      setActiveTab("view");
      loadTickets();
    } catch (err) {
      console.error("Failed to submit ticket:", err);
      setStatusMessage("Unable to submit ticket. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Support</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Create a new ticket or view replied support tickets.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => setActiveTab("create")} className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${activeTab === "create" ? "bg-blue-600 text-white dark:bg-cyan-400 dark:text-slate-950" : "border border-slate-200 bg-white text-slate-700 hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:text-cyan-300"}`}>
          <Icon icon="solar:add-circle-linear" width={18} />
          Create New Ticket
        </button>

        <button type="button" onClick={() => setActiveTab("view")} className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${activeTab === "view" ? "bg-blue-600 text-white dark:bg-cyan-400 dark:text-slate-950" : "border border-slate-200 bg-white text-slate-700 hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:text-cyan-300"}`}>
          <Icon icon="solar:chat-round-linear" width={18} />
          My Tickets
        </button>
      </div>

      {statusMessage && (
        <div className="rounded-xl bg-blue-50 p-4 text-sm font-medium text-blue-700 dark:bg-cyan-400/10 dark:text-cyan-300">
          {statusMessage}
        </div>
      )}

      {activeTab === "create" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
          <h2 className="mb-5 text-xl font-semibold">Describe Your Issue</h2>

          <form className="space-y-4" onSubmit={handleSubmitTicket}>
            <div className="space-y-2">
              <label htmlFor="ticket-subject" className="text-sm font-medium text-slate-700 dark:text-slate-200">Subject</label>
              <input 
                id="ticket-subject" 
                type="text" 
                value={ticketSubject} 
                onChange={(event) => setTicketSubject(event.target.value)} 
                placeholder="Briefly describe the topic" 
                className="h-11 w-full rounded-xl border border-slate-200 bg-transparent px-3 text-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:focus:border-cyan-400" 
                required 
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="ticket-body" className="text-sm font-medium text-slate-700 dark:text-slate-200">Message</label>
              <textarea 
                id="ticket-body" 
                rows={5} 
                value={ticketBody} 
                onChange={(event) => setTicketBody(event.target.value)} 
                placeholder="Provide details about your problem" 
                className="w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:focus:border-cyan-400" 
                required 
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="ticket-file" className="text-sm font-medium text-slate-700 dark:text-slate-200">Attach File (optional)</label>

              <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`relative rounded-xl border-2 border-dashed p-6 transition ${
                  isDragActive
                    ? 'border-blue-500 bg-blue-50 dark:border-cyan-400 dark:bg-cyan-400/5'
                    : 'border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/30'
                }`}
              >
                <input
                  id="ticket-file"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    if (f) {
                      setSupportFile(f);
                      try {
                        const url = URL.createObjectURL(f);
                        setSupportPreviewUrl(url);
                      } catch {
                        setSupportPreviewUrl(null);
                      }
                    }
                  }}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />

                <div className="flex flex-col items-center justify-center gap-3 py-4">
                  {!supportFile ? (
                    <>
                      <Icon icon="solar:upload-minimalistic-linear" width={32} className="text-slate-400 dark:text-slate-500" />
                      <div className="text-center">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Drag and drop an image or PDF
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          or click to browse
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Icon icon="solar:check-circle-linear" width={32} className="text-emerald-500" />
                      <div className="text-center">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {supportFile.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {(supportFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearFile}
                        className="mt-2 inline-flex items-center gap-1 rounded-full bg-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                      >
                        <Icon icon="solar:close-circle-linear" width={14} />
                        Clear
                      </button>
                    </>
                  )}
                </div>
              </div>

              {supportPreviewUrl && supportFile && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-3">Preview:</p>
                  <div className="rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 p-3">
                    {supportFile.type.startsWith('image/') ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={supportPreviewUrl} alt="preview" className="max-h-48 w-auto mx-auto rounded" />
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-32 text-slate-500">
                        <div className="text-center">
                          <Icon icon="solar:file-pdf-linear" width={48} className="mx-auto mb-2 text-red-500" />
                          <p className="text-sm font-medium">{supportFile.name}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 dark:bg-cyan-400 dark:text-slate-950 disabled:opacity-50"
            >
              {loading ? (
                <Icon icon="eos-icons:loading" width={18} />
              ) : (
                <Icon icon="solar:send-linear" width={18} />
              )}
              Submit Ticket
            </button>
          </form>
        </div>
      )}

      {activeTab === "view" && (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-5 font-semibold">Ticket ID</th>
                  <th className="px-6 py-5 font-semibold">Subject</th>
                  <th className="px-6 py-5 font-semibold">Status</th>
                  <th className="px-6 py-5 font-semibold">Created At</th>
                  <th className="px-6 py-5 font-semibold text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {loading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <Icon icon="eos-icons:loading" width={32} className="mx-auto text-blue-600 dark:text-cyan-400" />
                    </td>
                  </tr>
                )}
                
                {!loading && repliedTickets.map((ticket) => (
                  <tr key={ticket.id || ticket.id} className="group transition hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">#{(ticket.id || '').slice(0, 8).toUpperCase()}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{ticket.subject || ticket.subject}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        (ticket.status === 'open' || ticket.status === 'open') ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10' : 
                        (ticket.status === 'resolved' || ticket.status === 'resolved') ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10' : 
                        'bg-slate-100 text-slate-700 dark:bg-slate-500/10'
                      }`}>
                        {ticket.status || ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{new Date(ticket.created_at || ticket.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {((ticket.image_url || ticket.imageUrl || ticket.image)) && (
                          <a href={ticket.image_url || ticket.imageUrl || ticket.image} target="_blank" rel="noreferrer" className="inline-block">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={ticket.image_url || ticket.imageUrl || ticket.image} alt="attachment" className="h-10 w-10 rounded-md object-cover border" />
                          </a>
                        )}
                        <button type="button" onClick={() => handleOpenTicketDetail(ticket)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-cyan-400 dark:hover:text-cyan-300">
                          <Icon icon="solar:eye-linear" width={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!loading && repliedTickets.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-sm text-slate-500 dark:text-slate-400">
                      <Icon icon="solar:chat-round-linear" width={48} className="mx-auto mb-3 opacity-20" />
                      No support tickets yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-950">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Ticket #{(selectedTicket.id || '').slice(0, 8).toUpperCase()}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{selectedTicket.subject}</p>
              </div>
              <button
                type="button"
                onClick={handleCloseTicketDetail}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Icon icon="solar:close-circle-linear" width={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Icon icon="solar:calendar-linear" width={16} />
                {new Date(selectedTicket.created_at || selectedTicket.createdAt).toLocaleString()}
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Message</h3>
                <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/30 rounded-lg p-4">
                  {selectedTicket.body || selectedTicket.body}
                </p>
              </div>

              {(selectedTicket.image_url || selectedTicket.imageUrl || selectedTicket.image) && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Attachment</h3>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedTicket.image_url || selectedTicket.imageUrl || selectedTicket.image}
                    alt="ticket attachment"
                    className="max-h-64 w-auto rounded-lg border border-slate-200 dark:border-slate-700"
                  />
                </div>
              )}

              <div className="space-y-2 border-t border-slate-200 pt-4 dark:border-slate-700">
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</h3>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                    (selectedTicket.status === 'open' || selectedTicket.status === 'open')
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                      : (selectedTicket.status === 'resolved' || selectedTicket.status === 'resolved')
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400'
                  }`}
                >
                  {selectedTicket.status || selectedTicket.status}
                </span>
              </div>

              {selectedTicket.reply && (
                <div className="space-y-2 border-t border-slate-200 pt-4 dark:border-slate-700">
                  <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Admin Reply</h3>
                  <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg p-4">
                    {selectedTicket.reply}
                  </p>
                </div>
              )}

              {(!selectedTicket.reply || selectedTicket.status === 'open') && (
                <form onSubmit={handleSubmitReply} className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-700">
                  <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Add Response</h3>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Add any additional details or follow-up..."
                    rows={4}
                    className="w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:focus:border-cyan-400"
                  />
                  <button
                    type="submit"
                    disabled={replyLoading || !replyText.trim()}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 dark:bg-cyan-400 dark:text-slate-950 disabled:opacity-50"
                  >
                    {replyLoading ? (
                      <Icon icon="eos-icons:loading" width={16} />
                    ) : (
                      <Icon icon="solar:send-linear" width={16} />
                    )}
                    Send Response
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

