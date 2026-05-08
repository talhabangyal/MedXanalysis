"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const sourceFilters = ["All", "Admin", "Client", "System"];

function sourceBadgeClass(source) {
  const s = source?.toLowerCase();
  if (s === "admin") return "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300";
  if (s === "client" || s === "user") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";
  return "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300";
}

export default function AdminActivitiesPage() {
  const [user, setUser] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [activeSource, setActiveSource] = useState("All");
  const [, setLoading] = useState(true);

  const loadActivities = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin?operation=activities');
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      const { data } = result;
      setActivityLogs((data || []).map(a => {
        const rawSource = (a.source || a.source_type || "").toString().toLowerCase();
        const sourceLabel = rawSource ? rawSource.charAt(0).toUpperCase() + rawSource.slice(1) : "Unknown";
        const created = a.created_at || a.createdAt || a.created || null;
        const dt = created ? new Date(created) : null;
        const time = dt && !isNaN(dt.getTime()) ? dt.toLocaleString() : '';

        return {
          id: a.id,
          name: (a.action || '').replace(/_/g, " ").toUpperCase(),
          log: a.description || a.message || '',
          source: rawSource,
          sourceLabel,
          time,
        };
      }));
    } catch (err) {
      console.error("Failed to load activities:", err);
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
        loadActivities();
      });
    }
  }, [loadActivities, user]);

  const filteredLogs = useMemo(() => {
    if (activeSource === "All") {
      // "All" should show admin and client activities only (exclude system-only logs)
      return activityLogs.filter((e) => {
        const s = (e.source || '').toLowerCase();
        return s === 'admin' || s === 'client' || s === 'user';
      });
    }

    const match = activeSource.toLowerCase();
    return activityLogs.filter((entry) => (entry.source || '').toLowerCase() === match);
  }, [activityLogs, activeSource]);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Activities</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          View activity logs from admin, and user with separate filters.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {sourceFilters.map((source) => (
          <button
            key={source}
            type="button"
            onClick={() => setActiveSource(source)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeSource === source
                ? "bg-blue-600 text-white dark:bg-cyan-400 dark:text-slate-950"
                : "border border-slate-200 bg-white text-slate-700 hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:text-cyan-300"
            }`}
          >
            {source}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-semibold">Name</th>
                <th className="px-6 py-4 font-semibold">Logs</th>
                <th className="px-6 py-4 font-semibold">Source</th>
                <th className="px-6 py-4 font-semibold">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredLogs.map((entry) => (
                <tr key={entry.id} className="align-top">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{entry.name}</td>
                  <td className="max-w-xl px-6 py-4 text-slate-600 dark:text-slate-300">{entry.log}</td>
                  <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${sourceBadgeClass(entry.source)}`}>
                        {entry.sourceLabel}
                      </span>
                  </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{entry.time || '—'}</td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                    No activity logs found for this filter.
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
